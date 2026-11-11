import {
  GENDER_OPTIONS,
  DOCUMENT_TYPES,
  EMAIL_REGEX,
  PATIENT_STATUS_STYLES,
} from "../../util/constants";
import {
  Container,
  Paper,
  Stack,
  Group,
  TextInput,
  Textarea,
  Button,
  Title,
  Alert,
  ActionIcon,
  Grid,
  Select,
  Tabs,
  Text,
  Input,
  SimpleGrid,
  Badge,
} from "@mantine/core";
import { IconPlus, IconTrash, IconUserShield } from "@tabler/icons-react";
import { useToast } from "../../components/feedback/feedbackContext";
import { patientService } from "../../services/patientService";
import type { CreatePatientRequest } from "../../types/create-patient";
import { emergencyContactService } from "../../services/emergencyContactService";
import type { GetEmergencyContact } from "../../types/get-emergency-contact";
import { useRoles } from "../../hooks/useRoles";
import { specialistService } from "../../services/specialistService";
import type { Specialist } from "../../data/http/specialistsApi";
import { PatientClinicalRecord } from "./PatientClinicalRecord";
import { PhoneInput } from "../../components/PhoneInput";
import { useEffect, useState, type FormEvent } from "react";
import { ChangeStatusModal } from "./ChangeStatusModal";

type PatientEditFormProps = {
  editingPatientId: string | null;
  onCancel: () => void;
  onSaveSuccess: () => void;
};

export function PatientEditForm({
  editingPatientId,
  onCancel,
  onSaveSuccess,
}: PatientEditFormProps) {
  const [error, setError] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false); // Para disparar los errores en los inputs
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [patientForm, setPatientForm] = useState({
    firstName: "",
    lastName: "",
    email: null as string | null,
    phoneNumber: "",
    birthdate: null as string | null,
    notes: "",
    specialistId: "",
    documentType: null as string | null,
    documentNumber: "",
    preferredName: "",
    addressLine: "",
    preferredLanguage: "",
    genderIdentity: null as string | null,
    status: null as string | null,
  });
  const [activePatientForStatus, setActivePatientForStatus] = useState({
    id: null as string | null,
    status: null as string | null,
    firstName: "",
    lastName: "",
  });
  const [emergencyContacts, setEmergencyContacts] = useState<
    GetEmergencyContact[]
  >([]);
  const { can } = useRoles();
  const canAssignSpecialist = can("patients.assignSpecialist");
  const canReadClinical = can("clinical.read");
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  function updateContact(index: number, changes: Partial<GetEmergencyContact>) {
    setEmergencyContacts((current) =>
      current.map((c, i) => (i === index ? { ...c, ...changes } : c)),
    );
  }

  async function handleEmergencyContactsSubmit(patientId: string) {
    const savedContacts = await emergencyContactService.get(patientId);
    const savedById = new Map(
      savedContacts.map((contact) => [contact.emergencyContactId, contact]),
    );
    const submittedIds = new Set(
      emergencyContacts
        .map((contact) => contact.emergencyContactId)
        .filter((id): id is string => Boolean(id)),
    );

    await Promise.all(
      emergencyContacts.map(({ emergencyContactId, ...contact }) =>
        emergencyContactId
          ? emergencyContactService.update(
              patientId,
              emergencyContactId,
              contact,
            )
          : emergencyContactService.create(patientId, contact),
      ),
    );

    await Promise.all(
      [...savedById.keys()]
        .filter(
          (emergencyContactId): emergencyContactId is string =>
            Boolean(emergencyContactId) &&
            !submittedIds.has(emergencyContactId as string),
        )
        .map((emergencyContactId) =>
          emergencyContactService.delete(patientId, emergencyContactId),
        ),
    );
  }

  async function handlePatientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");

    const isEmailValid =
      !patientForm.email ||
      patientForm.email.trim() === "" ||
      EMAIL_REGEX.test(patientForm.email);
    const isFormValid =
      isEmailValid &&
      isPhoneValid &&
      patientForm.firstName.trim() !== "" &&
      patientForm.lastName.trim() !== "";

    const hasInvalidEmergencyContacts = emergencyContacts.some(
      (contact) =>
        !contact.isPhoneValid ||
        contact.relationship.trim() === "" ||
        contact.firstName.trim() === "" ||
        contact.lastName.trim() === "",
    );

    if (!isFormValid || hasInvalidEmergencyContacts) {
      setShowValidationErrors(true);
      setError(
        "Por favor, corrige los campos marcados en rojo antes de continuar.",
      );
      return;
    }

    const request: CreatePatientRequest = {
      ...patientForm,
      email: patientForm.email?.trim() === "" ? null : patientForm.email,
      specialistId: canAssignSpecialist
        ? patientForm.specialistId || null
        : undefined,
    };

    const isNew = !editingPatientId;
    setSaving(true);
    try {
      if (editingPatientId) {
        await patientService
          .update(editingPatientId, request)
          .then(async () => {
            await handleEmergencyContactsSubmit(editingPatientId ?? "");
          });
      } else {
        await patientService.create(request).then(async (createdPatient) => {
          editingPatientId = createdPatient.id;
          await handleEmergencyContactsSubmit(editingPatientId ?? "");
        });
      }

      toast.success(
        isNew
          ? "Paciente registrado satisfactoriamente"
          : "Paciente actualizado satisfactoriamente",
      );
      onSaveSuccess();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el paciente",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChangeStatusModal() {
    setIsChangeStatusModalOpen(true);
    setActivePatientForStatus({
      id: editingPatientId,
      firstName: patientForm.firstName,
      lastName: patientForm.lastName,
      status: patientForm.status,
    });
  }

  useEffect(() => {
    if (!editingPatientId) return;

    (async () => {
      try {
        const fullPatient = await patientService.getById(editingPatientId);
        const emergencyContacts =
          await emergencyContactService.get(editingPatientId);
        if (canAssignSpecialist) {
          setSpecialists(await specialistService.getAll());
        }
        setPatientForm({
          firstName: fullPatient.firstName,
          lastName: fullPatient.lastName,
          email: fullPatient.email ?? null,
          phoneNumber: fullPatient.phoneNumber ?? "",
          birthdate: fullPatient.birthdate ?? null,
          notes: fullPatient.notes ?? "",
          specialistId: fullPatient.specialist?.id ?? "",
          documentType: fullPatient.documentType ?? null,
          documentNumber: fullPatient.documentNumber ?? "",
          preferredName: fullPatient.preferredName ?? "",
          addressLine: fullPatient.addressLine ?? "",
          preferredLanguage: fullPatient.preferredLanguage ?? "",
          genderIdentity: fullPatient.genderIdentity ?? null,
          status: fullPatient.status ?? "",
        });
        setEmergencyContacts(emergencyContacts ?? []);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el paciente",
        );
      }
    })();
  }, [editingPatientId, canAssignSpecialist]);

  async function handleQuickStatusChange(patientId: string, newStatus: string) {
    try {
      const fullPatient = await patientService.updateStatus(
        patientId,
        newStatus,
      );
      setPatientForm((prev) => ({
        ...prev,
        status: fullPatient.status ?? "",
      }));
      toast.success("Estado del paciente actualizado satisfactoriamente");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el paciente",
      );
    }
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="lg" radius="md" mb="lg">
        {/* Header con título y botón Nueva Cita */}
        <Group justify="space-between" align="center" mb="lg">
          {/* Lado izquierdo: Título y (opcionalmente) el estado actual si estás editando */}
          <Group gap="md" align="center">
            {editingPatientId ? (
              <>
                <Title order={2} style={{ margin: 0 }}>
                  {patientForm.firstName} {patientForm.lastName}
                </Title>
                <Badge
                  variant="light"
                  size="sm"
                  color={
                    PATIENT_STATUS_STYLES[patientForm.status ?? ""]?.color ||
                    "gray"
                  }
                >
                  {PATIENT_STATUS_STYLES[patientForm.status ?? ""]?.label ||
                    patientForm.status}
                </Badge>
              </>
            ) : (
              <Title order={2} style={{ margin: 0 }}>
                {"Nuevo Paciente"}
              </Title>
            )}
          </Group>

          <Group gap="md" align="center">
            {/* El selector de  estado solo se muestra si estamos en modo Edición */}
            {editingPatientId && (
              <Button
                size="xs"
                variant="light"
                onClick={handleOpenChangeStatusModal}
              >
                Cambiar estado
              </Button>
            )}
            {/* Lado derecho: Botón de cancelar / volver */}
            <Button variant="default" onClick={onCancel} disabled={saving}>
              Volver a pacientes
            </Button>
          </Group>
        </Group>

        <Tabs defaultValue="general" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="general">Datos generales</Tabs.Tab>
            {canReadClinical && (
              <Tabs.Tab value="anamnesis" disabled={!editingPatientId}>
                Anamnesis
              </Tabs.Tab>
            )}
            {canReadClinical && (
              <Tabs.Tab value="progress" disabled={!editingPatientId}>
                Evolución
              </Tabs.Tab>
            )}
          </Tabs.List>
          {!editingPatientId && canReadClinical && (
            <Text size="sm" c="dimmed" mt="sm">
              Guarda primero el paciente. Luego podrás registrar su anamnesis y
              evolución desde la edición.
            </Text>
          )}
          <Tabs.Panel value="general" pt="md">
            <form onSubmit={handlePatientSubmit} noValidate>
              <Stack gap="md">
                {/* Error Alert */}
                {error && (
                  <Alert title="Error" color="red">
                    {error}
                  </Alert>
                )}

                {/* Datos Personales */}
                <Grid align="flex-end">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Nombre"
                      placeholder="Ej. Ana"
                      required
                      maxLength={100}
                      value={patientForm.firstName}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      error={
                        showValidationErrors && !patientForm.firstName.trim()
                          ? "El nombre es obligatorio"
                          : undefined
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Apellido"
                      placeholder="Ej. García"
                      required
                      maxLength={100}
                      value={patientForm.lastName}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                      error={
                        showValidationErrors && !patientForm.lastName.trim()
                          ? "El apellido es obligatorio"
                          : undefined
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Correo electrónico"
                      type="email"
                      maxLength={100}
                      placeholder="ana@correo.com"
                      value={patientForm.email || ""}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      error={
                        showValidationErrors &&
                        (!patientForm.email ||
                          patientForm.email.trim() == "" ||
                          !EMAIL_REGEX.test(patientForm.email))
                          ? "Ingresa un correo electrónico válido"
                          : undefined
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PhoneInput
                      className="text-field"
                      label="Teléfono/Celular de contacto"
                      required
                      value={patientForm.phoneNumber}
                      onChange={(fullPhone, isValid) => {
                        setIsPhoneValid(isValid);
                        setPatientForm((current) => ({
                          ...current,
                          phoneNumber: fullPhone,
                        }));
                      }}
                      error={
                        showValidationErrors && !patientForm.phoneNumber
                          ? "El teléfono es obligatorio"
                          : ""
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Fecha de nacimiento"
                      type="date"
                      value={patientForm.birthdate || ""}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          birthdate: event.target.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Input.Wrapper label="Documento" required={false}>
                      <Group gap={8} wrap="nowrap" mt={4}>
                        {/* Selector de Tipo de documento */}
                        <Select
                          data={DOCUMENT_TYPES}
                          value={patientForm.documentType}
                          onChange={(value) =>
                            setPatientForm((current) => ({
                              ...current,
                              documentType: value || null,
                            }))
                          }
                          allowDeselect={false}
                          searchable
                          style={{ width: "130px" }}
                          styles={{
                            input: {
                              fontWeight: 500,
                            },
                          }}
                        />

                        {/* Input para el tipo de documento */}
                        <TextInput
                          className="text-field"
                          placeholder="Número de documento"
                          value={patientForm.documentNumber}
                          onChange={(event) =>
                            setPatientForm((current) => ({
                              ...current,
                              documentNumber: event.target.value,
                            }))
                          }
                          style={{ flex: 1 }}
                          maxLength={15}
                        />
                      </Group>
                    </Input.Wrapper>
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col key="addressLine" span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Dirección"
                      maxLength={255}
                      value={patientForm.addressLine}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          addressLine: event.target.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col key="genderIdentity" span={{ base: 12, sm: 6 }}>
                    <Select
                      className="text-field"
                      label="Género"
                      value={patientForm.genderIdentity}
                      onChange={(value) =>
                        setPatientForm((current) => ({
                          ...current,
                          genderIdentity: value || null,
                        }))
                      }
                      data={GENDER_OPTIONS}
                    />
                  </Grid.Col>
                </Grid>

                {/* Especislita asignado */}
                {canAssignSpecialist && (
                  <Select
                    label="Especialista asignado"
                    placeholder="Seleccione un especialista"
                    data={specialists.map((specialist) => ({
                      value: specialist.id,
                      label: `${specialist.firstName} ${specialist.lastName}`,
                    }))}
                    value={patientForm.specialistId}
                    onChange={(value) =>
                      setPatientForm((current) => ({
                        ...current,
                        specialistId: value || "",
                      }))
                    }
                  />
                )}

                {/* Notas */}
                <Textarea
                  className="text-field"
                  label="Notas administrativas"
                  placeholder="No incluir contenido clínico; utiliza Anamnesis o Evolución"
                  rows={4}
                  maxLength={500}
                  value={patientForm.notes}
                  onChange={(event) =>
                    setPatientForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />

                {/* Contactos de emergencia */}
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Title order={4}>Contactos de emergencia</Title>
                    <Button
                      variant="default"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      onClick={() =>
                        setEmergencyContacts((current) => [
                          ...current,
                          {
                            firstName: "",
                            lastName: "",
                            phoneNumber: "",
                            relationship: "",
                            isPhoneValid: false,
                          },
                        ])
                      }
                    >
                      Agregar contacto
                    </Button>
                  </Group>
                  {emergencyContacts.map((contact, index) => (
                    <Paper
                      key={index}
                      withBorder
                      p="md"
                      radius="md"
                      mb="md"
                      style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
                    >
                      <Group justify="space-between" mb="sm">
                        <Group gap="xs">
                          <IconUserShield
                            size={18}
                            color="var(--mantine-color-blue-6)"
                          />
                          <Text size="sm" fw={600} c="dimmed">
                            Contacto de emergencia #{index + 1}
                          </Text>
                        </Group>

                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="lg"
                          aria-label="Quitar contacto"
                          onClick={() =>
                            setEmergencyContacts((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                        <TextInput
                          className="text-field"
                          label="Nombre"
                          required
                          maxLength={100}
                          style={{ minWidth: "150px", flex: 1 }}
                          value={contact.firstName}
                          onChange={(event) =>
                            updateContact(index, {
                              firstName: event.target.value,
                            })
                          }
                          error={
                            showValidationErrors &&
                            contact.firstName.trim() === ""
                              ? "El nombre es obligatorio"
                              : undefined
                          }
                        />
                        <TextInput
                          className="text-field"
                          label="Apellido"
                          required
                          maxLength={100}
                          style={{ minWidth: "150px", flex: 1 }}
                          value={contact.lastName}
                          onChange={(event) =>
                            updateContact(index, {
                              lastName: event.target.value,
                            })
                          }
                          error={
                            showValidationErrors &&
                            contact.lastName.trim() === ""
                              ? "El apellido es obligatorio"
                              : undefined
                          }
                        />
                        <Select
                          label="Relación"
                          data={[
                            "PADRE",
                            "MADRE",
                            "HERMANO",
                            "HERMANA",
                            "HIJO",
                            "HIJA",
                            "ESPOSO",
                            "ESPOSA",
                            "AMIGO",
                            "AMIGA",
                            "SOBRINO",
                            "SOBRINA",
                            "TIO",
                            "TIA",
                            "PRIMA",
                            "PRIMO",
                            "OTRO",
                          ]}
                          required
                          style={{ flex: 1 }}
                          value={contact.relationship}
                          onChange={(value) =>
                            updateContact(index, { relationship: value ?? "" })
                          }
                          error={
                            showValidationErrors &&
                            contact.relationship.trim() === ""
                              ? "La relación es requerida"
                              : undefined
                          }
                        />
                        <div
                          style={{ gridColumn: "span 2", maxWidth: "420px" }}
                        >
                          <PhoneInput
                            className="text-field"
                            label="Teléfono/Celular de contacto"
                            required
                            value={contact.phoneNumber}
                            onChange={(fullPhone, isValid) => {
                              updateContact(index, {
                                phoneNumber: fullPhone,
                                isPhoneValid: isValid,
                              });
                            }}
                            error={
                              showValidationErrors && !contact.isPhoneValid
                                ? "El número de teléfono es inválido"
                                : undefined
                            }
                          />
                        </div>
                      </SimpleGrid>
                    </Paper>
                  ))}
                </Stack>

                {/* Botones de acción */}
                <Group justify="flex-end" mt="lg">
                  <Button
                    variant="default"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving}>
                    Guardar paciente
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
          {canReadClinical && editingPatientId && (
            <>
              <Tabs.Panel value="anamnesis">
                <PatientClinicalRecord
                  key={`anamnesis-${editingPatientId}`}
                  patientId={editingPatientId}
                  section="anamnesis"
                />
              </Tabs.Panel>
              <Tabs.Panel value="progress">
                <PatientClinicalRecord
                  key={`progress-${editingPatientId}`}
                  patientId={editingPatientId}
                  section="progress"
                />
              </Tabs.Panel>
            </>
          )}
        </Tabs>
      </Paper>

      <ChangeStatusModal
        open={isChangeStatusModalOpen}
        patient={activePatientForStatus}
        onClose={() => {
          setActivePatientForStatus({
            ...activePatientForStatus,
            status: activePatientForStatus?.status ?? "",
          });
          setIsChangeStatusModalOpen(false);
        }}
        onConfirm={async (patientId, newStatus) => {
          await handleQuickStatusChange(patientId, newStatus);
        }}
      />
    </Container>
  );
}

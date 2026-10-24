import { useEffect, useState, type FormEvent } from "react";
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
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { patientService } from "../../services/patientService";
import type { CreatePatientRequest } from "../../types/create-patient";
import { emergencyContactService } from "../../services/emergencyContactService";
import type { GetEmergencyContact } from "../../types/get-emergency-contact";
import { useRoles } from "../../hooks/useRoles";
import { specialistService } from "../../services/specialistService";
import type { Specialist } from "../../data/http/specialistsApi";
import { PatientClinicalRecord } from "./PatientClinicalRecord";
import { PhoneInput } from "../../components/PhoneInput";

const DOCUMENT_TYPES = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CE", label: "Carné de extranjería" },
  { value: "OTRO", label: "Otro" },
];

const administrativeFields = [
  { key: "addressLine", label: "Dirección", maxLength: 255 },
  {
    key: "genderIdentity",
    label: "Identidad de género (opcional)",
    maxLength: 100,
  },
] as const;

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
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [patientForm, setPatientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    birthdate: "",
    notes: "",
    specialistId: "",
    documentType: "",
    documentNumber: "",
    preferredName: "",
    addressLine: "",
    preferredLanguage: "",
    genderIdentity: "",
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
    setError("");

    const request: CreatePatientRequest = {
      ...patientForm,
      specialistId: canAssignSpecialist
        ? patientForm.specialistId || null
        : undefined,
    };

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

      setShowSuccessToast(true);
      setTimeout(() => {
        onSaveSuccess();
      }, 1500);
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
          email: fullPatient.email ?? "",
          phoneNumber: fullPatient.phoneNumber ?? "",
          birthdate: fullPatient.birthdate ?? "",
          notes: fullPatient.notes ?? "",
          specialistId: fullPatient.specialist?.id ?? "",
          documentType: fullPatient.documentType ?? "",
          documentNumber: fullPatient.documentNumber ?? "",
          preferredName: fullPatient.preferredName ?? "",
          addressLine: fullPatient.addressLine ?? "",
          preferredLanguage: fullPatient.preferredLanguage ?? "",
          genderIdentity: fullPatient.genderIdentity ?? "",
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

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="lg" radius="md" mb="lg">
        {/* Header con título y botón Nueva Cita */}
        <Group justify="space-between" mb="lg">
          <Title order={2}>
            {editingPatientId ? "Editar Paciente" : "Nuevo Paciente"}
          </Title>
          <Button variant="default" onClick={onCancel} disabled={saving}>
            Volver a pacientes
          </Button>
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
            <form onSubmit={handlePatientSubmit}>
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
                      value={patientForm.firstName}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Apellido"
                      placeholder="Ej. García"
                      required
                      value={patientForm.lastName}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Correo electrónico"
                      type="email"
                      required
                      placeholder="ana@correo.com"
                      value={patientForm.email}
                      onChange={(event) =>
                        setPatientForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PhoneInput
                      label="Teléfono/Celular de contacto"
                      required
                      value={patientForm.phoneNumber}
                      onChange={(fullPhone) =>
                        setPatientForm((current) => ({
                          ...current,
                          phoneNumber: fullPhone,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      className="text-field"
                      label="Fecha de nacimiento"
                      type="date"
                      value={patientForm.birthdate}
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
                              documentType: value || "",
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
                  {administrativeFields.map(({ key, label, maxLength }) => (
                    <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
                      <TextInput
                        className="text-field"
                        label={label}
                        maxLength={maxLength}
                        value={patientForm[key]}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </Grid.Col>
                  ))}
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
                          },
                        ])
                      }
                    >
                      Agregar contacto
                    </Button>
                  </Group>
                  {emergencyContacts.map((contact, index) => (
                    <Group key={index} align="flex-end" wrap="nowrap">
                      <TextInput
                        className="text-field"
                        label="Nombre"
                        required
                        style={{ flex: 1 }}
                        value={contact.firstName}
                        onChange={(event) =>
                          updateContact(index, {
                            firstName: event.target.value,
                          })
                        }
                      />
                      <TextInput
                        className="text-field"
                        label="Apellido"
                        required
                        style={{ flex: 1 }}
                        value={contact.lastName}
                        onChange={(event) =>
                          updateContact(index, { lastName: event.target.value })
                        }
                      />
                      <TextInput
                        className="text-field"
                        label="Celular"
                        type="tel"
                        required
                        style={{ flex: 1 }}
                        value={contact.phoneNumber}
                        onChange={(event) =>
                          updateContact(index, {
                            phoneNumber: event.target.value,
                          })
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
                      />
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
                  ))}
                </Stack>

                {/* Botones de acción */}
                <Group justify="flex-end" mt="lg">
                  <Button variant="default" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving}>
                    {saving ? "Guardando..." : "Guardar paciente"}
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

      {/* Toast de éxito */}
      <Snackbar
        open={showSuccessToast}
        autoHideDuration={5000}
        onClose={() => setShowSuccessToast(false)}
      >
        <MUIAlert
          severity="success"
          variant="filled"
          onClose={() => setShowSuccessToast(false)}
        >
          Paciente registrado satisfactoriamente
        </MUIAlert>
      </Snackbar>
    </Container>
  );
}

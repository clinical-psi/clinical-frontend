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
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { patientService } from "../services/patientService";
import type { CreatePatientRequest } from "../types/create-patient";
import { emergencyContactService } from "../services/emergencyContactService";
import type { GetEmergencyContact } from "../types/get-emergency-contact";

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
  });
  const [emergencyContacts, setEmergencyContacts] = useState<
    GetEmergencyContact[]
  >([]);

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
    };

    setSaving(true);
    try {
      if (editingPatientId) {
        await patientService.update(editingPatientId, request);
      } else {
        await patientService.create(request);
      }
      await handleEmergencyContactsSubmit(editingPatientId ?? "");
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
        const emergencyContacts =
          await emergencyContactService.get(editingPatientId);
        const fullPatient = await patientService.getById(editingPatientId);
        setPatientForm({
          firstName: fullPatient.firstName,
          lastName: fullPatient.lastName,
          email: fullPatient.email ?? "",
          phoneNumber: fullPatient.phoneNumber ?? "",
          birthdate: fullPatient.birthdate ?? "",
          notes: fullPatient.notes ?? "",
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
  }, [editingPatientId]);

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="lg" radius="md" mb="lg">
        {/* Header con título y botón Nueva Cita */}
        <Group justify="space-between" mb="lg">
          <Title order={2}>
            {editingPatientId ? "Editar Paciente" : "Nuevo Paciente"}
          </Title>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Nueva cita"
            title="Nueva cita"
            disabled
          >
            <IconPlus size={20} />
          </ActionIcon>
        </Group>

        {/* Formulario */}
        <form onSubmit={handlePatientSubmit}>
          <Stack gap="md">
            {/* Error Alert */}
            {error && (
              <Alert title="Error" color="red">
                {error}
              </Alert>
            )}

            {/* Datos Personales */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
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
                <TextInput
                  label="Celular"
                  type="tel"
                  required
                  placeholder="+51 987 654 321"
                  value={patientForm.phoneNumber}
                  onChange={(event) =>
                    setPatientForm((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
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
            </Grid>

            {/* Notas */}
            <Textarea
              label="Notas"
              placeholder="Información relevante para la atención"
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
                    label="Nombre"
                    required
                    style={{ flex: 1 }}
                    value={contact.firstName}
                    onChange={(event) =>
                      updateContact(index, { firstName: event.target.value })
                    }
                  />
                  <TextInput
                    label="Apellido"
                    required
                    style={{ flex: 1 }}
                    value={contact.lastName}
                    onChange={(event) =>
                      updateContact(index, { lastName: event.target.value })
                    }
                  />
                  <TextInput
                    label="Celular"
                    type="tel"
                    required
                    style={{ flex: 1 }}
                    value={contact.phoneNumber}
                    onChange={(event) =>
                      updateContact(index, { phoneNumber: event.target.value })
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

import { useState, type FormEvent } from "react";
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
} from "@mantine/core";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { specialistService } from "../services/specialistService";

type SpecialistEditFormProps = {
  onCancel: () => void;
  onSaveSuccess: () => void;
};

export function SpecialistEditForm({
  onCancel,
  onSaveSuccess,
}: SpecialistEditFormProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [specialistForm, setSpecialistForm] = useState({
    firstName: "",
    lastName: "",
    notes: "",
  });

  async function handleSpecialistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!specialistForm.firstName.trim() || !specialistForm.lastName.trim()) {
      setError("Nombre y apellido son requeridos");
      return;
    }

    const request = {
      firstName: specialistForm.firstName.trim(),
      lastName: specialistForm.lastName.trim(),
      notes: specialistForm.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      await specialistService.create(request);
      setShowSuccessToast(true);
      setTimeout(() => {
        onSaveSuccess();
      }, 1500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el especialista",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="lg" radius="md" mb="lg">
        {/* Header */}
        <Title order={2} mb="lg">
          Nuevo Especialista
        </Title>

        {/* Formulario */}
        <form onSubmit={handleSpecialistSubmit}>
          <Stack gap="md">
            {/* Error Alert */}
            {error && (
              <Alert title="Error" color="red">
                {error}
              </Alert>
            )}

            {/* Datos Personales */}
            <TextInput
              label="Nombre *"
              placeholder="Ej. Juan"
              required
              value={specialistForm.firstName}
              onChange={(event) =>
                setSpecialistForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
            />

            <TextInput
              label="Apellido *"
              placeholder="Ej. Pérez"
              required
              value={specialistForm.lastName}
              onChange={(event) =>
                setSpecialistForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
            />

            {/* Notas */}
            <Textarea
              label="Notas (opcional)"
              placeholder="Ej. Especialista en terapia cognitiva"
              rows={4}
              value={specialistForm.notes}
              onChange={(event) =>
                setSpecialistForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />

            {/* Botones de acción */}
            <Group justify="flex-end" mt="lg">
              <Button variant="default" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                {saving ? "Guardando..." : "Guardar especialista"}
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
          Especialista registrado satisfactoriamente
        </MUIAlert>
      </Snackbar>
    </Container>
  );
}

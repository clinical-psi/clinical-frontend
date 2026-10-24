import { useEffect, useState, type FormEvent } from "react";
import {
  Container,
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  Button,
  Title,
  Alert,
  Checkbox,
  Avatar,
  FileInput,
  Loader,
} from "@mantine/core";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { specialistService } from "../../services/specialistService";

type SpecialistEditFormProps = {
  editingSpecialistId?: string;
  onCancel: () => void;
  onSaveSuccess: () => void;
};

export function SpecialistEditForm({
  editingSpecialistId,
  onCancel,
  onSaveSuccess,
}: SpecialistEditFormProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [specialistForm, setSpecialistForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    notes: "",
    userId: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [createUser, setCreateUser] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Al crear aun no hay id: la foto queda pendiente y se sube tras el POST
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  async function handlePhotoChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    setError("");

    if (!editingSpecialistId) {
      setPendingPhoto(file);
      setPhotoUrl(URL.createObjectURL(file));
      return;
    }

    setUploadingPhoto(true);
    try {
      await specialistService.uploadPhoto(editingSpecialistId, file);
      const refreshed = await specialistService.getById(editingSpecialistId);
      setPhotoUrl(refreshed.photoUrl ?? null);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "No se pudo subir la foto",
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  useEffect(() => {
    if (!editingSpecialistId) return;

    (async () => {
      try {
        const fullSpecialist =
          await specialistService.getById(editingSpecialistId);
        setSpecialistForm({
          firstName: fullSpecialist.firstName,
          lastName: fullSpecialist.lastName,
          email: fullSpecialist.email ?? "",
          phoneNumber: fullSpecialist.phoneNumber ?? "",
          notes: fullSpecialist.notes ?? "",
          userId: fullSpecialist.user?.userId ?? "",
        });
        setUserId(fullSpecialist.user?.userId ?? null);
        setPhotoUrl(fullSpecialist.photoUrl ?? null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el paciente",
        );
      }
    })();
  }, [editingSpecialistId]);

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
      email: specialistForm.email.trim() || undefined,
      phoneNumber: specialistForm.phoneNumber.trim() || undefined,
      notes: specialistForm.notes.trim() || undefined,
      createUser: createUser || undefined,
    };

    setSaving(true);
    try {
      if (editingSpecialistId) {
        await specialistService.update(editingSpecialistId, request);
      } else {
        const created = await specialistService.create(request);
        if (pendingPhoto) {
          await specialistService.uploadPhoto(created.id, pendingPhoto);
        }
      }
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
          {editingSpecialistId ? "Editar Especialista" : "Nuevo Especialista"}
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

            {/* Foto de perfil */}
            <Group>
              <Avatar
                src={photoUrl}
                size={80}
                radius="xl"
                name={`${specialistForm.firstName} ${specialistForm.lastName}`}
              />
              <FileInput
                label="Foto de perfil"
                placeholder="Seleccionar imagen"
                accept="image/*"
                disabled={uploadingPhoto}
                rightSection={uploadingPhoto ? <Loader size="xs" /> : undefined}
                onChange={handlePhotoChange}
              />
            </Group>

            {/* Datos Personales */}
            <TextInput
              label="Nombre"
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
              label="Apellido"
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

            <TextInput
              label="Email"
              type="email"
              placeholder="Ej. juan@correo.com"
              value={specialistForm.email}
              onChange={(event) =>
                setSpecialistForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />

            <TextInput
              label="Teléfono"
              placeholder="Ej. 999888777"
              value={specialistForm.phoneNumber}
              onChange={(event) =>
                setSpecialistForm((current) => ({
                  ...current,
                  phoneNumber: event.target.value,
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

            {!userId ? (
              <Checkbox
                label="Registrar usuario"
                checked={createUser}
                onChange={(event) => setCreateUser(event.currentTarget.checked)}
              />
            ) : (
              <Text c="dimmed" size="sm">
                Este especialista ya tiene un usuario registrado
              </Text>
            )}

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

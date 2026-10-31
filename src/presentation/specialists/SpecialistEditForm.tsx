import { EMAIL_REGEX } from "../../util/constants";
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
  Tabs,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { specialistService } from "../../services/specialistService";
import { PhoneInput } from "../../components/PhoneInput";
import { useState, type FormEvent } from "react";
import { SpecialistConfig } from "./SpecialistConfig";
import { IconInfoCircle } from "@tabler/icons-react";
import { useOnceEffect } from "../../hooks/useOnceEffect";

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
  const [showValidationErrors, setShowValidationErrors] = useState(false); // Para disparar los errores en los inputs
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
  const [isPhoneValid, setIsPhoneValid] = useState(false);

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

  useOnceEffect(() => {
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
  });

  async function handleSpecialistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const isEmailValid = EMAIL_REGEX.test(specialistForm.email);
    const isFormValid =
      specialistForm.email.trim() !== "" &&
      isEmailValid &&
      isPhoneValid &&
      specialistForm.firstName.trim() !== "" &&
      specialistForm.lastName.trim() !== "";

    // Si alguien fuerza el submit o el botón está habilitado pero hay fallas:
    if (!isFormValid) {
      setShowValidationErrors(true); // Activa los mensajes rojos en los inputs
      setError(
        "Por favor, corrige los campos marcados en rojo antes de continuar.",
      );
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
        <Group justify="space-between" mb="lg">
          <Title order={2}>
            {editingSpecialistId ? "Editar Especialista" : "Nuevo Especialista"}
          </Title>
          <Button variant="default" onClick={onCancel} disabled={saving}>
            Volver a especialistas
          </Button>
        </Group>

        <Tabs defaultValue="general" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="general">Datos generales</Tabs.Tab>
            <Tabs.Tab value="configuration">Configuración</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" pt="md">
            {/* Formulario */}
            <form onSubmit={handleSpecialistSubmit} noValidate>
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
                    rightSection={
                      uploadingPhoto ? <Loader size="xs" /> : undefined
                    }
                    onChange={handlePhotoChange}
                  />
                </Group>

                {/* Datos Personales */}
                <TextInput
                  className="text-field"
                  label="Nombre"
                  placeholder="Ej. Juan"
                  required
                  maxLength={50}
                  value={specialistForm.firstName}
                  onChange={(event) =>
                    setSpecialistForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  error={
                    showValidationErrors && !specialistForm.firstName
                      ? "El nombre es obligatorio"
                      : ""
                  }
                />

                <TextInput
                  className="text-field"
                  label="Apellido"
                  placeholder="Ej. Pérez"
                  required
                  maxLength={50}
                  value={specialistForm.lastName}
                  onChange={(event) =>
                    setSpecialistForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  error={
                    showValidationErrors && !specialistForm.lastName
                      ? "El apellido es obligatorio"
                      : ""
                  }
                />

                <TextInput
                  className="text-field"
                  label="Email"
                  required
                  placeholder="Ej. juan@correo.com"
                  maxLength={100}
                  value={specialistForm.email}
                  onChange={(event) =>
                    setSpecialistForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  error={
                    showValidationErrors && !specialistForm.email
                      ? "El email es obligatorio"
                      : showValidationErrors &&
                          !EMAIL_REGEX.test(specialistForm.email)
                        ? "Ingresa un correo electrónico válido"
                        : undefined
                  }
                />

                {/* Fila con dos campos uno al lado del otro */}
                <Group grow preventGrowOverflow={false} gap="md">
                  <PhoneInput
                    className="text-field"
                    label="Teléfono/Celular de contacto"
                    required
                    value={specialistForm.phoneNumber}
                    onChange={(fullPhone, isValid) => {
                      setIsPhoneValid(isValid);
                      setSpecialistForm((current) => ({
                        ...current,
                        phoneNumber: fullPhone,
                      }));
                    }}
                    error={
                      showValidationErrors && !specialistForm.phoneNumber
                        ? "El teléfono es obligatorio"
                        : ""
                    }
                  />

                  <TextInput
                    className="text-field"
                    label="Número de colegiatura (opcional)"
                    placeholder="Ej. CPsP 12345 o CMP 67890"
                    rightSection={
                      <Tooltip
                        label="Código asignado por el colegio profesional correspondiente"
                        position="top"
                      >
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconInfoCircle size={16} />
                        </ActionIcon>
                      </Tooltip>
                    }
                    w={{ base: "100%", sm: 320 }} // Ancho recomendado para un código corto
                  />
                </Group>

                {/* Notas */}
                <Textarea
                  className="text-field"
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
                    onChange={(event) =>
                      setCreateUser(event.currentTarget.checked)
                    }
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
          </Tabs.Panel>
          <Tabs.Panel value="configuration">
            <SpecialistConfig
              editingSpecialistId={editingSpecialistId ?? ""}
              saving={saving}
              onCancel={() => {}}
              onSaveSuccess={onSaveSuccess}
            />
          </Tabs.Panel>
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
          Especialista registrado satisfactoriamente
        </MUIAlert>
      </Snackbar>
    </Container>
  );
}

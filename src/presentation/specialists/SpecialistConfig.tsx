import {
  Stack,
  Title,
  Text,
  Switch,
  ColorInput,
  Divider,
  Paper,
  Button,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import { specialistService } from "../../services/specialistService";

export function SpecialistConfig({
  editingSpecialistId,
  saving,
  onCancel,
  onSaveSuccess,
}: {
  editingSpecialistId: string;
  saving: boolean;
  onCancel: () => void;
  onSaveSuccess: () => void;
}) {
  const [color, setColor] = useState("#4C6EF5");

  // Paleta de colores pastel/profesionales sugeridos para la agenda
  const agendaColors = [
    "#4C6EF5", // Azul
    "#12B886", // Verde teal
    "#82C91E", // Lime
    "#FAB005", // Amarillo/Ámbar
    "#FD7E14", // Naranja
    "#E599F7", // Orquídea/Morado
    "#15AABF", // Cyan
  ];

  const handleOpenDeleteModal = () => {
    modals.openConfirmModal({
      title: (
        <Title order={4}>¿Estás seguro de archivar a este especialista?</Title>
      ),
      children: (
        <Text size="sm" c="dimmed">
          Esta acción es permanente e irreversible. Se archivarán los accesos y
          la relación con el sistema.
        </Text>
      ),
      labels: { confirm: "Archivar especialista", cancel: "Cancelar" },
      confirmProps: { color: "red", radius: "xl" },
      cancelProps: { radius: "xl" },
      onConfirm: () => {
        specialistService.deactivate(editingSpecialistId).then(() => {
          onSaveSuccess();
        });
      },
      onCancel: onCancel,
    });
  };

  return (
    <Stack gap="xl" pt="md">
      {/* SECCIÓN 1: Ajustes normales (Sin Card, solo estructura limpia) */}
      <Stack gap="sm">
        <Title order={4}>Preferencia de notificaciones</Title>
        <Text size="sm" c="dimmed">
          Configura cómo quieres recibir las alertas de citas.
        </Text>
        {/* Aquí tus controles/inputs/switches */}
        <Switch label="Notificar por correo cuando se agende una cita" />
      </Stack>

      <Stack gap="xs">
        <Title order={4}>Color de la agenda</Title>
        <Text size="sm" c="dimmed">
          Selecciona el color distintivo con el que se mostrarán las citas de
          este especialista en el calendario.
        </Text>

        <ColorInput
          placeholder="Selecciona un color"
          value={color}
          onChange={setColor}
          swatches={agendaColors}
          swatchesPerRow={7}
          format="hex"
          disallowInput // Evita que escriban valores raros si solo quieres que elijan de la paleta
          w={{ base: "100%", sm: 320 }}
          mt="xs"
        />
      </Stack>

      <Divider />

      {/* SECCIÓN 2: Zona de peligro (Única sección destacada con Paper/Card) */}
      <Paper withBorder p="lg" radius="md" bg="var(--mantine-color-red-0)">
        <Stack gap="xs">
          <Title order={4} c="red.9">
            Zona de peligro
          </Title>
          <Text size="sm" c="dimmed">
            Archivar al especialista desactivará su acceso al sistema y
            cancelará sus citas pendientes.
          </Text>
          <div>
            <Button
              variant="light"
              color="red"
              radius="xl"
              mt="xs"
              onClick={handleOpenDeleteModal}
              loading={saving}
            >
              {saving ? "Guardando..." : "Archivar especialista"}
            </Button>
          </div>
        </Stack>
      </Paper>
    </Stack>
  );
}

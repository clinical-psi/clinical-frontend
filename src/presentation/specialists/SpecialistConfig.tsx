import {
  Stack,
  Title,
  Text,
  Switch,
  ColorInput,
  Divider,
  Paper,
  Button,
  Alert,
} from "@mantine/core";
import { useConfirm, useToast } from "../../components/feedback/feedbackContext";
import { useEffect, useState } from "react";
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
  const [loadingColor, setLoadingColor] = useState(true);
  const [savingColor, setSavingColor] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    specialistService.getById(editingSpecialistId)
      .then((specialist) => {
        if (!cancelled) setColor(specialist.agendaColor ?? "#4C6EF5");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingColor(false);
      });
    return () => { cancelled = true; };
  }, [editingSpecialistId]);

  async function saveColor() {
    if (savingColor) return;
    setSavingColor(true);
    setError("");
    try {
      await specialistService.updateAgendaColor(editingSpecialistId, color);
      toast.success("Color de agenda guardado satisfactoriamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el color.");
    } finally {
      setSavingColor(false);
    }
  }

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

  const handleOpenDeleteModal = async () => {
    const confirmed = await confirm({
      title: "¿Estás seguro de archivar a este especialista?",
      message: "Esta acción es permanente e irreversible. Se archivarán los accesos y la relación con el sistema.",
      confirmLabel: "Archivar especialista",
      destructive: true,
      onConfirm: async () => {
        await specialistService.deactivate(editingSpecialistId);
        toast.success("Especialista archivado satisfactoriamente");
        onSaveSuccess();
      },
    });
    if (!confirmed) onCancel();
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
          disabled={loadingColor || savingColor}
          swatches={agendaColors}
          swatchesPerRow={7}
          format="hex"
          disallowInput // Evita que escriban valores raros si solo quieres que elijan de la paleta
          w={{ base: "100%", sm: 320 }}
          mt="xs"
        />
        {error && <Alert color="red">{error}</Alert>}
        <Button
          onClick={saveColor}
          loading={savingColor}
          disabled={loadingColor || !/^#[0-9a-f]{6}$/i.test(color)}
          w={{ base: "100%", sm: 320 }}
        >
          Guardar color de agenda
        </Button>
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
              onClick={() => void handleOpenDeleteModal()}
              disabled={saving}
            >
              Archivar especialista
            </Button>
          </div>
        </Stack>
      </Paper>
    </Stack>
  );
}

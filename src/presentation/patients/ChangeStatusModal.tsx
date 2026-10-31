import { useState } from "react";
import { Modal, Text, Stack, Paper, Group, Button } from "@mantine/core";
import { TRANSITION_RULES } from "../../util/constants";

interface ChangeStatusModalProps {
  open: boolean;
  patient: {
    id: string | null;
    status: string | null;
    firstName: string;
    lastName: string;
  } | null;
  onClose: () => void;
  onConfirm: (patientId: string, newStatus: string) => Promise<void>;
}

export function ChangeStatusModal({
  open,
  patient,
  onClose,
  onConfirm,
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!patient) return null;

  // Evaluamos las reglas según el estado actual del paciente
  const isRestrictedState =
    patient.status !== null &&
    ["COMPLETED", "DROPPED", "INACTIVE"].includes(patient.status);
  const availableOptions = isRestrictedState
    ? TRANSITION_RULES.RESTRICTED
    : TRANSITION_RULES.ACTIVE_OR_WAITING;

  const handleSave = async () => {
    if (!selectedStatus || patient.id === null) return;
    setLoading(true);
    try {
      await onConfirm(patient.id, selectedStatus);
      onClose();
    } finally {
      setLoading(false);
      setSelectedStatus(null);
    }
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          Cambiar estado de {patient.firstName} {patient.lastName}
        </Text>
      }
      centered
      size="md"
    >
      <Text size="sm" c="dimmed" mb="md">
        Selecciona el nuevo estado clínico para el paciente:
      </Text>

      {/* Contenedor de Tarjetas (Cards) */}
      <Stack gap="sm" mb="xl">
        {availableOptions.map((option) => {
          const isSelected = selectedStatus === option.id;
          const IconComponent = option.icon;

          return (
            <Paper
              key={option.id}
              withBorder
              p="md"
              radius="md"
              style={{
                cursor: "pointer",
                borderColor: isSelected
                  ? "var(--mantine-color-blue-6)"
                  : undefined,
                backgroundColor: isSelected
                  ? "var(--mantine-color-blue-light)"
                  : "transparent",
                transition: "all 0.2s ease",
              }}
              onClick={() => setSelectedStatus(option.id)}
            >
              {/* Agregamos wrap="nowrap" para forzar que icono y texto vivan siempre en la misma línea */}
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="md" wrap="nowrap" style={{ width: "100%" }}>
                  <IconComponent
                    size={24}
                    style={{ minWidth: 24 }} // Evita que el icono se comprima
                    color={`var(--mantine-color-${option.color}-6)`}
                  />
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="sm">
                      {option.label}
                    </Text>
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ wordBreak: "break-word" }}
                    >
                      {option.description}
                    </Text>
                  </div>
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>

      <Group justify="end">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          color="blue"
          disabled={!selectedStatus}
          loading={loading}
          onClick={handleSave}
        >
          Guardar cambio
        </Button>
      </Group>
    </Modal>
  );
}

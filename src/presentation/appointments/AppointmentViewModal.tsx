import { Modal, Stack, Text, Group, Button } from "@mantine/core";
import { appointmentService } from "../../services/appointmentService";
import { formatAppointmentDateTime } from "../../util/utils";
import type { AppointmentViewModalProps } from "./AppointmentsPage";

export function AppointmentViewModal({
  appointment,
  onClose,
}: AppointmentViewModalProps) {
  const patientName =
    `${appointment.patient?.firstName || ""} ${appointment.patient?.lastName || ""}`.trim();
  const specialistName =
    `${appointment.specialist?.firstName || ""} ${appointment.specialist?.lastName || ""}`.trim();
  const isOnline = appointment.appointmentMode === "ONLINE";
  const dateTimeFormatted = formatAppointmentDateTime(
    appointment.appointmentStartDate,
    appointment.appointmentEndDate,
  );
  const locationDisplay = appointment.location
    ? `${appointment.location.name || "N/A"}${appointment.location.hallName ? ` - ${appointment.location.hallName}` : ""}`
    : "No especificada";

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
      appointmentService
        .deleteById(appointment.id)
        .then(() => {
          onClose();
        })
        .catch((err) => {
          console.error("Error al eliminar la cita:", err);
        });
    }
  };

  return (
    <Modal opened onClose={onClose} title="Detalles de la Cita" size="lg">
      <Stack gap="md">
        {/* Patient */}
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Paciente
          </Text>
          <Text fw={500}>{patientName}</Text>
        </div>

        {/* Date and Time */}
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Fecha y Hora
          </Text>
          <Text>{dateTimeFormatted}</Text>
        </div>

        {/* Mode */}
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Tipo de Sesión
          </Text>
          <Text>{isOnline ? "Virtual" : "Presencial"}</Text>
        </div>

        {/* Location */}
        {!isOnline && (
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Ubicación
            </Text>
            <Text>{locationDisplay}</Text>
          </div>
        )}

        {/* Fee */}
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Tarifa
          </Text>
          <Text>
            {appointment.feeAmount} {appointment.currencyCode}
          </Text>
        </div>

        {/* Specialist */}
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Especialista
          </Text>
          <Text>{specialistName}</Text>
          {appointment.specialist?.shortName && (
            <Text size="sm" c="dimmed">
              {appointment.specialist.shortName}
            </Text>
          )}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Notas
            </Text>
            <Text style={{ whiteSpace: "pre-wrap" }}>{appointment.notes}</Text>
          </div>
        )}

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cerrar
          </Button>
          <Button color="red" onClick={handleDelete}>
            Eliminar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

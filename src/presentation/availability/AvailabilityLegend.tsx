import { Group, Text } from "@mantine/core";

const ITEMS = [
  { className: "availability-swatch-available", label: "Disponible" },
  { className: "availability-swatch-blocked", label: "Bloqueado" },
  { className: "availability-swatch-appointment", label: "Cita agendada" },
];

export function AvailabilityLegend({
  showAppointments = true,
}: {
  showAppointments?: boolean;
}) {
  return (
    <Group gap="md" wrap="wrap" aria-label="Leyenda del calendario">
      {ITEMS.filter(
        (item) =>
          showAppointments ||
          item.className !== "availability-swatch-appointment",
      ).map((item) => (
        <Group key={item.className} gap={6} wrap="nowrap">
          <span
            className={`availability-swatch ${item.className}`}
            aria-hidden="true"
          />
          <Text size="xs" c="dimmed">
            {item.label}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

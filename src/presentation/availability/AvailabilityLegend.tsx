import { Group, Text } from "@mantine/core";
import type { Specialist } from "../../types/get-specialist";

const ITEMS = [
  { className: "availability-swatch-available", label: "Disponible" },
  { className: "availability-swatch-blocked", label: "Bloqueado" },
  { className: "availability-swatch-appointment", label: "Cita agendada" },
];

export function AvailabilityLegend({
  showAppointments = true,
  specialists,
}: {
  showAppointments?: boolean;
  specialists?: Specialist[];
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
            className={`availability-swatch ${item.className}${specialists ? " availability-swatch-by-specialist" : ""}`}
            aria-hidden="true"
          />
          <Text size="xs" c="dimmed">
            {item.label}
          </Text>
        </Group>
      ))}
      {specialists && (
        <Group gap="md" wrap="wrap" aria-label="Colores de especialistas">
          {specialists.map((specialist) => {
            const fullName = `${specialist.firstName} ${specialist.lastName}`.trim();
            return (
              <Group key={specialist.id} gap={6} wrap="nowrap">
                <span
                  className="availability-swatch"
                  style={{ backgroundColor: specialist.agendaColor ?? "#4C6EF5" }}
                  aria-hidden="true"
                />
                <Text size="xs" title={fullName}>
                  {specialist.shortName ? `${specialist.shortName} · ${fullName}` : fullName}
                </Text>
              </Group>
            );
          })}
        </Group>
      )}
    </Group>
  );
}

import { useEffect, useState } from "react";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import type { AppointmentMode } from "../../data/http/appointmentsApi";
import type { AvailableSlot } from "../../types/availability";
import { availabilityService } from "../../services/availabilityService";
import { formatToDateTime, toISOStringWithTimezone } from "../../util/utils";

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Sugiere los horarios libres del especialista para el día elegido.
 * `date` es el valor del input datetime-local (YYYY-MM-DDTHH:mm).
 */
export function AvailableSlotPicker({
  specialistId,
  date,
  appointmentMode,
  locationHallId,
  selectedStart,
  onPick,
}: {
  specialistId: string;
  date: string;
  appointmentMode: AppointmentMode;
  locationHallId?: string;
  selectedStart: string;
  onPick: (start: string, end: string) => void;
}) {
  const day = date.slice(0, 10);
  const requestKey = [specialistId, day, appointmentMode, locationHallId].join("|");
  const [result, setResult] = useState<{
    key: string;
    slots: AvailableSlot[];
    error: string;
  } | null>(null);
  const loading = result?.key !== requestKey;
  const slots = loading ? [] : result.slots;
  const error = loading ? "" : result.error;

  useEffect(() => {
    if (!specialistId || !day) return;
    let cancelled = false;
    const [year, month, dayOfMonth] = day.split("-").map(Number);
    const start = new Date(year, month - 1, dayOfMonth);
    const end = new Date(year, month - 1, dayOfMonth + 1);
    availabilityService
      .getAvailableSlots(
        specialistId,
        toISOStringWithTimezone(start),
        toISOStringWithTimezone(end),
        appointmentMode,
        appointmentMode === "INPERSON" ? locationHallId || undefined : undefined,
      )
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, slots: data, error: "" });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setResult({ key: requestKey, slots: [], error: err.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [specialistId, day, appointmentMode, locationHallId, requestKey]);

  if (!specialistId || !day) return null;

  return (
    <Stack gap={6}>
      <Group gap="xs">
        <Text size="sm" fw={500}>
          Horarios disponibles
        </Text>
        {loading && <Loader size="xs" />}
      </Group>
      {error ? (
        <Text size="xs" c="red">
          {error}
        </Text>
      ) : !loading && slots.length === 0 ? (
        <Text size="xs" c="dimmed">
          No hay horarios libres configurados para este día. Puedes ingresar la
          hora manualmente; el sistema validará cruces y bloqueos.
        </Text>
      ) : (
        <Group gap={6} role="list" aria-label="Horarios disponibles">
          {slots.map((slot) => {
            const start = formatToDateTime(new Date(slot.start));
            const selected = start === selectedStart;
            return (
              <Button
                key={slot.start}
                role="listitem"
                size="compact-sm"
                radius="xl"
                variant={selected ? "filled" : "light"}
                color="teal"
                aria-pressed={selected}
                onClick={() =>
                  onPick(start, formatToDateTime(new Date(slot.end)))
                }
              >
                {timeFormatter.format(new Date(slot.start))}
              </Button>
            );
          })}
        </Group>
      )}
    </Stack>
  );
}

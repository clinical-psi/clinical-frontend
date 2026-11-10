import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCopy,
  IconPlus,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { AppointmentMode } from "../../data/http/appointmentsApi";
import { formatLocationLabel, type LocationHallOption } from "../../data/http/locationsApi";
import type { AvailabilityRule, DayOfWeek } from "../../types/availability";
import { availabilityService } from "../../services/availabilityService";
import type { ToastSeverity } from "../../components/feedback/feedbackContext";
import {
  BUFFER_OPTIONS,
  DAYS,
  MODE_OPTIONS,
  SLOT_OPTIONS,
  toMinutes,
} from "./availabilityUi";

type Block = {
  key: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  appointmentMode: "" | AppointmentMode;
  locationHallId: string;
  validFrom?: string | null;
  validTo?: string | null;
  timeZone?: string | null;
};

const DEFAULT_SLOT = 60;
const DEFAULT_BUFFER = 0;
let keySeq = 0;
const nextKey = () => `block-${++keySeq}`;

function toBlocks(rules: AvailabilityRule[]): Block[] {
  return rules.map((rule) => ({
    key: nextKey(),
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    appointmentMode: rule.appointmentMode ?? "",
    locationHallId: rule.locationHallId ? String(rule.locationHallId) : "",
    validFrom: rule.validFrom,
    validTo: rule.validTo,
    timeZone: rule.timeZone,
  }));
}

function stripKey(block: Block): Omit<Block, "key"> {
  return {
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    appointmentMode: block.appointmentMode,
    locationHallId: block.locationHallId,
    validFrom: block.validFrom,
    validTo: block.validTo,
    timeZone: block.timeZone,
  };
}

function serialize(blocks: Block[], slot: string, buffer: string) {
  return JSON.stringify({ slot, buffer, blocks: blocks.map(stripKey) });
}

function validateDay(blocks: Block[]): string | null {
  for (const block of blocks) {
    if (!block.startTime || !block.endTime) return "Completa las horas.";
    if (toMinutes(block.startTime) >= toMinutes(block.endTime)) {
      return "La hora de inicio debe ser anterior a la de fin.";
    }
  }
  const sorted = [...blocks].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );
  for (let i = 1; i < sorted.length; i++) {
    if (toMinutes(sorted[i].startTime) < toMinutes(sorted[i - 1].endTime)) {
      return `Los bloques ${sorted[i - 1].startTime}–${sorted[i - 1].endTime} y ${sorted[i].startTime}–${sorted[i].endTime} se superponen.`;
    }
  }
  return null;
}

export function WeeklyScheduleEditor({
  specialistId,
  locations,
  onSaved,
  onNotify,
}: {
  specialistId: string;
  locations: LocationHallOption[];
  onSaved: () => void;
  onNotify: (message: string, severity: ToastSeverity) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(String(DEFAULT_SLOT));
  const [bufferMinutes, setBufferMinutes] = useState(String(DEFAULT_BUFFER));
  const [snapshot, setSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  function applyRules(rules: AvailabilityRule[]) {
    const loaded = toBlocks(rules);
    const slot = String(rules[0]?.slotMinutes ?? DEFAULT_SLOT);
    const buffer = String(rules[0]?.bufferMinutes ?? DEFAULT_BUFFER);
    setBlocks(loaded);
    setSlotMinutes(slot);
    setBufferMinutes(buffer);
    setSnapshot(serialize(loaded, slot, buffer));
  }

  useEffect(() => {
    let cancelled = false;
    availabilityService
      .getRules(specialistId)
      .then((rules) => {
        if (!cancelled) applyRules(rules);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [specialistId]);

  const blocksByDay = useMemo(() => {
    const map = new Map<DayOfWeek, Block[]>();
    DAYS.forEach((day) => map.set(day.value, []));
    blocks.forEach((block) => map.get(block.dayOfWeek)!.push(block));
    return map;
  }, [blocks]);

  const dayErrors = useMemo(() => {
    const errors = new Map<DayOfWeek, string>();
    blocksByDay.forEach((dayBlocks, day) => {
      const error = validateDay(dayBlocks);
      if (error) errors.set(day, error);
    });
    return errors;
  }, [blocksByDay]);

  const dirty = serialize(blocks, slotMinutes, bufferMinutes) !== snapshot;
  const hasInPerson = blocks.some((block) => block.appointmentMode !== "ONLINE");

  const locationOptions = locations.map((location) => ({
    value: String(location.id),
    label: formatLocationLabel(location),
  }));

  function updateBlock(key: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((block) => (block.key === key ? { ...block, ...patch } : block)),
    );
  }

  function toggleDay(day: DayOfWeek, enabled: boolean) {
    if (enabled) {
      setBlocks((prev) => [
        ...prev,
        {
          key: nextKey(),
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "13:00",
          appointmentMode: "",
          locationHallId: "",
        },
      ]);
    } else {
      setBlocks((prev) => prev.filter((block) => block.dayOfWeek !== day));
    }
  }

  function addBlock(day: DayOfWeek) {
    const dayBlocks = blocksByDay.get(day) ?? [];
    const lastEnd = dayBlocks.reduce(
      (max, block) => Math.max(max, toMinutes(block.endTime || "00:00")),
      0,
    );
    const start = Math.min(Math.max(lastEnd + 60, 9 * 60), 22 * 60);
    const end = Math.min(start + 4 * 60, 23 * 60 + 59);
    const format = (minutes: number) =>
      `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    setBlocks((prev) => [
      ...prev,
      {
        key: nextKey(),
        dayOfWeek: day,
        startTime: format(start),
        endTime: format(end),
        appointmentMode: "",
        locationHallId: "",
      },
    ]);
  }

  function copyDay(source: DayOfWeek, targets: DayOfWeek[]) {
    const sourceBlocks = blocksByDay.get(source) ?? [];
    setBlocks((prev) => [
      ...prev.filter(
        (block) =>
          block.dayOfWeek === source || !targets.includes(block.dayOfWeek),
      ),
      ...targets
        .filter((target) => target !== source)
        .flatMap((target) =>
          sourceBlocks.map((block) => ({
            ...block,
            key: nextKey(),
            dayOfWeek: target,
          })),
        ),
    ]);
  }

  async function handleSave() {
    if (saving) return;
    if (dayErrors.size > 0) {
      onNotify("Corrige los bloques marcados antes de guardar.", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await availabilityService.replaceRules(
        specialistId,
        blocks.map((block) => ({
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          appointmentMode: block.appointmentMode || null,
          locationHallId: block.locationHallId ? Number(block.locationHallId) : null,
          slotMinutes: Number(slotMinutes),
          bufferMinutes: Number(bufferMinutes),
          validFrom: block.validFrom,
          validTo: block.validTo,
          timeZone: block.timeZone,
        })),
      );
      applyRules(saved);
      onNotify("Horario guardado satisfactoriamente", "success");
      onSaved();
    } catch (err) {
      onNotify((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  if (loadError) {
    return (
      <Alert color="red" title="No se pudo cargar el horario">
        {loadError}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={4}>Horario semanal de atención</Title>
        <Text size="sm" c="dimmed">
          Define los bloques en los que el especialista recibe citas cada
          semana. Para feriados, vacaciones o aperturas puntuales usa la
          pestaña «Excepciones».
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }} maw={520}>
        <Select
          label="Duración de cada cita"
          data={SLOT_OPTIONS}
          value={slotMinutes}
          onChange={(value) => value && setSlotMinutes(value)}
          allowDeselect={false}
        />
        <Select
          label="Pausa entre citas"
          data={BUFFER_OPTIONS}
          value={bufferMinutes}
          onChange={(value) => value && setBufferMinutes(value)}
          allowDeselect={false}
        />
      </SimpleGrid>

      {blocks.length === 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>
          Sin horario configurado: el sistema no restringe el agendamiento
          por horario de este especialista (solo valida cruces y bloqueos).
        </Alert>
      )}

      <Stack gap="xs">
        {DAYS.map((day) => {
          const dayBlocks = blocksByDay.get(day.value) ?? [];
          const enabled = dayBlocks.length > 0;
          const error = dayErrors.get(day.value);
          return (
            <Paper
              key={day.value}
              withBorder
              radius="md"
              p="sm"
              className="availability-day"
              data-error={error ? "true" : undefined}
            >
              <Group align="flex-start" gap="md" wrap="wrap">
                <Switch
                  w={130}
                  mt={6}
                  label={day.label}
                  checked={enabled}
                  onChange={(event) =>
                    toggleDay(day.value, event.currentTarget.checked)
                  }
                  aria-label={`Atiende los ${day.label.toLowerCase()}`}
                />

                <Stack gap="xs" style={{ flex: 1, minWidth: 260 }}>
                  {!enabled && (
                    <Text size="sm" c="dimmed" mt={6}>
                      No atiende
                    </Text>
                  )}
                  {dayBlocks.map((block, index) => (
                    <Group key={block.key} gap="xs" align="flex-end" wrap="wrap">
                      <TextInput
                        type="time"
                        label={index === 0 ? "Desde" : undefined}
                        aria-label="Hora de inicio"
                        value={block.startTime}
                        onChange={(event) =>
                          updateBlock(block.key, {
                            startTime: event.currentTarget.value,
                          })
                        }
                        w={120}
                      />
                      <TextInput
                        type="time"
                        label={index === 0 ? "Hasta" : undefined}
                        aria-label="Hora de fin"
                        value={block.endTime}
                        onChange={(event) =>
                          updateBlock(block.key, {
                            endTime: event.currentTarget.value,
                          })
                        }
                        w={120}
                      />
                      <Select
                        label={index === 0 ? "Modalidad" : undefined}
                        aria-label="Modalidad"
                        data={MODE_OPTIONS}
                        value={block.appointmentMode}
                        onChange={(value) =>
                          updateBlock(block.key, {
                            appointmentMode: (value ?? "") as Block["appointmentMode"],
                            locationHallId:
                              value === "ONLINE" ? "" : block.locationHallId,
                          })
                        }
                        allowDeselect={false}
                        w={190}
                      />
                      {block.appointmentMode !== "ONLINE" &&
                        locationOptions.length > 0 && (
                          <Select
                            label={index === 0 ? "Sede y sala" : undefined}
                            aria-label="Sede y sala"
                            placeholder="Cualquier sede y sala"
                            data={locationOptions}
                            value={block.locationHallId || null}
                            onChange={(value) =>
                              updateBlock(block.key, { locationHallId: value ?? "" })
                            }
                            clearable
                            w={200}
                          />
                        )}
                      <Tooltip label="Quitar bloque">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="lg"
                          mb={2}
                          aria-label="Quitar bloque"
                          onClick={() =>
                            setBlocks((prev) =>
                              prev.filter((item) => item.key !== block.key),
                            )
                          }
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  ))}
                  {error && (
                    <Text size="xs" c="red" role="alert">
                      {error}
                    </Text>
                  )}
                </Stack>

                {enabled && (
                  <Group gap={4} mt={2}>
                    <Tooltip label="Agregar bloque">
                      <ActionIcon
                        variant="light"
                        size="lg"
                        aria-label={`Agregar bloque el ${day.label.toLowerCase()}`}
                        onClick={() => addBlock(day.value)}
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <Tooltip label="Copiar a otros días">
                          <ActionIcon
                            variant="light"
                            size="lg"
                            aria-label={`Copiar horario del ${day.label.toLowerCase()}`}
                          >
                            <IconCopy size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Copiar {day.label.toLowerCase()} a…</Menu.Label>
                        <Menu.Item
                          onClick={() => copyDay(day.value, [1, 2, 3, 4, 5])}
                        >
                          Lunes a viernes
                        </Menu.Item>
                        <Menu.Item
                          onClick={() =>
                            copyDay(day.value, [1, 2, 3, 4, 5, 6, 7])
                          }
                        >
                          Todos los días
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                )}
              </Group>
            </Paper>
          );
        })}
      </Stack>

      {hasInPerson && locationOptions.length > 0 && (
        <Text size="xs" c="dimmed">
          Si no eliges sala, el bloque presencial vale para cualquier sede y sala.
        </Text>
      )}

      <Group justify="flex-end" gap="sm" className="availability-actions">
        {dirty && (
          <Badge color="yellow" variant="light">
            Cambios sin guardar
          </Badge>
        )}
        <Button
          variant="default"
          disabled={!dirty || saving}
          onClick={() => {
            const parsed = JSON.parse(snapshot) as {
              slot: string;
              buffer: string;
              blocks: Omit<Block, "key">[];
            };
            setSlotMinutes(parsed.slot);
            setBufferMinutes(parsed.buffer);
            setBlocks(parsed.blocks.map((block) => ({ ...block, key: nextKey() })));
          }}
        >
          Descartar
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>
          Guardar horario
        </Button>
      </Group>
    </Stack>
  );
}

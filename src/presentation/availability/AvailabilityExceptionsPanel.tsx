import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type { Location } from "../../data/http/locationsApi";
import type {
  AvailabilityException,
  AvailabilityExceptionRequest,
} from "../../types/availability";
import { availabilityService } from "../../services/availabilityService";
import { toISOStringWithTimezone } from "../../util/utils";
import { AvailabilityExceptionModal } from "./AvailabilityExceptionModal";
import {
  addDays,
  formatExceptionRange,
  modeLabel,
  startOfToday,
} from "./availabilityUi";

const PAGE_DAYS = 90;
const rangeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AvailabilityExceptionsPanel({
  specialistId,
  locations,
  onChanged,
  onNotify,
}: {
  specialistId: string;
  locations: Location[];
  onChanged: () => void;
  onNotify: (message: string, severity: "success" | "error") => void;
}) {
  const [rangeStart, setRangeStart] = useState(startOfToday);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AvailabilityException | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const rangeEnd = addDays(rangeStart, PAGE_DAYS);
  const requestKey = `${specialistId}|${rangeStart.getTime()}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  const load = useCallback(
    (cancelled: () => boolean, key: string) => {
      availabilityService
        .getExceptions(
          specialistId,
          toISOStringWithTimezone(rangeStart),
          toISOStringWithTimezone(addDays(rangeStart, PAGE_DAYS)),
        )
        .then((data) => {
          if (!cancelled()) {
            setExceptions(data);
            setError("");
          }
        })
        .catch((err: Error) => {
          if (!cancelled()) setError(err.message);
        })
        .finally(() => {
          if (!cancelled()) setLoadedKey(key);
        });
    },
    [specialistId, rangeStart],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled, requestKey);
    return () => {
      cancelled = true;
    };
  }, [load, requestKey]);

  function openModal(exception: AvailabilityException | null) {
    setEditing(exception);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function handleSubmit(request: AvailabilityExceptionRequest) {
    const saved = await availabilityService.saveException(
      specialistId,
      request,
      editing?.id,
    );
    setModalOpen(false);
    setReloadKey((key) => key + 1);
    onChanged();
    if (saved.type === "BLOCKED" && saved.overlappingAppointments > 0) {
      onNotify(
        `Bloqueo guardado. Hay ${saved.overlappingAppointments} cita(s) dentro de este periodo que debes reprogramar.`,
        "error",
      );
    } else {
      onNotify("Excepción guardada", "success");
    }
  }

  function confirmDelete(exception: AvailabilityException) {
    modals.openConfirmModal({
      title: "Eliminar excepción",
      children: (
        <Text size="sm">
          Se eliminará la excepción del{" "}
          <strong>
            {formatExceptionRange(
              exception.startAt,
              exception.endAt,
              exception.allDay,
            )}
          </strong>
          . El horario semanal volverá a aplicar en ese periodo.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        availabilityService
          .deleteException(specialistId, exception.id)
          .then(() => {
            setReloadKey((key) => key + 1);
            onChanged();
            onNotify("Excepción eliminada", "success");
          })
          .catch((err: Error) => onNotify(err.message, "error"));
      },
    });
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={4}>Excepciones</Title>
          <Text size="sm" c="dimmed">
            Bloqueos (vacaciones, feriados) y horarios extra que modifican el
            horario semanal.
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openModal(null)}>
          Nueva excepción
        </Button>
      </Group>

      <Group gap="xs" justify="space-between" wrap="nowrap">
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Periodo anterior"
          onClick={() => setRangeStart((prev) => addDays(prev, -PAGE_DAYS))}
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text size="sm" fw={600} ta="center">
          {rangeFormatter.format(rangeStart)} –{" "}
          {rangeFormatter.format(addDays(rangeEnd, -1))}
        </Text>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Periodo siguiente"
          onClick={() => setRangeStart((prev) => addDays(prev, PAGE_DAYS))}
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      {error && (
        <Alert color="red" onClose={() => setError("")} withCloseButton>
          {error}
        </Alert>
      )}

      {loading ? (
        <Group justify="center" py="lg">
          <Loader size="sm" />
        </Group>
      ) : exceptions.length === 0 ? (
        <Paper withBorder radius="md" p="lg">
          <Text size="sm" c="dimmed" ta="center">
            No hay excepciones en este periodo.
          </Text>
        </Paper>
      ) : (
        <Stack gap="xs" component="ul" className="availability-exception-list">
          {exceptions.map((exception) => {
            const blocked = exception.type === "BLOCKED";
            return (
              <Paper
                key={exception.id}
                component="li"
                withBorder
                radius="md"
                p="sm"
                className={`availability-exception availability-exception-${blocked ? "blocked" : "extra"}`}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Group gap="xs" wrap="wrap">
                      <Badge color={blocked ? "red" : "teal"} variant="light">
                        {blocked ? "Bloqueado" : "Horario extra"}
                      </Badge>
                      <Text size="sm" fw={600}>
                        {formatExceptionRange(
                          exception.startAt,
                          exception.endAt,
                          exception.allDay,
                        )}
                      </Text>
                    </Group>
                    {exception.reason && (
                      <Text size="sm">{exception.reason}</Text>
                    )}
                    {!blocked && (
                      <Text size="xs" c="dimmed">
                        {modeLabel(exception.appointmentMode)}
                        {exception.locationId &&
                          ` · ${locations.find((l) => l.id === exception.locationId)?.name ?? "Sede"}`}
                        {exception.slotMinutes &&
                          ` · citas de ${exception.slotMinutes} min`}
                      </Text>
                    )}
                    {blocked && exception.overlappingAppointments > 0 && (
                      <Text size="xs" c="orange.8">
                        {exception.overlappingAppointments} cita(s) agendadas
                        dentro de este bloqueo.
                      </Text>
                    )}
                  </Stack>
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label="Editar">
                      <ActionIcon
                        variant="subtle"
                        aria-label="Editar excepción"
                        onClick={() => openModal(exception)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="Eliminar excepción"
                        onClick={() => confirmDelete(exception)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}

      {modalOpen && (
        <AvailabilityExceptionModal
          key={modalKey}
          opened={modalOpen}
          exception={editing}
          locations={locations}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </Stack>
  );
}

import { useState, type FormEvent } from "react";
import {
  Alert,
  Modal,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { ModalActions } from "../../components/feedback/ModalActions";
import { formatLocationLabel, type LocationHallOption } from "../../data/http/locationsApi";
import type {
  AvailabilityException,
  AvailabilityExceptionRequest,
  AvailabilityExceptionType,
} from "../../types/availability";
import type { AppointmentMode } from "../../data/http/appointmentsApi";
import { toISOStringWithTimezone } from "../../util/utils";
import {
  MODE_OPTIONS,
  SLOT_OPTIONS,
  addDays,
  localDateToOffset,
  startOfToday,
  toDateInput,
  toDateTimeInput,
} from "./availabilityUi";

type FormState = {
  type: AvailabilityExceptionType;
  allDay: boolean;
  startDate: string;
  endDate: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  appointmentMode: "" | AppointmentMode;
  locationHallId: string;
  slotMinutes: string;
};

function initialState(
  exception?: AvailabilityException | null,
  defaults?: Partial<FormState>,
): FormState {
  if (exception) {
    const start = new Date(exception.startAt);
    const end = new Date(exception.endAt);
    return {
      type: exception.type,
      allDay: exception.allDay,
      startDate: toDateInput(start),
      // Fin exclusivo -> último día incluido
      endDate: toDateInput(exception.allDay ? addDays(end, -1) : end),
      startDateTime: toDateTimeInput(start),
      endDateTime: toDateTimeInput(end),
      reason: exception.reason ?? "",
      appointmentMode: exception.appointmentMode ?? "",
      locationHallId: exception.locationHallId ? String(exception.locationHallId) : "",
      slotMinutes: String(exception.slotMinutes ?? 60),
    };
  }
  const tomorrow = addDays(startOfToday(), 1);
  const nineAm = new Date(tomorrow);
  nineAm.setHours(9);
  const onePm = new Date(tomorrow);
  onePm.setHours(13);
  return {
    type: "BLOCKED",
    allDay: true,
    startDate: toDateInput(tomorrow),
    endDate: toDateInput(tomorrow),
    startDateTime: toDateTimeInput(nineAm),
    endDateTime: toDateTimeInput(onePm),
    reason: "",
    appointmentMode: "",
    locationHallId: "",
    slotMinutes: "60",
    ...defaults,
  };
}

function toRequest(form: FormState): AvailabilityExceptionRequest {
  const extra = form.type === "EXTRA";
  return {
    type: form.type,
    allDay: form.allDay,
    startAt: form.allDay
      ? localDateToOffset(form.startDate)
      : toISOStringWithTimezone(new Date(form.startDateTime)),
    endAt: form.allDay
      ? localDateToOffset(form.endDate, 1)
      : toISOStringWithTimezone(new Date(form.endDateTime)),
    reason: form.reason,
    appointmentMode: extra ? form.appointmentMode || null : null,
    locationHallId: extra && form.locationHallId ? Number(form.locationHallId) : null,
    slotMinutes: extra ? Number(form.slotMinutes) : null,
  };
}

function validate(form: FormState): string | null {
  if (form.allDay) {
    if (!form.startDate || !form.endDate) return "Indica las fechas.";
    if (form.endDate < form.startDate) {
      return "La fecha final no puede ser anterior a la inicial.";
    }
  } else {
    if (!form.startDateTime || !form.endDateTime) {
      return "Indica el inicio y el fin.";
    }
    if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
      return "El fin debe ser posterior al inicio.";
    }
  }
  return null;
}

export function AvailabilityExceptionModal({
  opened,
  exception,
  defaults,
  locations,
  onClose,
  onSubmit,
}: {
  opened: boolean;
  exception?: AvailabilityException | null;
  defaults?: Partial<FormState>;
  locations: LocationHallOption[];
  onClose: () => void;
  onSubmit: (request: AvailabilityExceptionRequest) => Promise<void>;
}) {
  // El padre remonta el modal (key) en cada apertura, así el estado inicial siempre es fresco.
  const [form, setForm] = useState<FormState>(() =>
    initialState(exception, defaults),
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const locationOptions = locations.map((location) => ({
    value: String(location.id),
    label: formatLocationLabel(location),
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validation = validate(form);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(toRequest(form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isExtra = form.type === "EXTRA";

  return (
    <Modal
      opened={opened}
      onClose={() => { if (!submitting) onClose(); }}
      title={exception ? "Editar excepción" : "Nueva excepción"}
      size="lg"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      withCloseButton={!submitting}
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            value={form.type}
            onChange={(value) => set("type", value as AvailabilityExceptionType)}
            data={[
              { value: "BLOCKED", label: "Bloquear horario" },
              { value: "EXTRA", label: "Habilitar horario extra" },
            ]}
          />
          <Text size="sm" c="dimmed">
            {isExtra
              ? "Abre un espacio de atención adicional fuera del horario semanal."
              : "Marca el periodo como no disponible (vacaciones, feriado, capacitación…)."}
          </Text>

          <Switch
            label="Todo el día"
            checked={form.allDay}
            onChange={(event) => set("allDay", event.currentTarget.checked)}
          />

          {form.allDay ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                type="date"
                label="Desde"
                required
                value={form.startDate}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    startDate: value,
                    endDate: prev.endDate < value ? value : prev.endDate,
                  }));
                }}
              />
              <TextInput
                type="date"
                label="Hasta (inclusive)"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(event) => set("endDate", event.currentTarget.value)}
              />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                type="datetime-local"
                label="Inicio"
                required
                value={form.startDateTime}
                onChange={(event) =>
                  set("startDateTime", event.currentTarget.value)
                }
              />
              <TextInput
                type="datetime-local"
                label="Fin"
                required
                min={form.startDateTime}
                value={form.endDateTime}
                onChange={(event) =>
                  set("endDateTime", event.currentTarget.value)
                }
              />
            </SimpleGrid>
          )}

          <TextInput
            label="Motivo"
            placeholder={isExtra ? "Ej. Jornada sábado" : "Ej. Vacaciones"}
            maxLength={255}
            value={form.reason}
            onChange={(event) => set("reason", event.currentTarget.value)}
            description="Visible para quien agenda citas en el calendario."
          />

          {isExtra && (
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Select
                label="Modalidad"
                data={MODE_OPTIONS}
                value={form.appointmentMode}
                onChange={(value) => {
                  const mode = (value ?? "") as FormState["appointmentMode"];
                  setForm((prev) => ({
                    ...prev,
                    appointmentMode: mode,
                    locationHallId: mode === "ONLINE" ? "" : prev.locationHallId,
                  }));
                }}
                allowDeselect={false}
              />
              <Select
                label="Sede y sala"
                placeholder="Cualquier sede y sala"
                data={locationOptions}
                value={form.locationHallId || null}
                onChange={(value) => set("locationHallId", value ?? "")}
                disabled={form.appointmentMode === "ONLINE"}
                clearable
              />
              <Select
                label="Duración de cita"
                data={SLOT_OPTIONS}
                value={form.slotMinutes}
                onChange={(value) => value && set("slotMinutes", value)}
                allowDeselect={false}
              />
            </SimpleGrid>
          )}

          {error && (
            <Alert color="red" role="alert">
              {error}
            </Alert>
          )}

          <ModalActions
            onCancel={onClose}
            submitLabel={exception ? "Guardar cambios" : "Crear excepción"}
            loading={submitting}
          />
        </Stack>
      </form>
    </Modal>
  );
}

export type { FormState as AvailabilityExceptionFormDefaults };

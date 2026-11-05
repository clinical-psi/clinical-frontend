import type { AppointmentMode } from "../../data/http/appointmentsApi";
import type { DayOfWeek } from "../../types/availability";
import { toISOStringWithTimezone } from "../../util/utils";

export const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];

/** "" representa "ambas modalidades" (null en el backend). */
export const MODE_OPTIONS: { value: "" | AppointmentMode; label: string }[] = [
  { value: "", label: "Presencial y virtual" },
  { value: "INPERSON", label: "Solo presencial" },
  { value: "ONLINE", label: "Solo virtual" },
];

export const SLOT_OPTIONS = [30, 45, 50, 60, 90, 120].map((minutes) => ({
  value: String(minutes),
  label: `${minutes} min`,
}));

export const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30].map((minutes) => ({
  value: String(minutes),
  label: minutes === 0 ? "Sin pausa" : `${minutes} min`,
}));

export function modeLabel(mode?: AppointmentMode | null) {
  return (
    MODE_OPTIONS.find((option) => option.value === (mode ?? ""))?.label ??
    "Presencial y virtual"
  );
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Rango legible; los días completos usan fin exclusivo (medianoche siguiente). */
export function formatExceptionRange(
  startAt: string,
  endAt: string,
  allDay: boolean,
) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (allDay) {
    const lastDay = new Date(end.getTime() - 1);
    const first = dateFormatter.format(start);
    const last = dateFormatter.format(lastDay);
    return first === last ? `${first} · Todo el día` : `${first} – ${last}`;
  }
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
    : `${dateFormatter.format(start)} ${timeFormatter.format(start)} – ${dateFormatter.format(end)} ${timeFormatter.format(end)}`;
}

/** Date -> "YYYY-MM-DD" en hora local. */
export function toDateInput(date: Date) {
  return toISOStringWithTimezone(date).slice(0, 10);
}

/** Date -> "YYYY-MM-DDTHH:mm" en hora local (input datetime-local). */
export function toDateTimeInput(date: Date) {
  return toISOStringWithTimezone(date).slice(0, 16);
}

/** "YYYY-MM-DD" -> medianoche local con offset. */
export function localDateToOffset(date: string, addDays = 0) {
  const [year, month, day] = date.split("-").map(Number);
  return toISOStringWithTimezone(new Date(year, month - 1, day + addDays));
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

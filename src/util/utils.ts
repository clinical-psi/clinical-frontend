import type { DatesSetArg } from "@fullcalendar/core";

export function normalizeCalendarDateTime(value: string) {
  return toISOStringWithTimezone(new Date(value));
}

export function toISOStringWithTimezone(date: Date): string {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? "+" : "-";

  const pad = (num: number, length: number = 2): string => {
    return String(Math.floor(Math.abs(num))).padStart(length, "0");
  };

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);

  const offsetHours = pad(tzo / 60);
  const offsetMinutes = pad(tzo % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${dif}${offsetHours}:${offsetMinutes}`;
}

export function getNextAvailableHourOfDay(date: Date): Date {
  const nextHour = new Date(date);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}

export function formatToDateTime(ahora: Date): string {
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");

  return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
}

/**
 * Calcula el nuevo rango de fechas desde un evento de FullCalendar
 * Compara con el rango anterior para evitar actualizaciones innecesarias
 * @param datesInfo - Evento datesSet de FullCalendar
 * @param prevRange - Rango anterior
 * @returns Nuevo rango si cambió, o null si es igual al anterior
 */
export function calculateDateRange(
  datesInfo: DatesSetArg,
  prevRange: { start: string; end: string } | null,
): { start: string; end: string } | null {
  const startDate = new Date(datesInfo.start).toISOString();
  const endDate = new Date(datesInfo.end).toISOString();

  // Solo actualizar si las fechas realmente cambiaron
  if (prevRange?.start === startDate && prevRange?.end === endDate) {
    return null;
  }

  return { start: startDate, end: endDate };
}

/**
 * Formatea una cita en formato legible: "Sábado, 12 de septiembre 8:00am – 9:00am"
 */
export function formatAppointmentDateTime(
  startStr: string,
  endStr: string,
): string {
  const start = new Date(startStr);
  const end = new Date(endStr);

  const daysOfWeek = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const monthsOfYear = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const dayName = daysOfWeek[start.getDay()];
  const dayNum = start.getDate();
  const monthName = monthsOfYear[start.getMonth()];

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    const paddedMinutes = String(minutes).padStart(2, "0");
    return `${displayHours}:${paddedMinutes}${period}`;
  };

  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return `${dayName[0].toUpperCase() + dayName.slice(1)}, ${dayNum} de ${monthName} ${startTime} – ${endTime}`;
}

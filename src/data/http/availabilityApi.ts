import { del, get, post, put } from "./httpClient";
import type {
  AvailabilityCalendarEvent,
  AvailabilityCalendarFilter,
  AvailabilityException,
  AvailabilityExceptionRequest,
  AvailabilityRule,
  AvailableSlot,
} from "../../types/availability";
import type { AppointmentMode } from "./appointmentsApi";
import type { Specialist } from "../../types/get-specialist";

function compact(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );
}

const base = (specialistId: string) => `/specialists/${specialistId}`;

export const availabilityApi = {
  getMySpecialistProfile: () => get<Specialist>("/specialists/me"),

  getRules: (specialistId: string) =>
    get<AvailabilityRule[]>(`${base(specialistId)}/availability-rules`),

  replaceRules: (specialistId: string, rules: AvailabilityRule[]) =>
    put<AvailabilityRule[]>(`${base(specialistId)}/availability-rules`, rules),

  getExceptions: (specialistId: string, start: string, end: string) =>
    get<AvailabilityException[]>(
      `${base(specialistId)}/availability-exceptions`,
      { start, end },
    ),

  createException: (
    specialistId: string,
    request: AvailabilityExceptionRequest,
  ) =>
    post<AvailabilityException>(
      `${base(specialistId)}/availability-exceptions`,
      request,
    ),

  updateException: (
    specialistId: string,
    exceptionId: number,
    request: AvailabilityExceptionRequest,
  ) =>
    put<AvailabilityException>(
      `${base(specialistId)}/availability-exceptions/${exceptionId}`,
      request,
    ),

  deleteException: (specialistId: string, exceptionId: number) =>
    del(`${base(specialistId)}/availability-exceptions/${exceptionId}`),

  getAvailableSlots: (
    specialistId: string,
    start: string,
    end: string,
    appointmentMode?: AppointmentMode,
    locationHallId?: string,
  ) =>
    get<AvailableSlot[]>(
      `${base(specialistId)}/available-slots`,
      compact({ start, end, appointmentMode, locationHallId }),
    ),

  getCalendar: (filter: AvailabilityCalendarFilter) =>
    get<AvailabilityCalendarEvent[]>(
      "/availability/calendar",
      compact({
        start: filter.start,
        end: filter.end,
        // Spring enlaza "1,2,3" a List<Long>
        specialistIds: filter.specialistIds?.join(","),
        appointmentMode: filter.appointmentMode,
        locationHallId: filter.locationHallId,
      }),
    ),
};

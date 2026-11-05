import { availabilityApi } from "../data/http/availabilityApi";
import type { AppointmentMode } from "../data/http/appointmentsApi";
import type {
  AvailabilityCalendarEvent,
  AvailabilityCalendarFilter,
  AvailabilityException,
  AvailabilityExceptionRequest,
  AvailabilityRule,
  AvailableSlot,
} from "../types/availability";
import type { Specialist } from "../types/get-specialist";

/** "09:00:00" -> "09:00" */
export function toHourMinute(time: string) {
  return time.slice(0, 5);
}

function sortRules(rules: AvailabilityRule[]) {
  return [...rules]
    .map((rule) => ({
      ...rule,
      startTime: toHourMinute(rule.startTime),
      endTime: toHourMinute(rule.endTime),
    }))
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
    );
}

export const availabilityService = {
  async getMySpecialistProfile(): Promise<Specialist> {
    return availabilityApi.getMySpecialistProfile();
  },

  async getRules(specialistId: string): Promise<AvailabilityRule[]> {
    return sortRules(await availabilityApi.getRules(specialistId));
  },

  async replaceRules(
    specialistId: string,
    rules: AvailabilityRule[],
  ): Promise<AvailabilityRule[]> {
    const payload = rules.map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startTime: toHourMinute(rule.startTime),
      endTime: toHourMinute(rule.endTime),
      appointmentMode: rule.appointmentMode ?? null,
      locationId:
        rule.appointmentMode === "ONLINE" ? null : (rule.locationId ?? null),
      slotMinutes: rule.slotMinutes ?? null,
      bufferMinutes: rule.bufferMinutes ?? null,
      validFrom: rule.validFrom || null,
      validTo: rule.validTo || null,
      timeZone: rule.timeZone || null,
    }));
    return sortRules(await availabilityApi.replaceRules(specialistId, payload));
  },

  async getExceptions(
    specialistId: string,
    start: string,
    end: string,
  ): Promise<AvailabilityException[]> {
    const exceptions = await availabilityApi.getExceptions(
      specialistId,
      start,
      end,
    );
    return [...exceptions].sort((a, b) => a.startAt.localeCompare(b.startAt));
  },

  async saveException(
    specialistId: string,
    request: AvailabilityExceptionRequest,
    exceptionId?: number,
  ): Promise<AvailabilityException> {
    const payload: AvailabilityExceptionRequest = {
      ...request,
      reason: request.reason?.trim() || undefined,
      locationId:
        request.appointmentMode === "ONLINE"
          ? null
          : (request.locationId ?? null),
    };
    return exceptionId
      ? availabilityApi.updateException(specialistId, exceptionId, payload)
      : availabilityApi.createException(specialistId, payload);
  },

  async deleteException(
    specialistId: string,
    exceptionId: number,
  ): Promise<void> {
    return availabilityApi.deleteException(specialistId, exceptionId);
  },

  async getAvailableSlots(
    specialistId: string,
    start: string,
    end: string,
    appointmentMode?: AppointmentMode,
    locationId?: string,
  ): Promise<AvailableSlot[]> {
    return availabilityApi.getAvailableSlots(
      specialistId,
      start,
      end,
      appointmentMode,
      locationId,
    );
  },

  async getCalendarEvents(
    filter: AvailabilityCalendarFilter,
  ): Promise<AvailabilityCalendarEvent[]> {
    return availabilityApi.getCalendar(filter);
  },
};

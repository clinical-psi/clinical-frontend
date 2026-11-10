import { get, post, del, patch, putForm } from "./httpClient";
import type {
  Specialist,
  SpecialistAppointment,
} from "../../types/get-specialist";
import type { CreateSpecialistRequest } from "../../types/create-specialist";
import type { PatientPage } from "../../types/get-patient";

export type { Specialist, PatientPage };

export type SpecialistAccessStatus = "NONE" | "PENDING" | "EXPIRED" | "CANCELLED" | "ACTIVE" | "REVOKED" | "ACCOUNT_DISABLED";
export type SpecialistAccess = {
  status: SpecialistAccessStatus; email: string | null; expiresAt: string | null; userId: number | null;
};
export type SelfSpecialist = { id: number | null; status: SpecialistAccessStatus | "INACTIVE" };
export type SpecialistAccessAction = "invite" | "resend" | "cancel" | "revoke" | "restore";

export const specialistsApi = {
  getSelfProfile: () => get<SelfSpecialist>("/specialists/me/profile"),
  activateSelf: () => post<{ id: number }>("/specialists/me/activate", {}),
  getAccess: (id: string) => get<SpecialistAccess>(`/specialists/${id}/access`),
  changeAccess: (id: string, action: SpecialistAccessAction, email?: string) =>
    post<SpecialistAccess>(`/specialists/${id}/access/${action}`, email ? { email } : {}),
  getById: async (specialistId: string) => {
    return get<Specialist>(`/specialists/${specialistId}`);
  },

  getMyPatients: async (q: string, page = 0, size = 10) => {
    return get<PatientPage>("/specialists/me/patients", { page, size, q });
  },

  list: async () => {
    return get<Specialist[]>("/specialists");
  },

  create: async (specialist: CreateSpecialistRequest) => {
    return post<Specialist>("/specialists", specialist);
  },

  update: async (specialistId: string, specialist: CreateSpecialistRequest) => {
    return patch<Specialist>(`/specialists/${specialistId}`, specialist);
  },

  updateAgendaColor: async (specialistId: string, agendaColor: string) => {
    return patch<Specialist>(`/specialists/${specialistId}/agenda-color`, { agendaColor });
  },

  deactivate: async (specialistId: string) => {
    return del(`/specialists/${specialistId}/deactivate`);
  },

  uploadPhoto: async (specialistId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    await putForm(`/specialists/${specialistId}/photo`, formData);
  },

  getAppointmentsBySpecialistId: async (
    specialistId: string,
    startDate: string,
    endDate: string,
  ) => {
    return get<SpecialistAppointment[]>(
      `/specialists/${specialistId}/appointments`,
      { startDate, endDate },
    );
  },

  deleteAppointmentBySpecialistId: async (
    specialistId: string,
    appointmentId: string,
  ): Promise<void> => {
    await del(`/specialists/${specialistId}/appointments/${appointmentId}`);
  },
};

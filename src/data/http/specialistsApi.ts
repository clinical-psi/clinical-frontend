import { get, post, del, patch, putForm } from "./httpClient";
import type {
  Specialist,
  SpecialistAppointment,
} from "../../types/get-specialist";
import type { CreateSpecialistRequest } from "../../types/create-specialist";
import type { PatientPage } from "../../types/get-patient";

export type { Specialist, PatientPage };

export const specialistsApi = {
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

  deactivate: async (specialistId: string) => {
    return del(`/specialists/${specialistId}/deactivate`, {});
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

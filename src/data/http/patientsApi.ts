import { get, post, put, patch } from "./httpClient";
import type { CreatePatientRequest } from "../../types/create-patient";
import type {
  GetPatient,
  PatientAppointmentPage,
  PatientPage,
} from "../../types/get-patient";

export const patientsApi = {
  list: async (q: string, page = 0, size = 10) => {
    return get<PatientPage>("/patients", { page, size, q });
  },

  getById: async (id: string) => {
    return get<GetPatient>(`/patients/${id}`);
  },

  getAppointmentsByPatientId: async (id: string, page = 0, size = 5) => {
    return get<PatientAppointmentPage>(`/patients/${id}/appointments`, {
      page,
      size,
    });
  },

  create: async (patient: CreatePatientRequest) => {
    return post<GetPatient>("/patients", patient);
  },

  update: async (id: string, patient: CreatePatientRequest) => {
    return put<GetPatient>(`/patients/${id}`, patient);
  },

  deactivate: async (id: string): Promise<void> => {
    await patch(`/patients/${id}/deactivate`);
  },
};

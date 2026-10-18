import { patientsApi } from "../data/http/patientsApi";
import type { CreatePatientRequest } from "../types/create-patient";
import type {
  GetPatient,
  PatientAppointmentPage,
  PatientPage,
} from "../types/get-patient";

export const patientService = {
  async getAll(q: string, page = 0, size = 10): Promise<PatientPage> {
    return patientsApi.list(q, page, size);
  },

  async getById(id: string): Promise<GetPatient> {
    return patientsApi.getById(id);
  },

  async getAppointmentsByPatientId(
    id: string,
    page = 0,
    size = 5,
  ): Promise<PatientAppointmentPage> {
    return patientsApi.getAppointmentsByPatientId(id, page, size);
  },

  async create(patient: CreatePatientRequest): Promise<GetPatient> {
    return patientsApi.create(patient);
  },

  async update(id: string, patient: CreatePatientRequest): Promise<GetPatient> {
    return patientsApi.update(id, patient);
  },

  async deactivate(id: string): Promise<void> {
    return patientsApi.deactivate(id);
  },
};

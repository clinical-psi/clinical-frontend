import { patientsApi } from "../data/http/patientsApi";
import { specialistsApi } from "../data/http/specialistsApi";
import { ROLES, resolveByRole } from "../config/roles";
import type { CreatePatientRequest } from "../types/create-patient";
import type {
  GetPatient,
  PatientAppointmentPage,
  PatientPage,
} from "../types/get-patient";

type ListPatients = (
  q: string,
  page: number,
  size: number,
) => Promise<PatientPage>;

// /specialists/me/patients devuelve una lista completa: se filtra y pagina en cliente.
const listMyPatients: ListPatients = async (q, page, size) => {
  const term = q.trim().toLowerCase();
  return await specialistsApi.getMyPatients(term, page, size);
};

const listPatientStrategies = {
  [ROLES.SPECIALIST]: listMyPatients,
  default: patientsApi.list as ListPatients,
};

export const patientService = {
  async getAll(
    roleNames: string[],
    q: string,
    page = 0,
    size = 10,
  ): Promise<PatientPage> {
    return resolveByRole(roleNames, listPatientStrategies)(q, page, size);
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

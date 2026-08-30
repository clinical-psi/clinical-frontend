import { patientsApi } from '../data/http/patientsApi'
import type { CreatePatient } from '../types/create-patient'

export const patientService = {
  async getAll(): Promise<CreatePatient[]> {
    return patientsApi.list()
  },

  async create(patient: CreatePatient): Promise<CreatePatient> {
    return patientsApi.create(patient)
  },
}

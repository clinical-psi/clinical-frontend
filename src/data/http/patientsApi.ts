import axios from 'axios'
import type { CreatePatient } from '../../types/create-patient'
import type { GetPatient } from '../../types/get-patient'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const patientsApi = {
  list: async () => {
    const { data } = await axios.get<GetPatient[]>(`${API_BASE_URL}/patients`)
    return data
  },
  create: async (patient: CreatePatient) => {
    const { data } = await axios.post<GetPatient>(`${API_BASE_URL}/patients`, patient)
    return data
  },
}


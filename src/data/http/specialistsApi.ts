import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type Specialist = {
  id: string
  firstName: string
  lastName: string
  shortName: string
}

export type SpecialistAppointment = {
  id: string
  appointmentStartDate: string
  appointmentEndDate: string
  patient?: {
    firstName?: string
    lastName?: string
  }
}

export const specialistsApi = {
  list: async () => {
    const { data } = await axios.get<Specialist[]>(`${API_BASE_URL}/specialists`)
    return data
  },

  getAppointmentsBySpecialistId: async (specialistId: string, startDate: string, endDate: string) => {
    const { data } = await axios.get<SpecialistAppointment[]>(
      `${API_BASE_URL}/specialists/${specialistId}/appointments`,
      { params: { startDate, endDate } },
    )

    return data
  },
}

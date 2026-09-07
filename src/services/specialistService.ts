import { specialistsApi, type Specialist, type SpecialistAppointment } from '../data/http/specialistsApi'

export const specialistService = {
  async getAll(): Promise<Specialist[]> {
    return specialistsApi.list()
  },

  async getAppointmentsBySpecialistId(
    specialistId: string,
    startDate: string,
    endDate: string,
  ): Promise<SpecialistAppointment[]> {
    return specialistsApi.getAppointmentsBySpecialistId(specialistId, startDate, endDate)
  },

  async deleteAppointmentBySpecialistId(specialistId: string, appointmentId: string): Promise<void> {
    return specialistsApi.deleteAppointmentBySpecialistId(specialistId, appointmentId)
  },
}

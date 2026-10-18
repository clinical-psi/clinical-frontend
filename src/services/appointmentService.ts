import {
  appointmentsApi,
  type CreateAppointmentRequest,
  type FilterAppointmentsRequest,
} from "../data/http/appointmentsApi";

export const appointmentService = {
  create: async (patientId: string, request: CreateAppointmentRequest) => {
    return appointmentsApi.create(patientId, request);
  },

  getByFilters: async (request: FilterAppointmentsRequest) => {
    return appointmentsApi.getByFilters(request);
  },

  deleteById: async (appointmentId: string): Promise<void> => {
    return appointmentsApi.deleteById(appointmentId);
  },
};

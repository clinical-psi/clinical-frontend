import { get, post, del } from "./httpClient";

export type Specialist = {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
};

export type CreateSpecialistRequest = {
  firstName: string;
  lastName: string;
  notes?: string;
};

export type SpecialistAppointment = {
  id: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
  };
};

export const specialistsApi = {
  list: async () => {
    return get<Specialist[]>("/specialists");
  },

  create: async (specialist: CreateSpecialistRequest) => {
    return post<Specialist>("/specialists", specialist);
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

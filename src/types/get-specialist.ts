export type Specialist = {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
  agendaColor?: string;
  user?: {
    userId: string;
    email?: string | null;
  };
  notes?: string;
  email?: string | null;
  phoneNumber?: string | null;
  photoUrl?: string | null;
};

export type SpecialistAppointment = {
  status: import("../data/http/appointmentsApi").AppointmentStatus;
  id: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
  };
};

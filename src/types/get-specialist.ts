export type Specialist = {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
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
  id: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
  };
};

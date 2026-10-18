export type GetPatient = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthdate?: string;
  notes?: string;
  phoneNumber?: string;
};

export type PatientPage = {
  content: GetPatient[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type PatientAppointment = {
  id: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  appointmentMode?: string;
  feeAmount?: string;
  currencyCode?: string;
  specialistShortName?: string;
};

export type PatientAppointmentPage = {
  content: PatientAppointment[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

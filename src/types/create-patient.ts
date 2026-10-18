export type CreatePatient = {
  id?: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthdate?: string;
  notes?: string;
  phoneNumber?: string;
};

export type CreateAppointment = {
  feeAmount: string;
  currencyCode: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  notes?: string;
  locationId?: number;
  appointmentMode?: string;
};

export type CreatePatientRequest = {
  firstName: string;
  lastName: string;
  email?: string;
  birthdate?: string;
  notes?: string;
  phoneNumber?: string;
  appointmentPlans?: Array<{
    feeAmount: string;
    currencyCode: string;
    notes?: string;
    appointmentNumber: number;
    specialistId: number;
    locationId?: number;
    appointmentMode?: string;
    appointments: CreateAppointment[];
  }>;
};

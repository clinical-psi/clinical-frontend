export type CreatePatient = {
  id?: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthdate?: string;
  notes?: string;
  phoneNumber?: string;
  specialistId?: string;
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
  documentType?: string | null;
  documentNumber?: string;
  preferredName?: string;
  addressLine?: string;
  preferredLanguage?: string;
  genderIdentity?: string | null;
  specialistId?: string | null;
  firstName: string;
  lastName: string;
  email?: string;
  birthdate?: string | null;
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

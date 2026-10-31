export type GetEmergencyContact = {
  emergencyContactId?: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  relationship: string;
  isPhoneValid: boolean;
};

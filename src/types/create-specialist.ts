export type CreateSpecialistRequest = {
  firstName: string;
  lastName: string;
  notes?: string;
  email?: string;
  phoneNumber?: string;
  inviteAccess?: boolean;
};

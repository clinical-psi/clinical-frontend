import { get, post, patch, del } from "./httpClient";
import type { CreateEmergencyContact } from "../../types/create-emergency-contact";
import type { GetEmergencyContact } from "../../types/get-emergency-contact";

export const emergencyContactApi = {
  get: async (patientId: string) => {
    return get<GetEmergencyContact[]>(
      `/patients/${patientId}/emergency-contacts`,
    );
  },

  getById: async (patientId: string, id: string) => {
    return get<GetEmergencyContact>(
      `/patients/${patientId}/emergency-contacts/${id}`,
    );
  },

  create: async (
    patientId: string,
    emergencyContact: CreateEmergencyContact,
  ) => {
    return post<GetEmergencyContact>(
      `/patients/${patientId}/emergency-contacts`,
      emergencyContact,
    );
  },

  update: async (
    patientId: string,
    id: string,
    emergencyContact: CreateEmergencyContact,
  ) => {
    return patch<GetEmergencyContact>(
      `/patients/${patientId}/emergency-contacts/${id}`,
      emergencyContact,
    );
  },

  delete: async (patientId: string, id: string): Promise<void> => {
    await del(`/patients/${patientId}/emergency-contacts/${id}`);
  },
};

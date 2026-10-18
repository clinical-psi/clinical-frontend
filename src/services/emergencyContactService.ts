import { emergencyContactApi } from "./../data/http/emergencyContactsApi";
import type { CreateEmergencyContact } from "../types/create-emergency-contact";
import type { GetEmergencyContact } from "../types/get-emergency-contact";

export const emergencyContactService = {
  async get(patientId: string): Promise<GetEmergencyContact[]> {
    return emergencyContactApi.get(patientId);
  },
  async getById(patientId: string, id: string): Promise<GetEmergencyContact> {
    return emergencyContactApi.getById(patientId, id);
  },
  async create(
    patientId: string,
    emergencyContact: CreateEmergencyContact,
  ): Promise<GetEmergencyContact> {
    return emergencyContactApi.create(patientId, emergencyContact);
  },
  async update(
    patientId: string,
    id: string,
    emergencyContact: CreateEmergencyContact,
  ): Promise<GetEmergencyContact> {
    return emergencyContactApi.update(patientId, id, emergencyContact);
  },
  async delete(patientId: string, id: string): Promise<void> {
    await emergencyContactApi.delete(patientId, id);
  },
};

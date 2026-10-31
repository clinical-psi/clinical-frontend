import { specialistsApi } from "../data/http/specialistsApi";
import { compressAvatarImage } from "../util/image-utils";
import type {
  Specialist,
  SpecialistAppointment,
} from "../types/get-specialist";
import type { CreateSpecialistRequest } from "../types/create-specialist";

export const specialistService = {
  async getById(specialistId: string): Promise<Specialist> {
    return specialistsApi.getById(specialistId);
  },

  async getAll(): Promise<Specialist[]> {
    return specialistsApi.list();
  },

  async deactivate(specialistId: string): Promise<void> {
    return specialistsApi.deactivate(specialistId);
  },

  async update(
    specialistId: string,
    specialist: CreateSpecialistRequest,
  ): Promise<Specialist> {
    return specialistsApi.update(specialistId, specialist);
  },

  async create(specialist: CreateSpecialistRequest): Promise<Specialist> {
    return specialistsApi.create(specialist);
  },

  async uploadPhoto(specialistId: string, file: File): Promise<void> {
    const compressedFile = await compressAvatarImage(file);
    return specialistsApi.uploadPhoto(specialistId, compressedFile);
  },

  async getAppointmentsBySpecialistId(
    specialistId: string,
    startDate: string,
    endDate: string,
  ): Promise<SpecialistAppointment[]> {
    return specialistsApi.getAppointmentsBySpecialistId(
      specialistId,
      startDate,
      endDate,
    );
  },

  async deleteAppointmentBySpecialistId(
    specialistId: string,
    appointmentId: string,
  ): Promise<void> {
    return specialistsApi.deleteAppointmentBySpecialistId(
      specialistId,
      appointmentId,
    );
  },
};

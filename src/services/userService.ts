import { usersApi } from "../data/http/usersApi";
import type { CreateUser } from "../types/create-user";
import type { GetUser, UserPage } from "../types/get-user";

export const userService = {
  async getById(userId: string): Promise<GetUser> {
    return usersApi.getById(userId);
  },

  async getAll(q: string, page = 0, size = 10): Promise<UserPage> {
    return usersApi.list(q, page, size);
  },

  async update(userId: string, user: CreateUser): Promise<GetUser> {
    return usersApi.update(userId, user);
  },

  async create(user: CreateUser): Promise<GetUser> {
    return usersApi.create(user);
  },

  async uploadPhoto(userId: string, file: File): Promise<void> {
    return usersApi.uploadPhoto(userId, file);
  },
};

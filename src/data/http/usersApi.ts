import type { CreateUser } from "../../types/create-user";
import type { GetUser, UserPage } from "../../types/get-user";
import { get, post, patch, putForm } from "./httpClient";

export const usersApi = {
  list: async (q: string, page = 0, size = 10) => {
    return get<UserPage>("/users", { page, size, q });
  },

  getById: async (id: string) => {
    return get<GetUser>(`/users/${id}`);
  },

  create: async (user: CreateUser) => {
    return post<GetUser>("/users", user);
  },

  update: async (id: string, user: CreateUser) => {
    return patch<GetUser>(`/users/${id}`, user);
  },

  uploadPhoto: async (userId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    await putForm(`/users/${userId}/photo`, formData);
  },
};

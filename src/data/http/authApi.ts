import type { LoginCredentials, AuthResponse } from "../../types/auth";
import { post } from "./httpClient";

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/login", credentials);
}

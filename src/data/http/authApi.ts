import type { LoginCredentials, AuthResponse } from "../../types/auth";
import { post } from "./httpClient";

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/login", credentials);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await post<void>("/auth/change-password", {
    currentPassword,
    password: newPassword,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await post<void>("/auth/forgot-password", { email });
}

export async function verifyOtp(
  email: string,
  otp: string,
): Promise<{ resetToken: string }> {
  return post<{ resetToken: string }>("/auth/verify-otp", { email, otp });
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<void> {
  await post<void>("/auth/reset-password", {
    email,
    resetToken,
    password: newPassword,
  });
}

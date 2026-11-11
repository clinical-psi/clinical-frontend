import type { LoginCredentials, LoginResponse, AuthResponse, RegistrationRequest } from "../../types/auth";
import { post } from "./httpClient";

export const registerUser = (request: RegistrationRequest) =>
  post<void>("/auth/register", request, { authenticated: false });

export const currentSession = () => post<AuthResponse>("/auth/session", {});

export type InvitationPreview = { clinicName: string; email: string; existingAccount: boolean };
export const previewSpecialistInvitation = (token: string) =>
  post<InvitationPreview>("/auth/specialist-invitations/preview", { token }, { authenticated: false });
export const acceptSpecialistInvitation = (token: string, password: string) =>
  post<void>("/auth/specialist-invitations/accept", { token, password }, { authenticated: false });

export async function loginUser(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  return post<LoginResponse>("/auth/login", credentials, { authenticated: false });
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

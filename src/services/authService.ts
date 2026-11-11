import type { LoginCredentials, LoginResponse, AuthResponse } from "../types/auth";
import {
  loginUser,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  currentSession,
} from "../data/http/authApi";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await loginUser(credentials);
    if (!("token" in response) || !response.token) return response;
    return this.saveSession(response);
  },

  saveSession(response: AuthResponse): AuthResponse {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    return response;
  },

  async refreshSession(): Promise<AuthResponse> {
    return this.saveSession(await currentSession());
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    return changePassword(currentPassword, newPassword);
  },

  forgotPassword,
  verifyOtp,
  resetPassword,

  clearMustChangePassword(): AuthResponse | null {
    const user = this.getUser();
    if (!user) return null;
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthResponse | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  clearAuth(): void {
    this.logout();
  },
};

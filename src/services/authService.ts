import type { LoginCredentials, AuthResponse } from "../types/auth";
import { loginUser } from "../data/http/authApi";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await loginUser(credentials);

    // Guardar token y datos del usuario en localStorage
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));

    return response;
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

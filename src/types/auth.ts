export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: number;
}

export type TenantChoice = { tenantId: number; tenantName: string };
export type LoginResponse = AuthResponse | { preToken: string; tenants: TenantChoice[] };

export type RegistrationRequest = LoginCredentials & {
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantDescription?: string;
  specialist: boolean;
};

export interface AuthResponse {
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  type: string;
  userId: number;
  roles?: { roleName: string }[];
  mustChangePassword?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthResponse | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  markPasswordChanged: () => void;
  refreshSession: () => Promise<void>;
}

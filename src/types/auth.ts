export interface LoginCredentials {
  email: string;
  password: string;
}

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
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  markPasswordChanged: () => void;
}

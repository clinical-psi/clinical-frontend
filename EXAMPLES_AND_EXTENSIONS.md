# Ejemplos y Extensiones - Sistema de Autenticación

## 1. Agregar Validaciones de Email

**Archivo: `src/presentation/LoginPage.tsx`**

```typescript
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!credentials.email || !credentials.password) {
    setError("Por favor completa todos los campos");
    return;
  }

  if (!isValidEmail(credentials.email)) {
    setError("Por favor ingresa un email válido");
    return;
  }

  if (credentials.password.length < 6) {
    setError("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  try {
    await login(credentials);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error al iniciar sesión");
  }
};
```

---

## 2. Agregar Recuerdame

**Modificar: `src/presentation/LoginPage.tsx`**

```typescript
const [rememberMe, setRememberMe] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // ... validaciones ...

  try {
    await login(credentials)
    if (rememberMe) {
      localStorage.setItem('remembered_email', credentials.email)
    } else {
      localStorage.removeItem('remembered_email')
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
  }
}

// En useEffect al montar:
useEffect(() => {
  const remembered = localStorage.getItem('remembered_email')
  if (remembered) {
    setCredentials(prev => ({ ...prev, email: remembered }))
  }
}, [])

// En el JSX:
<div className="form-group checkbox-group">
  <label>
    <input
      type="checkbox"
      checked={rememberMe}
      onChange={(e) => setRememberMe(e.target.checked)}
      disabled={loading}
    />
    Recuerda mi email
  </label>
</div>
```

---

## 3. Agregar Refresh Token

**Crear: `src/data/http/authApi.ts`**

```typescript
export async function refreshToken(): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/refresh", {
    token: localStorage.getItem("auth_token"),
  });
}
```

**Modificar: `src/data/http/httpClient.ts`**

```typescript
export async function post<T>(path: string, data: unknown): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  // Si 401, intentar refrescar token
  if (response.status === 401) {
    try {
      await refreshToken();
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Logout si refresh falla
      authService.logout();
      throw error;
    }
  }

  if (!response.ok) {
    throw new Error(`La solicitud fallo con el estado ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

---

## 4. Agregar Logout con Backend

**Modificar: `src/data/http/authApi.ts`**

```typescript
export async function logoutUser(): Promise<void> {
  await post("/auth/logout", { token: localStorage.getItem("auth_token") });
}
```

**Modificar: `src/services/authService.ts`**

```typescript
import { logoutUser } from "../data/http/authApi";

logout: async () => {
  try {
    await logoutUser();
  } catch (error) {
    console.error("Error al hacer logout:", error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
```

---

## 5. Agregar Recuperación de Contraseña

**Crear: `src/presentation/ForgotPasswordPage.tsx`**

```typescript
import { useState } from 'react'
import { post } from '../data/http/httpClient'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await post('/auth/forgot-password', { email })
      setMessage('Se envió un enlace de recuperación a tu email')
      setEmail('')
    } catch (err) {
      setError('Error al enviar enlace de recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Recuperar Contraseña</h1>
        <form onSubmit={handleSubmit}>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 6. Agregar Rol Based Access Control (RBAC)

**Modificar: `src/types/auth.ts`**

```typescript
export interface AuthResponse {
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  type: string;
  userId: number;
  role: "admin" | "therapist" | "user"; // Agregar
  permissions: string[]; // Agregar
}
```

**Crear: `src/presentation/RoleProtectedRoute.tsx`**

```typescript
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface RoleProtectedRouteProps {
  children: ReactNode
  requiredRole: string
}

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!user || user.role !== requiredRole) {
    return <div>No tienes permisos para acceder a esta página</div>
  }

  return <>{children}</>
}
```

**Uso:**

```typescript
<RoleProtectedRoute requiredRole="admin">
  <AdminPanel />
</RoleProtectedRoute>
```

---

## 7. Agregar Interceptor de Errores Globales

**Modificar: `src/data/http/httpClient.ts`**

```typescript
export async function post<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        // Token expirado
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        break;
      case 403:
        throw new Error("No tienes permisos para realizar esta acción");
      case 404:
        throw new Error("Recurso no encontrado");
      case 500:
        throw new Error("Error del servidor");
      default:
        throw new Error(errorData.message || `Error ${response.status}`);
    }
  }

  return response.json() as Promise<T>;
}
```

---

## 8. Agregar Mostrar/Ocultar Contraseña

**Modificar: `src/presentation/LoginPage.tsx`**

```typescript
const [showPassword, setShowPassword] = useState(false)

// En el JSX:
<div className="form-group">
  <label htmlFor="password">Contraseña</label>
  <div className="password-input-wrapper">
    <input
      type={showPassword ? 'text' : 'password'}
      id="password"
      name="password"
      value={credentials.password}
      onChange={handleChange}
      placeholder="••••••••"
      disabled={loading}
      required
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
      disabled={loading}
    >
      {showPassword ? '👁️' : '👁️‍🗨️'}
    </button>
  </div>
</div>
```

**CSS para `LoginPage.css`:**

```css
.password-input-wrapper {
  position: relative;
  display: flex;
}

.password-input-wrapper input {
  flex: 1;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 0 8px;
  color: #666;
}
```

---

## 9. Agregar 2FA (Two-Factor Authentication)

**Crear: `src/presentation/TwoFactorPage.tsx`**

```typescript
export function TwoFactorPage({ userId }: { userId: number }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await post<AuthResponse>('/auth/verify-2fa', {
        userId,
        code,
      })

      // Usar el mismo flujo de login
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('auth_user', JSON.stringify(response))
    } catch (err) {
      setError('Código 2FA inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Verificación en Dos Pasos</h1>
        <p>Ingresa el código de 6 dígitos de tu aplicación authenticadora</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 10. Agregar Toast de Notificaciones

**Crear: `src/context/ToastContext.tsx`**

```typescript
import { createContext, useState } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
} | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type']) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}
```

---

Estos son solo algunos ejemplos. Adapta según tus necesidades específicas.

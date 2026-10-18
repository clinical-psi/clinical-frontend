# Capa de Login - Clinical Frontend

## ✅ Implementación Completada

Se ha implementado una **capa completa de autenticación** para tu proyecto clinical-frontend.

---

## 📁 Estructura de Archivos Creados

```
src/
├── types/
│   └── auth.ts                          # Interfaces de autenticación
├── data/http/
│   └── authApi.ts                       # API call para login
├── services/
│   └── authService.ts                   # Servicio de autenticación
├── hooks/
│   └── useAuth.ts                       # Hook personalizado
├── presentation/
│   ├── contexts/
│   │   ├── AuthContext.tsx              # Contexto React
│   │   └── AuthProvider.tsx             # Proveedor de contexto
│   ├── LoginPage.tsx                    # Página de login
│   ├── LoginPage.css                    # Estilos de login
│   ├── ProtectedRoute.tsx               # Componente para rutas protegidas
│   └── AppLayout.tsx                    # (Modificado - botón logout)
├── App.tsx                              # (Modificado - integración)
└── data/http/httpClient.ts              # (Modificado - headers auth)
```

---

## 🔐 Flujo de Autenticación

1. **Usuario abre la aplicación**
   - ProtectedRoute verifica si está autenticado
2. **Si NO está autenticado**
   - Se muestra LoginPage
   - Usuario ingresa email y password
3. **Envío de credenciales**
   - POST a `/auth/login`
   - Credenciales: `{ email: string, password: string }`
4. **Backend devuelve**

   ```json
   {
     "email": "usuario@example.com",
     "firstName": "Juan",
     "lastName": "Pérez",
     "token": "eyJhbGc...",
     "type": "Bearer",
     "userId": 1
   }
   ```

5. **Almacenamiento local**
   - Token → `localStorage['auth_token']`
   - Usuario → `localStorage['auth_user']` (JSON)
6. **Headers automáticos**
   - Todas las peticiones incluyen: `Authorization: Bearer {token}`

7. **Acceso a componentes protegidos**
   - Se muestra AppLayout y el contenido principal
   - Botón "Cerrar sesión" disponible en el sidebar

---

## 🎨 Componentes Disponibles

### LoginPage

- Formulario responsive con validación
- Manejo de errores
- Loading state durante la petición
- Estilos modernos con gradientes

### ProtectedRoute

- Verifica autenticación antes de mostrar contenido
- Loading screen mientras se verifica el estado
- Redirige a login si no está autenticado

### AppLayout (Mejorado)

- Muestra nombre y email del usuario
- Botón "Cerrar sesión" funcional
- Información del usuario en el sidebar

---

## 🔗 Uso del Hook `useAuth`

```typescript
import { useAuth } from '@/hooks/useAuth'

function MiComponente() {
  const { isAuthenticated, user, loading, login, logout } = useAuth()

  return (
    <div>
      {user && <p>Bienvenido, {user.firstName}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

---

## ⚙️ Configuración

### Base URL de API

El cliente usa la variable de entorno `VITE_API_URL` o por defecto `http://localhost:8080`

### Crear archivo `.env`

```
VITE_API_URL=http://tu-backend.com
```

---

## 🚀 Próximos Pasos

1. **Ajustar endpoint backend**
   - Verifica que tu backend tenga implementado `/auth/login`
   - Retorna la respuesta en el formato especificado

2. **Personalizar LoginPage**
   - Agregar logo de tu organización
   - Modificar colores en `LoginPage.css`
   - Cambiar textos y validaciones

3. **Agregar más funcionalidades**
   - Recuperación de contraseña
   - Registro de usuarios
   - Refresh tokens
   - Logout con backend

4. **Testing**
   - Iniciar el servidor de desarrollo: `npm run dev`
   - Prueba con credenciales correctas e incorrectas

---

## 📝 Variables Guardadas en localStorage

| Clave        | Tipo   | Descripción                |
| ------------ | ------ | -------------------------- |
| `auth_token` | string | Token Bearer del usuario   |
| `auth_user`  | JSON   | Datos del usuario logueado |

---

## 🔄 Métodos del authService

```typescript
// Login
await authService.login(credentials);

// Logout
authService.logout();

// Obtener token
authService.getToken();

// Obtener usuario
authService.getUser();

// Verificar autenticación
authService.isAuthenticated();

// Limpiar auth
authService.clearAuth();
```

---

## ✨ Características Principales

✅ Autenticación con email/password  
✅ Almacenamiento seguro de token  
✅ Rutas protegidas  
✅ Headers automáticos en peticiones  
✅ Información del usuario visible  
✅ Logout funcional  
✅ Manejo de errores  
✅ TypeScript totalmente tipado  
✅ Responsive design  
✅ React Context Pattern

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que el backend esté levantado
2. Revisa la consola del navegador (F12)
3. Comprueba que las credenciales sean correctas
4. Asegúrate que VITE_API_URL sea correcto

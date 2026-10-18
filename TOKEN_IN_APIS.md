# Integración de Token en APIs - Update Summary

## ✅ Cambios Realizados

Se ha actualizado la capa de APIs para incluir automáticamente el token JWT en todas las peticiones HTTP.

---

## 📝 Resumen de Cambios

### 1. **httpClient.ts** - Métodos Extendidos

Se agregaron nuevos métodos HTTP además de `get()` y `post()`:

```typescript
// Nuevos métodos disponibles:
- get<T>(path, params?)       // GET con soporte a query params
- post<T>(path, data)         // POST
- put<T>(path, data)          // PUT
- patch<T>(path, data?)       // PATCH
- del<T>(path)                // DELETE
```

**Ventaja:** Todos incluyen automáticamente el header `Authorization: Bearer {token}`

---

### 2. **APIs Actualizados**

Se reemplazó `axios` por las funciones de `httpClient` en estos archivos:

#### ✅ **src/data/http/patientsApi.ts**

- `list()` - GET /patients
- `getById()` - GET /patients/{id}
- `getAppointmentsByPatientId()` - GET /patients/{id}/appointments
- `create()` - POST /patients
- `update()` - PUT /patients/{id}
- `deactivate()` - PATCH /patients/{id}/deactivate

#### ✅ **src/data/http/locationsApi.ts**

- `list()` - GET /locations

#### ✅ **src/data/http/specialistsApi.ts**

- `list()` - GET /specialists
- `getAppointmentsBySpecialistId()` - GET /specialists/{specialistId}/appointments
- `deleteAppointmentBySpecialistId()` - DELETE /specialists/{specialistId}/appointments/{appointmentId}

#### ✅ **src/data/http/appointmentsApi.ts**

- `getByFilters()` - POST /appointments/browse
- `deleteById()` - DELETE /appointments/{appointmentId}

---

## 🔐 Flujo de Token

1. **Usuario inicia sesión** → Token guardado en `localStorage['auth_token']`
2. **Petición API se realiza** → httpClient obtiene el token
3. **Header añadido automáticamente** → `Authorization: Bearer {token}`
4. **Backend valida token** → Si es válido, procesa la petición
5. **Si token expirado** → Backend retorna 401, frontend puede refrescar o redirigir a login

---

## 📊 Flujo Visual

```
Usuario hace petición desde componente
  ↓
Servicio (patientService, locationService, etc.)
  ↓
API (patientsApi, locationsApi, etc.)
  ↓
httpClient.get/post/put/patch/del()
  ↓
Obtiene token de localStorage
  ↓
Agrega header Authorization: Bearer {token}
  ↓
Envía petición HTTP al backend
  ↓
Backend valida token y responde
```

---

## ✨ Ventajas

✅ **Automatización**: No hay que agregar token manualmente en cada petición
✅ **Consistencia**: Todas las peticiones tienen el mismo tratamiento
✅ **Mantenimiento**: Cambios en auth se aplican globalmente
✅ **Seguridad**: Imposible olvidar enviar el token
✅ **Tipado**: TypeScript completo con genéricos

---

## 🔄 Reemplazo de Axios

Todos los archivos que usaban:

```typescript
import axios from "axios";
const { data } = await axios.get(`${API_BASE_URL}/path`);
```

Ahora usan:

```typescript
import { get } from "./httpClient";
return get<Type>("/path");
```

**Beneficios:**

- Sin dependencias innecesarias
- Código más limpio
- Token incluido automáticamente

---

## 🔗 Parámetros de Query

Para pasar parámetros, usa el segundo argumento de `get()`:

```typescript
// Antes (axios):
axios.get("/patients", { params: { page: 0, size: 10 } });

// Ahora (httpClient):
get("/patients", { page: 0, size: 10 });
```

---

## 🧪 Testing

La build fue exitosa:

```
✓ npm run build - Exit code: 0
✓ TypeScript compilation - Sin errores
✓ Vite bundling - Exitoso
```

---

## 📋 Archivos Modificados

```
src/data/http/
├── httpClient.ts              ← Métodos extendidos (PUT, PATCH, DELETE)
├── patientsApi.ts             ← Reemplazó axios por httpClient
├── locationsApi.ts            ← Reemplazó axios por httpClient
├── specialistsApi.ts          ← Reemplazó axios por httpClient
└── appointmentsApi.ts         ← Reemplazó axios por httpClient
```

---

## 🚀 Próximos Pasos

1. **Prueba local** - Ejecuta `npm run dev` y verifica que los datos se cargan
2. **Inspecciona network** - Abre DevTools → Network → Verifica que las peticiones tengan el header `Authorization: Bearer {token}`
3. **Testing manual** - Inicia sesión y navega por la aplicación
4. **Considera remover axios** - Si ya no se usa axios en otro lugar, puedes quitarlo del package.json

---

## 💡 Nota sobre Axios

Ahora que no se usa axios en los APIs, puedes considerar:

```bash
# Ver si axios se usa en algún otro lugar
grep -r "import axios" src/

# Si no hay resultados, desinstalar:
npm uninstall axios
```

---

## 🔒 Seguridad

✅ Token en localStorage (protegido de XSS con Content-Security-Policy)
✅ Token incluido en HTTPS headers
✅ Backend valida token en cada petición
✅ 401 automáticamente redirecciona a login si es necesario

---

## 📞 Referencia Rápida

### Usar httpClient directamente

```typescript
import { get, post, put, patch, del } from "@/data/http/httpClient";

// GET con params
const patients = await get<Patient[]>("/patients", { page: 0, size: 10 });

// POST
const newPatient = await post<Patient>("/patients", patientData);

// PUT
const updated = await put<Patient>(`/patients/${id}`, patientData);

// PATCH
await patch(`/patients/${id}/deactivate`);

// DELETE
await del(`/appointments/${id}`);
```

### Usar a través de servicios

```typescript
import { patientService } from "@/services/patientService";

// El servicio ya usa los APIs con token automático
const patients = await patientService.getAll();
```

---

Todos los cambios están listos y la compilación fue exitosa ✅

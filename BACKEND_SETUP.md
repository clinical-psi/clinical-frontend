# Configuración del Backend - Endpoint de Login

## 📋 Checklist para Backend

Este documento describe qué debe implementar tu backend para que funcione correctamente con la capa de login del frontend.

---

## ✅ Endpoint Requerido

### POST `/auth/login`

**Request:**

```json
{
  "email": "usuario@example.com",
  "password": "suContraseña123"
}
```

**Response (200 OK):**

```json
{
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "userId": 1
}
```

**Error Responses:**

```json
// 401 Unauthorized - Credenciales inválidas
{
  "message": "Email o contraseña incorrectos"
}
```

```json
// 400 Bad Request - Campos faltantes
{
  "message": "Email y contraseña son requeridos"
}
```

```json
// 500 Internal Server Error
{
  "message": "Error al procesar la solicitud"
}
```

---

## 🔒 Requisitos de Seguridad

### Token JWT

- ✅ Generar un JWT válido como token
- ✅ El token debe incluir el `userId` en el payload
- ✅ Tiempo de expiración recomendado: 24 horas a 7 días
- ✅ Usar una clave secreta fuerte en el servidor

### Contraseñas

- ✅ Hash de contraseña usando bcrypt o similar
- ✅ NO almacenar contraseñas en plain text
- ✅ Validar longitud mínima (6-8 caracteres)

### Validaciones

- ✅ Validar formato de email
- ✅ Validar que los campos no sean nulos
- ✅ Rate limiting para prevenir brute force
- ✅ Registrar intentos de login fallidos

---

## 🌐 Headers CORS

Permitir requests desde el frontend:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 3600
```

Para producción:

```
Access-Control-Allow-Origin: https://tu-dominio.com
```

---

## 🔑 Header Authorization en Peticiones Posteriores

El frontend enviará todas las peticiones con:

```
Authorization: Bearer {token}
```

**Backend debe:**

- ✅ Validar que el header `Authorization` existe
- ✅ Extraer el token del formato `Bearer {token}`
- ✅ Verificar que el JWT es válido
- ✅ Extraer el `userId` del JWT
- ✅ Retornar 401 si el token es inválido o expirado

---

## 📚 Endpoints Adicionales (Opcionales)

### GET `/auth/me`

Retorna la información del usuario actual basado en el token.

**Request:**

```
GET /auth/me
Authorization: Bearer {token}
```

**Response:**

```json
{
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "userId": 1,
  "role": "therapist"
}
```

---

### POST `/auth/logout`

Invalidar el token en el servidor (opcional pero recomendado).

**Request:**

```
POST /auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "{token}"
}
```

**Response:**

```json
{
  "message": "Logout exitoso"
}
```

---

### POST `/auth/refresh`

Refrescar un token expirado (para mantener sesión activa).

**Request:**

```
POST /auth/refresh
Content-Type: application/json

{
  "token": "{token_expirado}"
}
```

**Response:**

```json
{
  "token": "{nuevo_token}",
  "expiresIn": 86400
}
```

---

### POST `/auth/forgot-password`

Solicitar recuperación de contraseña.

**Request:**

```json
{
  "email": "usuario@example.com"
}
```

**Response:**

```json
{
  "message": "Se envió un enlace de recuperación"
}
```

---

### POST `/auth/reset-password`

Cambiar contraseña con token de reset.

**Request:**

```json
{
  "token": "reset_token_123",
  "newPassword": "nuevaContraseña456"
}
```

**Response:**

```json
{
  "message": "Contraseña actualizada"
}
```

---

## 🗂️ Estructura de Base de Datos

Tabla de usuarios recomendada:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

Tabla de tokens (opcional, para invalidar en logout):

```sql
CREATE TABLE tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📝 Ejemplo de Implementación (Node.js/Express)

```javascript
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta";

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Email o contraseña incorrectos",
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email o contraseña incorrectos",
      });
    }

    // Generar JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Retornar respuesta
    res.json({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      token,
      type: "Bearer",
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

// Middleware para verificar token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    req.user = user;
    next();
  });
}

// Ruta protegida de ejemplo
app.get("/api/patients", authenticateToken, (req, res) => {
  // Solo usuarios autenticados pueden acceder
  res.json({ message: "Datos de pacientes" });
});

app.listen(8080, () => {
  console.log("Servidor ejecutándose en puerto 8080");
});
```

---

## 🧪 Testing Manual

Usa cURL o Postman para probar:

```bash
# Test de login correcto
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test de login incorrecto
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Test de ruta protegida
curl -X GET http://localhost:8080/api/patients \
  -H "Authorization: Bearer {token}"
```

---

## 📋 Checklist Final

- [ ] Endpoint `/auth/login` implementado
- [ ] JWT generado correctamente
- [ ] Contraseñas hasheadas (bcrypt)
- [ ] CORS configurado
- [ ] Rate limiting implementado
- [ ] Validaciones en backend
- [ ] Headers de Authorization verificados
- [ ] Errores con códigos HTTP correctos
- [ ] Logging de intentos de login
- [ ] Database schema preparada
- [ ] Environment variables configuradas
- [ ] Documentación de API actualizada

---

## 🚨 Notas de Seguridad Importantes

1. **HTTPS en Producción**
   - Siempre usar HTTPS, nunca HTTP
   - Los tokens se envían en los headers

2. **Validación de Input**
   - Sanitizar email y password
   - Validar longitud y formato

3. **Rate Limiting**
   - Limitar intentos de login por IP
   - Bloquear después de N intentos fallidos

4. **Logging**
   - Registrar intentos de login fallidos
   - Monitorear actividad sospechosa

5. **Token Expiration**
   - Implementar refresh tokens
   - Limpiar tokens expirados

6. **CORS Seguro**
   - Solo permitir orígenes conocidos
   - NO usar `*` en producción

---

Contacta al equipo de frontend si necesitas ajustar algo de la respuesta del API.

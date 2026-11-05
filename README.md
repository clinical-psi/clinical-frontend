# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
# clinical-frontend

## Navegacion responsive

- Desde 1024 px (64 em con tamano de fuente base de 16 px), la barra lateral
  permanece visible y permite desplazamiento vertical en pantallas bajas.
- En movil y tablet, una cabecera muestra la seccion actual y abre un drawer
  lateral con las mismas opciones autorizadas y el cierre de sesion.
- El drawer se cierra al elegir una seccion, pulsar Escape, tocar el fondo o
  usar el boton de cierre. Al pasar a escritorio se descarta su estado abierto.
- Mantine controla el foco y bloquea el desplazamiento del fondo. Los controles
  principales tienen al menos 44 px de alto y foco visible.
- El enlace "Saltar al contenido" permite evitar la navegacion con teclado.

## Historia clinica del paciente

La pantalla de edicion separa **Datos generales**, **Anamnesis** y **Evolucion**.
Primero se guarda el paciente; las pestanas clinicas se habilitan al editarlo.
Los datos generales incluyen documento, nombre preferido, direccion, idioma e
identidad de genero opcional. Las notas administrativas no sustituyen la historia
clinica.

- `TENANT_ADMIN` consulta la historia clinica de pacientes de su tenant.
- `SPECIALIST` consulta y escribe solamente la de pacientes asignados.
- `ADMIN` y `USER` por si solos no ven las pestanas clinicas.
- Los permisos efectivos por paciente vienen de
  `GET /patients/{patientId}/clinical-access`; el backend vuelve a validarlos en
  cada operacion. Tener acceso administrativo no concede escritura clinica.

La anamnesis se guarda independientemente como borrador, conserva versiones y se
puede finalizar. Una enmienda genera otro borrador vinculado, sin sobrescribir el
registro finalizado. Un conflicto de version (HTTP 409) exige recargar el registro;
no se reintenta ni se reemplazan cambios automaticamente.

Las notas de evolucion usan apartados subjetivo, objetivo, evaluacion y plan.
Se vinculan a una cita y se registran definitivamente; una correccion agrega otra
nota enlazada a la original. No se eliminan desde esta pantalla.
La lista de citas permite cargar paginas adicionales.

El formulario clinico no usa almacenamiento local para guardar su contenido.
Los campos vacios significan "no registrado", no ausencia del antecedente.
Un HTTP 401 o 403 en rutas protegidas limpia la sesion y muestra el login.
En el login, un HTTP 401 o 403 muestra "Credenciales incorrectas" sin reiniciar
el formulario. Otros errores conservan su mensaje y no se interpretan como
una contraseña incorrecta.

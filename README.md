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

## Formularios, notificaciones y confirmaciones

### Estados de citas

- El calendario conserva el color de la agenda del especialista. El estado se
  distingue por etiqueta, símbolo y estilo: Agendada (borde discontinuo), Confirmada
  (check), Atendida (atenuada), No asistió (rayado), Cancelada (tachada).
- Las canceladas se consideran eliminadas y se ocultan por defecto. Pueden consultarse
  seleccionando Cancelada en el filtro Estados; no se pueden restaurar ni editar.
- El detalle muestra las acciones autorizadas por el servidor, un resumen del último
  cambio y el historial de estados con fecha, usuario y motivo.
- Cancelar exige motivo y solicitante; Otro exige una nota. Las correcciones entre
  Atendida y No asistió no tienen plazo, pero requieren una explicación.
- Las citas del período visible cuyo horario terminó y siguen pendientes aparecen
  en Citas por cerrar. Resolver cita abre el detalle para registrar el resultado.
- El calendario actualiza los permisos temporales y estados cada minuto.
- Cambiar horario o especialista de una cita confirmada requiere nueva confirmación.

### Componentes compartidos

- Todo envío deja su botón en estado `loading` (bloqueado con indicador) y el handler ignora reenvíos mientras está en curso.
- Los avisos se muestran con `useToast()` (`src/components/feedback/feedbackContext.ts`): abajo al centro, con un solo diseño. Los de éxito se cierran solos a los 4 s; los de advertencia y error, a los 7 s. Todos tienen botón X y se pausan al pasar el mouse encima.
- Las confirmaciones usan `useConfirm()` (nunca `window.confirm`). Si la acción va en `onConfirm`, el modal muestra la carga, no se puede cerrar mientras procesa y, si falla, sigue abierto y aparece un toast de error.
- Los modales heredan del tema el centrado, el borde redondeado, el overlay y el estilo del título. Sus pies usan `ModalActions`: Cancelar a la izquierda y la acción principal al final.

## Registro y acceso de especialistas

- En el inicio de sesion, **Registrar mi clinica** permite crear la cuenta y la
  clinica. **Tambien atendere pacientes como especialista en esta clinica**
  crea el perfil profesional con la misma cuenta y ambos roles, sin repetir
  correo ni contrasena.
- Los administradores de clinica pueden usar **Activar mi perfil de especialista**
  desde Especialistas. La accion reutiliza su cuenta, conserva sus permisos y
  actualiza la sesion. No crea otro perfil si ya existe uno vinculado.
- Al crear un especialista, **Acceso al sistema** ofrece **Sin acceso por ahora**
  o **Invitar a acceder**. No se asignan contrasenas desde el mantenimiento.
- Al editar, los administradores ven el estado y las acciones correspondientes:
  invitar, reenviar/cancelar invitacion, ver cuenta vinculada, revocar o
  restablecer acceso. Las invitaciones vencen a las 48 horas; reenviarlas invalida
  el enlace anterior. Los errores se muestran sin anunciar exito.
- El destinatario acepta desde el enlace del correo: define una contrasena si es
  nuevo o confirma su contrasena actual si ya tiene cuenta. Despues inicia sesion;
  si pertenece a varias clinicas, selecciona a cual ingresar.
- Revocar acceso requiere confirmacion y solo retira el rol de especialista en
  la clinica actual. No desactiva la cuenta, cambia otros roles (incluido
  Administrador de Clinica), altera otras clinicas ni elimina citas o historia.
  El estado profesional y el acceso al sistema son independientes.
- No se incluye vinculacion manual de usuarios. Un perfil existente sin cuenta
  puede invitar a su titular, quien debe aceptar con su propia cuenta.
- Requiere la API con V35 y `APP_FRONTEND_URL` apuntando a este frontend para
  generar los enlaces de invitacion. Se reutiliza el proveedor de correo existente.

## Calendario de citas

- Las citas usan la misma fuente, tamano y peso que los bloques Disponible/Bloqueado.
- Cada cita muestra el rango horario, el paciente y la modalidad: V (virtual) o P (presencial).
- En Especialistas > Editar > Configuracion, selecciona el color de la agenda y pulsa
  **Guardar color de agenda**. Se conserva en la API y se aplica al calendario.
- En Citas, la disponibilidad usa un tono tenue del color de cada especialista,
  con su nombre corto (o nombre completo), horario y estado. Los bloqueos se
  distinguen por el rayado. La leyenda muestra los nombres y colores de las
  especialistas filtradas (todas si no hay filtro).
- Cuando se muestra disponibilidad, los bloques coincidentes se distribuyen en
  paralelo en las vistas de dia/semana, sin mezclar los fondos. Siguen permitiendo
  seleccionar horarios; no abren detalles de citas ni se pueden arrastrar.
- Para editar una cita, abre sus detalles y pulsa **Editar**. Puedes cambiar el
  especialista, horario, modalidad, ubicacion, tarifa, moneda, pago y notas; el
  paciente permanece asociado a la misma cita. Los errores de horario se muestran
  sin cerrar el formulario ni perder los cambios.
- Requiere la API con `PUT /appointments/{id}`, `PATCH /specialists/{id}/agenda-color`
  y las migraciones V33/V34 aplicadas. El calendario sigue sujeto al flag `VITE_FEATURE_SCHEDULING`.

## Sedes

- Solo el Administrador de Clinica (`TENANT_ADMIN`) ve el menu Sedes y puede
  consultar su mantenimiento, registrar, editar y dar de baja sedes de su clinica.
- El listado usa paginas de 10 registros, busqueda por nombre/oficina/direccion,
  filtro de estado y confirmaciones con el mismo estilo visual de Pacientes.
- Los campos obligatorios son nombre representativo, direccion completa y al
  menos una oficina o sala. En el formulario puedes agregar, renombrar y retirar
  salas; sus nombres no pueden estar vacios ni repetirse dentro de la sede.
  La ultima sala no se puede retirar. La seleccion en mapas y la captura de coordenadas quedan
  pendientes; no se requiere clave ni proveedor de mapas.
- La baja es logica (`ACTIVE`/`INACTIVE`): no elimina sedes ni citas existentes.
  Los selectores de citas y disponibilidad usan el catalogo minimo de salas y sedes
  activas, mostrando `sede - sala`. Las citas presenciales envian `locationHallId`
  y su detalle muestra sede y sala. Al editar una cita existente se conserva
  su sala aunque haya sido retirada o su sede dada de baja; no se ofrece para nuevas citas.
- Requiere desplegar API y frontend juntos y aplicar V34: los antiguos `hallName`
  se migran a `location_hall` sin perder las citas ni los horarios existentes.
- Si cambia la direccion, se limpian coordenadas y enlace de mapa anteriores para
  no conservar una geolocalizacion incorrecta.

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

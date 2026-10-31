import {
  IconUserCheck,
  IconUserX,
  IconPlayerPause,
  IconClock,
} from "@tabler/icons-react";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "TENANT_ADMIN", label: "Admin. de clínica" },
  { value: "SPECIALIST", label: "Especialista" },
  { value: "USER", label: "Usuario" },
];

export const ROLE_STYLES: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrador", color: "red" },
  TENANT_ADMIN: { label: "Admin. de clínica", color: "orange" },
  SPECIALIST: { label: "Especialista", color: "teal" },
};

export const PATIENT_STATUS_STYLES: Record<
  string,
  { label: string; color: string }
> = {
  ACTIVE: { label: "Activo", color: "green" },
  WAITING: { label: "En espera", color: "yellow" },
  COMPLETED: { label: "Alta", color: "blue" },
  DROPPED: { label: "Abandono", color: "red" },
  INACTIVE: { label: "En pausa", color: "gray" },
};

export const DOCUMENT_TYPES = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CE", label: "Carné de extranjería" },
  { value: "OTRO", label: "Otro" },
];

export const GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
  { value: "OTRO", label: "Otro" },
];
// Definición de las opciones con sus descripciones
const TRANSITION_RULES: Record<
  string,
  Array<{
    id: string;
    label: string;
    description: string;
    color: string;
    icon: any;
  }>
> = {
  // Si está Activo o En espera, puede pasar a los estados de cierre/pausa
  ACTIVE_OR_WAITING: [
    {
      id: "COMPLETED",
      label: "Alta",
      description: "Se completó su tratamiento exitosamente.",
      color: "blue",
      icon: IconUserCheck,
    },
    {
      id: "DROPPED",
      label: "Abandono",
      description: "No se obtuvo respuesta del paciente.",
      color: "red",
      icon: IconUserX,
    },
    {
      id: "INACTIVE",
      label: "En pausa",
      description:
        "El paciente solicitó darse un tiempo; se le contactará más adelante.",
      color: "gray",
      icon: IconPlayerPause,
    },
  ],
  // Si ya está en pausa, abandonó o tiene alta, solo puede volver a "En espera"
  RESTRICTED: [
    {
      id: "WAITING",
      label: "En espera",
      description: "Regresar al flujo de espera o reanudación de contacto.",
      color: "yellow",
      icon: IconClock,
    },
  ],
};
export { TRANSITION_RULES };

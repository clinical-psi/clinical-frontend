export type ClinicalId = string | number;

export type AnamnesisFields = Partial<Record<AnamnesisFieldKey, string>>;

export const ANAMNESIS_SECTIONS = [
  {
    title: "Fuente de información",
    fields: [
      ["informationSource", "Fuente de información"],
      ["informantRelationship", "Relación del informante con el paciente"],
      ["informationLimitations", "Limitaciones de la información"],
    ],
  },
  {
    title: "Contexto personal y social",
    fields: [
      ["maritalStatus", "Estado civil"],
      ["educationLevel", "Nivel educativo"],
      ["occupation", "Ocupación"],
      ["employmentStatus", "Situación laboral"],
      ["livingArrangement", "Convivencia y condiciones de vida"],
      ["supportNetwork", "Red de apoyo"],
      ["culturalContext", "Contexto cultural relevante"],
    ],
  },
  {
    title: "Motivo de consulta e historia del problema",
    fields: [
      ["chiefComplaint", "Motivo de consulta"],
      ["referralSource", "Origen de la derivación"],
      ["presentingProblemHistory", "Historia y evolución del problema"],
      ["symptomOnsetDescription", "Inicio aproximado de los síntomas"],
      ["precipitatingFactors", "Factores desencadenantes"],
      ["maintainingFactors", "Factores que mantienen el problema"],
      ["functionalImpact", "Impacto en la vida cotidiana"],
      ["previousCopingStrategies", "Estrategias previas y resultados"],
      ["patientExpectations", "Expectativas del paciente"],
    ],
  },
  {
    title: "Antecedentes",
    fields: [
      ["medicalHistory", "Antecedentes médicos"],
      ["mentalHealthHistory", "Antecedentes de salud mental"],
      ["currentMedications", "Medicación actual y fuente de información"],
      ["allergies", "Alergias"],
      ["familyMentalHealthHistory", "Antecedentes familiares de salud mental"],
      ["developmentalHistory", "Desarrollo e infancia"],
      ["familyRelationships", "Relaciones y dinámica familiar"],
      ["educationalWorkHistory", "Trayectoria académica y laboral"],
      ["significantLifeEvents", "Acontecimientos significativos"],
      ["substanceUseHistory", "Antecedentes de consumo de sustancias"],
      ["sleepHabits", "Sueño"],
      ["eatingHabits", "Alimentación"],
    ],
  },
  {
    title: "Síntesis profesional",
    fields: [
      ["clinicalFormulation", "Formulación clínica"],
      ["initialTreatmentPlan", "Plan inicial de tratamiento"],
      ["therapeuticGoals", "Objetivos terapéuticos"],
      ["additionalObservations", "Observaciones adicionales"],
    ],
  },
] as const;

export type AnamnesisFieldKey =
  (typeof ANAMNESIS_SECTIONS)[number]["fields"][number][0];

export type Anamnesis = {
  id: ClinicalId;
  patientId: ClinicalId;
  specialistId: ClinicalId;
  assessmentDate: string;
  status: "DRAFT" | "FINALIZED";
  fields: AnamnesisFields;
  version: number;
  previousRecordId?: ClinicalId | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: ClinicalId;
  updatedByUserId: ClinicalId;
  finalizedAt?: string | null;
  finalizedByUserId?: ClinicalId | null;
};

export type AnamnesisInput = {
  assessmentDate: string;
  fields: AnamnesisFields;
};

export type ClinicalAccess = {
  canRead: boolean;
  canWrite: boolean;
};

export const PROGRESS_FIELDS = [
  ["subjective", "Subjetivo: información referida por el paciente"],
  ["objective", "Objetivo: observaciones de la sesión"],
  ["assessment", "Evaluación y análisis profesional"],
  ["plan", "Plan y acuerdos"],
] as const;

export type ProgressNoteInput = {
  appointmentId: ClinicalId;
  sessionDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  correctsNoteId?: ClinicalId;
};

export type ProgressNote = ProgressNoteInput & {
  id: ClinicalId;
  patientId: ClinicalId;
  specialistId: ClinicalId;
  createdAt: string;
  createdByUserId: ClinicalId;
};

import { get, post, put } from "../data/http/httpClient";
import type {
  Anamnesis,
  AnamnesisInput,
  ClinicalAccess,
  ClinicalId,
  ProgressNote,
  ProgressNoteInput,
} from "../types/clinical-record";

const base = (patientId: ClinicalId) => `/patients/${patientId}`;

export const clinicalRecordService = {
  access: (patientId: ClinicalId) =>
    get<ClinicalAccess>(`${base(patientId)}/clinical-access`),
  anamneses: (patientId: ClinicalId) =>
    get<Anamnesis[]>(`${base(patientId)}/anamneses`),
  create: (patientId: ClinicalId, input: AnamnesisInput) =>
    post<Anamnesis>(`${base(patientId)}/anamneses`, input),
  update: (
    patientId: ClinicalId,
    id: ClinicalId,
    input: AnamnesisInput & { version: number },
  ) => put<Anamnesis>(`${base(patientId)}/anamneses/${id}`, input),
  finalize: (patientId: ClinicalId, id: ClinicalId, version: number) =>
    post<Anamnesis>(`${base(patientId)}/anamneses/${id}/finalize`, { version }),
  amend: (patientId: ClinicalId, id: ClinicalId, version: number) =>
    post<Anamnesis>(`${base(patientId)}/anamneses/${id}/amend`, { version }),
  revisions: (patientId: ClinicalId, id: ClinicalId) =>
    get<Anamnesis[]>(`${base(patientId)}/anamneses/${id}/revisions`),
  progressNotes: (patientId: ClinicalId) =>
    get<ProgressNote[]>(`${base(patientId)}/progress-notes`),
  addProgressNote: (patientId: ClinicalId, input: ProgressNoteInput) =>
    post<ProgressNote>(`${base(patientId)}/progress-notes`, input),
};

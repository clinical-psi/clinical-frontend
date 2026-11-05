/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** "true" habilita Citas y Mi disponibilidad. */
  readonly VITE_FEATURE_SCHEDULING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Feature flags resueltos en build time (Vite). Cambiar una variable en Vercel
 * requiere un nuevo despliegue. Sin variable = deshabilitado.
 */
export const FEATURES = {
  scheduling: import.meta.env.VITE_FEATURE_SCHEDULING === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag) {
  return FEATURES[flag];
}

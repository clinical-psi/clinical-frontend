import { useEffect, useRef } from "react";

/**
 * Un hook similar a useEffect pero que garantiza que el efecto
 * se ejecute una sola vez, incluso en React 18 StrictMode (en desarrollo).
 */
export function useOnceEffect(effect: () => void) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      effect(); // Se ejecuta de forma limpia sin retornar la función
    }
  }, []);
}

import { createContext, useContext, useMemo, type ReactNode } from "react";

export type ToastSeverity = "success" | "error" | "info" | "warning";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Runs while the modal shows a loading state. If it throws, the modal stays open and the error is shown as a toast. */
  onConfirm?: () => Promise<unknown> | unknown;
}

export interface FeedbackContextValue {
  notify: (message: string, severity?: ToastSeverity) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("FeedbackProvider is missing");
  return context;
}

export function useToast() {
  const { notify } = useFeedback();
  return useMemo(
    () => ({
      success: (message: string) => notify(message, "success"),
      error: (message: string) => notify(message, "error"),
      info: (message: string) => notify(message, "info"),
      warning: (message: string) => notify(message, "warning"),
    }),
    [notify],
  );
}

export function useConfirm() {
  return useFeedback().confirm;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Text } from "@mantine/core";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import {
  FeedbackContext,
  errorMessage,
  type ConfirmOptions,
  type ToastSeverity,
} from "./feedbackContext";
import { ModalActions } from "./ModalActions";

// Success toasts are short confirmations; errors stay longer so they can be read. Both can be closed with X and pause on hover.
const TOAST_DURATION: Record<ToastSeverity, number> = {
  success: 4000,
  info: 4000,
  warning: 7000,
  error: 7000,
};

const TOAST_COLOR: Record<ToastSeverity, string> = {
  success: "#45814B",
  info: "#3D5F8F",
  warning: "#A07D32",
  error: "#A24036",
};

interface ToastState {
  id: number;
  message: string;
  severity: ToastSeverity;
}

interface DialogState {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toastId = useRef(0);

  const notify = useCallback((message: string, severity: ToastSeverity = "success") => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, severity });
    setToastOpen(true);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ options, resolve });
        setDialogOpen(true);
      }),
    [],
  );

  const closeDialog = (confirmed: boolean) => {
    dialog?.resolve(confirmed);
    setDialogOpen(false);
  };

  const accept = async () => {
    if (!dialog || busy) return;
    setBusy(true);
    try {
      await dialog.options.onConfirm?.();
      closeDialog(true);
    } catch (error) {
      notify(errorMessage(error, "No se pudo completar la acción."), "error");
    } finally {
      setBusy(false);
    }
  };

  const closeToast = (_event?: unknown, reason?: SnackbarCloseReason) => {
    if (reason !== "clickaway") setToastOpen(false);
  };

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);
  const options = dialog?.options;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Modal
        opened={dialogOpen}
        onClose={() => { if (!busy) closeDialog(false); }}
        title={options?.title}
        size="sm"
        zIndex={400}
        closeOnClickOutside={!busy}
        closeOnEscape={!busy}
        withCloseButton={!busy}
      >
        {typeof options?.message === "string"
          ? <Text size="sm">{options.message}</Text>
          : options?.message}
        <ModalActions
          onCancel={() => closeDialog(false)}
          cancelLabel={options?.cancelLabel ?? "Cancelar"}
          submitLabel={options?.confirmLabel ?? "Confirmar"}
          destructive={options?.destructive}
          loading={busy}
          onSubmit={accept}
        />
      </Modal>

      <Snackbar
        key={toast?.id}
        open={toastOpen}
        autoHideDuration={toast ? TOAST_DURATION[toast.severity] : null}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MUIAlert
          severity={toast?.severity ?? "success"}
          variant="filled"
          onClose={() => setToastOpen(false)}
          role={toast?.severity === "error" ? "alert" : "status"}
          sx={{
            minWidth: 320,
            maxWidth: 560,
            alignItems: "center",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(15, 22, 32, 0.18)",
            backgroundColor: toast ? TOAST_COLOR[toast.severity] : undefined,
          }}
        >
          {toast?.message}
        </MUIAlert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

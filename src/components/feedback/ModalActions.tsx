import { Button, Group } from "@mantine/core";
import type { ReactNode } from "react";

interface ModalActionsProps {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** Without onSubmit the primary button submits the enclosing form. */
  onSubmit?: () => void;
  children?: ReactNode;
}

/** Shared footer for modals: secondary actions on the left of Cancel, primary action always last. */
export function ModalActions({
  onCancel,
  cancelLabel = "Cancelar",
  submitLabel,
  loading = false,
  disabled = false,
  destructive = false,
  onSubmit,
  children,
}: ModalActionsProps) {
  return (
    <Group justify="flex-end" gap="sm" mt="md">
      {children}
      <Button variant="default" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? "button" : "submit"}
        color={destructive ? "red" : undefined}
        loading={loading}
        disabled={disabled}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </Group>
  );
}

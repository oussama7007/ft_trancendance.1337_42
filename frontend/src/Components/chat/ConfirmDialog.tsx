import { useEffect, useRef } from "react";

export interface ConfirmAction {
  label: string;
  onSelect: () => void;
  tone?: "danger" | "primary" | "neutral";
}

interface ConfirmDialogProps {
  title: string;
  description?: string;
  actions: ConfirmAction[];
  cancelLabel: string;
  onCancel: () => void;
}

const TONES: Record<NonNullable<ConfirmAction["tone"]>, string> = {
  danger: "bg-red-600 text-white hover:bg-red-700",
  primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)]",
  neutral: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-background)]",
};

export default function ConfirmDialog({ title, description, actions, cancelLabel, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-5 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-start text-lg font-bold text-[var(--color-text)]">{title}</h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-start text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onSelect}
              className={`h-11 w-full rounded-xl px-4 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 focus-visible:ring-offset-2 ${TONES[action.tone ?? "neutral"]}`}
            >
              {action.label}
            </button>
          ))}
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-11 w-full rounded-xl px-4 text-sm font-bold text-[var(--color-muted)] outline-none transition hover:bg-[var(--color-background)] hover:text-[var(--color-text)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

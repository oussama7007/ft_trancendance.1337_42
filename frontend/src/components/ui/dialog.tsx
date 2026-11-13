
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
    open: boolean;
    title: string;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
}

function Dialog({
    open,
    title,
    closeLabel,
    onClose,
    children,
}: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
        }

        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
            className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg border-0 bg-transparent p-0 backdrop:bg-black/40"
        >
            <div className="overflow-y-auto rounded-2xl border border-irent-border bg-irent-surface p-5 text-irent-text shadow-xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h2
                        id={titleId}
                        className="font-heading text-lg font-bold text-irent-primary"
                    >
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={closeLabel}
                        className="rounded-lg p-2 text-irent-muted hover:bg-irent-background"
                    >
                        <X size={20} />
                    </button>
                </div>

                {children}
            </div>
        </dialog>
    );
}

export { Dialog };

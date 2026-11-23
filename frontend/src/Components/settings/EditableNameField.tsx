import { useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditableNameFieldProps {
    id: string;
    label: string;
    value: string;
    editLabel: string;
    saveLabel: string;
    cancelLabel: string;
    savingLabel: string;
    errorLabel: string;
    onSave: (value: string) => Promise<void>;
}

export function EditableNameField({
    id,
    label,
    value,
    editLabel,
    saveLabel,
    cancelLabel,
    savingLabel,
    errorLabel,
    onSave,
}: EditableNameFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isEditing) {
            setDraft(value);
        }
    }, [isEditing, value]);

    function startEditing() {
        setDraft(value);
        setError('');
        setIsEditing(true);
    }

    function cancelEditing() {
        setDraft(value);
        setError('');
        setIsEditing(false);
    }

    async function saveName() {
        const cleanValue = draft.trim();

        if (!cleanValue) {
            setError(errorLabel);
            return;
        }

        try {
            setError('');
            setIsSaving(true);
            await onSave(cleanValue);
            setIsEditing(false);
        } catch {
            setError(errorLabel);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-w-0">
            <p className="text-xs font-medium text-irent-muted">
                {label}
            </p>

            {isEditing ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Input
                        id={id}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={50}
                        autoFocus
                        disabled={isSaving}
                        className="min-w-0 flex-1"
                    />

                    <Button
                        type="button"
                        size="icon"
                        onClick={() => void saveName()}
                        disabled={isSaving}
                        aria-label={isSaving ? savingLabel : saveLabel}
                        title={isSaving ? savingLabel : saveLabel}
                    >
                        <Check size={16} />
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={cancelEditing}
                        disabled={isSaving}
                        aria-label={cancelLabel}
                        title={cancelLabel}
                    >
                        <X size={16} />
                    </Button>
                </div>
            ) : (
                <div className="mt-1 flex items-center gap-2">
                    <p className="min-w-0 break-words text-sm font-semibold text-irent-text">
                        {value || '—'}
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-irent-accent"
                        onClick={startEditing}
                        aria-label={`${editLabel}: ${label}`}
                        title={`${editLabel}: ${label}`}
                    >
                        <Pencil size={16} />
                    </Button>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

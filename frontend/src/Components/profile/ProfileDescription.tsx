import { useEffect, useState } from 'react';
import { FileText, Pencil, Save, X } from 'lucide-react';
import type { ProfileTranslations } from '../../translations';



import { AccountSection } from '../shared/AccountSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ProfileDescriptionProps {
    description?: string;
    onSave: (newDescription: string) => Promise<void>;
    t: ProfileTranslations['description'];
}

export function ProfileDescription({ description, onSave, t }: ProfileDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(description ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');


    useEffect(() => {
        setDraft(description ?? '');
    }, [description]);

    async function handleSave() {
        try {
            setError('');
            setSaving(true);
            await onSave(draft.trim());
            setIsEditing(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not save description',
            );
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setDraft(description ?? '');
        setError('');
        setIsEditing(false);
    }

        return (
        <AccountSection
            title={t.title}
            icon={FileText}
            action={
                !isEditing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-irent-accent"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil size={16} />
                        {t.edit}
                    </Button>
                )
            }
        >
            {isEditing ? (
                <div>
                    <Textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={500}
                        rows={5}
                        placeholder={t.placeholder}
                        className="resize-y leading-6"
                        disabled={saving}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-irent-muted">
                            {draft.length}/500 {t.characters}
                        </span>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <X size={15} />
                                {t.cancel}
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <Save size={15} />
                                {t.save}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-2 text-xs text-red-600">
                            {error}
                        </p>
                    )}

                    <p className="mt-3 text-xs leading-5 text-irent-muted">
                        {t.previewOnly}
                    </p>
                </div>
            ) : description?.trim() ? (
                <p className="whitespace-pre-line [overflow-wrap:break-word] [word-break:break-all] text-sm leading-7 text-irent-muted">
                    {description}
                </p>
            ) : (
                <div className="rounded-xl bg-irent-background px-4 py-5">
                    <p className="text-sm leading-6 text-irent-muted">
                        {t.empty}
                    </p>
                </div>
            )}
        </AccountSection>
    );
}

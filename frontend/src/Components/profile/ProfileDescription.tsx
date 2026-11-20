import { useEffect, useState } from 'react';
import { FileText, Pencil, Save, X } from 'lucide-react';
import type { ProfileTranslations } from '../../translations';



import { AccountSection } from '../shared/AccountSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ProfileDescriptionProps {
    description?: string;
    onSave: (newDescription: string) => void;
    t: ProfileTranslations['description'];
}

export function ProfileDescription({ description, onSave, t }: ProfileDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(description ?? '');

   
    useEffect(() => {
        setDraft(description ?? '');
    }, [description]);

    function handleSave() {
        onSave(draft.trim());
        setIsEditing(false);
    }

    function handleCancel() {
        setDraft(description ?? '');
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
                            >
                                <X size={15} />
                                {t.cancel}
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                            >
                                <Save size={15} />
                                {t.save}
                            </Button>
                        </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-irent-muted">
                        {t.previewOnly}
                    </p>
                </div>
            ) : description?.trim() ? (
                <p className="whitespace-pre-line text-sm leading-7 text-irent-muted">
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

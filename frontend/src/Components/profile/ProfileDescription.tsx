import { useEffect, useState } from 'react';
import { FileText, Pencil, Save, X } from 'lucide-react';
import type { ProfileTranslations } from '../../translations';


interface ProfileDescriptionProps {
    description?: string;
    onSave: (newDescription: string) => void;
    t: ProfileTranslations['description'];
}

export function ProfileDescription({ description, onSave, t }: ProfileDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(description ?? '');

    // Keep the text in sync if the parent receives updated profile data.
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
        <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
                        <FileText size={19} />
                    </div>
                    <h2 className="text-lg font-bold text-(--color-primary)">{t.title}</h2>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-(--color-accent) transition hover:bg-(--color-accent-soft)"
                    >
                        <Pencil size={16} />
                        {t.edit}
                    </button>
                )}
            </div>

            {isEditing ? (
                <div>
                    <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={500}
                        rows={5}
                        placeholder="Tell owners a little about yourself..."
                        className="w-full resize-y rounded-xl border border-(--color-border) bg-white p-3 text-sm leading-6 text-(--color-text) outline-none transition focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-(--color-muted)">{draft.length}/500 {t.characters}</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-2 text-sm font-semibold text-(--color-muted) hover:bg-(--color-background)"
                            >
                                <X size={15} /> {t.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-semibold text-white transition hover:bg-(--color-accent-dark)"
                            >
                                <Save size={15} /> {t.save}
                            </button>
                        </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-(--color-muted)">
                        {t.previewOnly}
                    </p>
                </div>
            ) : description?.trim() ? (
                <p className="whitespace-pre-line text-sm leading-7 text-(--color-muted)">
                    {description}
                </p>
            ) : (
                <div className="rounded-xl bg-(--color-background) px-4 py-5">
                    <p className="text-sm leading-6 text-(--color-muted)">
                        {t.empty}
                    </p>
                </div>
            )}
        </section>
    );
}

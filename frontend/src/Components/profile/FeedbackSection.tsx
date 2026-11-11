import type { ProfileTranslations } from '../../translations';

interface FeedbackSectionProps {
    t: ProfileTranslations['feedback'];
}



export function FeedbackSection({t}: FeedbackSectionProps) {
    return (
        <section
            aria-label="Feedback"
            data-feedback-slot="true"
            className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:p-6"
        >
            <h2 className="text-lg font-bold text-(--color-primary)">{t.title}</h2>
            <div className="mt-4 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-(--color-border) bg-(--color-background) p-6 text-center">
                <p className="max-w-xs text-sm leading-6 text-(--color-muted)">
                    {t.placeholder}
                </p>
            </div>

            {/* TODO: Teammate: replace this placeholder with the Feedback component. */}
        </section>
    );
}

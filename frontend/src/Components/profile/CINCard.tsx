import { useState } from 'react';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import type { ProfileTranslations } from '../../translations';



interface CINCardProps {
    cin?: string;
    t: ProfileTranslations['cin'];
}

export function CINCard({ cin, t }: CINCardProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Keep the CIN hidden by default because it is personal information.
    const displayedCIN = cin
        ? isVisible
            ? cin
            : `${'*'.repeat(Math.max(cin.length - 3, 0))}${cin.slice(-3)}`
        : t.notProvided;

    return (
        <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
                    <CreditCard size={19} />
                </div>
                <h2 className="text-lg font-bold text-(--color-primary)">{t.title}</h2>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-(--color-background) p-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                        {t.show}
                    </p>
                    <p className="mt-1 break-all font-semibold tracking-wider text-(--color-primary)">
                        {displayedCIN}
                    </p>
                </div>

                {cin && (
                    <button
                        type="button"
                        onClick={() => setIsVisible((visible) => !visible)}
                        aria-label={isVisible ? 'Hide CIN number' : 'Show CIN number'}
                        className="shrink-0 rounded-lg p-2 text-(--color-muted) transition hover:bg-white hover:text-(--color-accent)"
                    >
                        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            <p className="mt-3 text-xs leading-5 text-(--color-muted)">
                {t.privacy}
            </p>
        </section>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../translations';
import { legalContent, type LegalKind } from '../data/legalContent';

interface LegalPageProps {
    lang: Language;
    kind: LegalKind;
}

export const LegalPage: React.FC<LegalPageProps> = ({ lang, kind }) => {
    const doc = legalContent[lang][kind];
    const isRTL = lang === 'ar';

    return (
        <main
            dir={isRTL ? 'rtl' : 'ltr'}
            className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 md:px-8"
        >
            <Link
                to="/"
                className="mb-6 inline-flex items-center gap-2 text-xs font-black text-(--color-accent) hover:underline"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {translations[lang].navbar.home}
            </Link>

            <article className="rounded-2xl border border-gray-200/65 bg-white p-6 shadow-xl md:p-8">
                <h1 className="text-xl font-black text-gray-900 md:text-2xl">{doc.title}</h1>
                <p className="mt-1 text-xs font-bold text-gray-400">{doc.updated}</p>
                <p className="mt-5 text-sm font-medium leading-relaxed text-gray-600">{doc.intro}</p>

                {doc.sections.map((section) => (
                    <section key={section.heading} className="mt-7">
                        <h2 className="mb-2 text-base font-black text-gray-900">{section.heading}</h2>
                        <div className="grid gap-2">
                            {section.paragraphs.map((paragraph) => (
                                <p
                                    key={paragraph}
                                    className="text-sm font-medium leading-relaxed text-gray-600"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </section>
                ))}
            </article>
        </main>
    );
};

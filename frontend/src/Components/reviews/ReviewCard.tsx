import StarRating from './StarRating';
import { translations } from '../../translations';
import type { Language } from '../../types';
import type { Review } from '../../services/reviewService';

const locales = { ar: 'ar-MA', fr: 'fr-FR', en: 'en-US' };

// "2026-07-02T10:00:00Z" -> "Jul 2, 2026"
function formatDate(date: string, lang: Language): string
{
  return new Date(date).toLocaleDateString(locales[lang], { month: 'short', day: 'numeric', year: 'numeric' });
}

// One review: who wrote it, the stars and what they said
export default function ReviewCard({ review, lang }: { review: Review; lang: Language })
{
  const t = translations[lang].reviews;

  return (
    <article className="flex gap-3 rounded-[24px] border border-[#EEF0F3] bg-white p-4 shadow-[0_2px_10px_rgba(23,49,92,0.04)] sm:gap-5 sm:p-7">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-lg font-bold text-[#1F2328] sm:h-15 sm:w-15 sm:text-xl">
        {review.reviewer.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span dir="auto" className="text-lg font-bold text-[#1F2328] sm:text-xl">{review.reviewer.name}</span>
            <span className="rounded-full bg-[#FDEDE5] px-3 py-0.5 text-[13px] font-bold text-[#C2562A]">
              {review.role === 'owner' ? t.owner : t.roommate}
            </span>
          </div>
          <span className="shrink-0 text-sm text-[#6B7280] sm:text-[16px]">{formatDate(review.createdAt, lang)}</span>
        </div>

        <p className="mt-1 text-[15px] text-[#178A4C] sm:text-[16px]">{review.listingTitle[lang]}</p>

        <div className="mt-3 flex items-center gap-3">
          <StarRating value={review.rating} />
          <span className="text-[15px] font-bold text-[#1F2328]">{review.rating.toFixed(1)}</span>
        </div>

        <p dir="auto" className="mt-4 break-words text-[15px] leading-relaxed text-[#2D3138] sm:text-[17px]">{review.comment}</p>
      </div>
    </article>
  );
}

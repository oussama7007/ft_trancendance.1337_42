import StarRating from './StarRating';
import { translations } from '../../translations';
import type { Language } from '../../types';

interface RatingSummaryProps
{
  average: number;
  count: number;
  lang: Language;
}

// The "Overall rating" card: the big number, the stars and how many reviews
export default function RatingSummary({ average, count, lang }: RatingSummaryProps)
{
  const t = translations[lang].reviews;

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(23,49,92,0.06)] sm:p-9">
      <h3 className="text-lg font-bold text-[#1F2328] sm:text-xl">{t.overallRating}</h3>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-5xl font-extrabold tracking-tight text-[#1F2328] sm:text-6xl">{average.toFixed(1)}</span>
        <div>
          <StarRating value={average} size={20} />
          <p className="mt-1 text-[15px] text-[#6B7280]">
            {count === 1 ? t.basedOnOne : t.basedOn.replace('{count}', String(count))}
          </p>
        </div>
      </div>
    </div>
  );
}

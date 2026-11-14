import { useReviews } from '../../hooks/useReviews';
import { translations } from '../../translations';
import type { Language } from '../../types';
import RatingSummary from './RatingSummary';
import ReviewTabs from './ReviewTabs';
import ReviewCard from './ReviewCard';
import LeaveReviewButton from './LeaveReviewButton';

interface ReviewsSectionProps
{
  profileUserId: number;
  profileName: string;
  lang: Language;
  // TODO(auth): temporary, the logged-in user until real login exists
  currentUserId?: number;
}

// Everything about reviews on a profile page, in one piece
export default function ReviewsSection({ profileUserId, profileName, lang, currentUserId }: ReviewsSectionProps)
{
  const { tab, setTab, result, error, reviewRole, submit } = useReviews(profileUserId, currentUserId);
  const t = translations[lang].reviews;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {result && <RatingSummary average={result.summary.average} count={result.summary.count} lang={lang} />}

      <section className="min-w-0 rounded-[28px] bg-white shadow-[0_2px_12px_rgba(23,49,92,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF0F3] px-5 py-6 sm:px-10 sm:py-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[28px] font-extrabold text-[#1F2328] sm:text-[34px]">{t.title}</h2>
            {result && (
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#F3F4F6] px-2 text-sm font-bold text-[#1F2328]">
                {result.counts.all}
              </span>
            )}
          </div>
          {reviewRole && <LeaveReviewButton profileName={profileName} role={reviewRole} lang={lang} onSubmit={submit} />}
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 sm:gap-6 sm:px-10 sm:py-7">
          {result && <ReviewTabs tab={tab} counts={result.counts} lang={lang} onChange={setTab} />}

          {error && <p role="alert" className="text-red-600">{t.loadError}</p>}
          {!result && !error && <p className="text-[#6B7280]">{t.loading}</p>}
          {result && result.reviews.length === 0 && <p className="py-6 text-center text-[#6B7280]">{t.empty}</p>}

          {result?.reviews.map((review) => <ReviewCard key={review.id} review={review} lang={lang} />)}
        </div>
      </section>
    </div>
  );
}

import type { ReactNode } from 'react';
import { useReviews } from '../../hooks/useReviews';
import RatingSummary from './RatingSummary';
import ReviewTabs from './ReviewTabs';
import ReviewCard from './ReviewCard';
import LeaveReviewButton from './LeaveReviewButton';

interface ReviewsSectionProps
{
  profileUserId: number;
  profileName: string;
  // TODO(auth): temporary, the logged-in user until real login exists.
  currentUserId?: number;
  children?: ReactNode;
}

// Everything about reviews on a profile page, in one piece.
export default function ReviewsSection({ profileUserId, profileName, currentUserId, children }: ReviewsSectionProps)
{
  const { tab, setTab, result, error, reviewRole, submit } = useReviews(profileUserId, currentUserId);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[445px_1fr]">
      <aside className="flex flex-col gap-8">
        {children}
        {result && <RatingSummary average={result.summary.average} count={result.summary.count} />}
      </aside>

      <section className="rounded-[28px] bg-white shadow-[0_2px_12px_rgba(23,49,92,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF0F3] px-10 py-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[34px] font-extrabold text-[#1F2328]">Reviews</h2>
            {result && (
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#F3F4F6] px-2 text-sm font-bold text-[#1F2328]">
                {result.counts.all}
              </span>
            )}
          </div>
          {reviewRole && <LeaveReviewButton profileName={profileName} role={reviewRole} onSubmit={submit} />}
        </div>

        <div className="flex flex-col gap-6 px-10 py-7">
          {result && <ReviewTabs tab={tab} counts={result.counts} onChange={setTab} />}

          {error && <p role="alert" className="text-red-600">Could not load the reviews. Please try again.</p>}
          {!result && !error && <p className="text-[#6B7280]">Loading reviews...</p>}
          {result && result.reviews.length === 0 && <p className="py-6 text-center text-[#6B7280]">No reviews here yet.</p>}

          {result?.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      </section>
    </div>
  );
}

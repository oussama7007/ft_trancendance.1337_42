import StarRating from './StarRating';
import type { Review } from '../../services/reviewService';

// "2026-07-02T10:00:00Z" -> "Jul 2, 2026"
function formatDate(date: string): string
{
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// One review: who wrote it, the stars and what they said.
export default function ReviewCard({ review }: { review: Review })
{
  return (
    <article className="flex gap-5 rounded-[24px] border border-[#EEF0F3] bg-white p-7 shadow-[0_2px_10px_rgba(23,49,92,0.04)]">
      <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-xl font-bold text-[#1F2328]">
        {review.reviewer.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#1F2328]">{review.reviewer.name}</span>
            <span className="rounded-full bg-[#FDEDE5] px-3 py-0.5 text-[13px] font-bold text-[#C2562A]">
              {review.role === 'owner' ? 'Owner' : 'Roommate'}
            </span>
          </div>
          <span className="shrink-0 text-[16px] text-[#6B7280]">{formatDate(review.createdAt)}</span>
        </div>

        <p className="mt-1 text-[16px] text-[#178A4C]">{review.listingTitle}</p>

        <div className="mt-3 flex items-center gap-3">
          <StarRating value={review.rating} />
          <span className="text-[15px] font-bold text-[#1F2328]">{review.rating.toFixed(1)}</span>
        </div>

        <p className="mt-4 break-words text-[17px] leading-relaxed text-[#2D3138]">{review.comment}</p>
      </div>
    </article>
  );
}

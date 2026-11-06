import StarRating from './StarRating';

interface RatingSummaryProps
{
  average: number;
  count: number;
}

// The "Overall rating" card: the big number, the stars and how many reviews.
export default function RatingSummary({ average, count }: RatingSummaryProps)
{
  return (
    <div className="rounded-[28px] bg-white p-9 shadow-[0_2px_12px_rgba(23,49,92,0.06)]">
      <h3 className="text-xl font-bold text-[#1F2328]">Overall rating</h3>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-6xl font-extrabold tracking-tight text-[#1F2328]">{average.toFixed(1)}</span>
        <div>
          <StarRating value={average} size={20} />
          <p className="mt-1 text-[15px] text-[#6B7280]">
            Based on {count} {count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>
    </div>
  );
}

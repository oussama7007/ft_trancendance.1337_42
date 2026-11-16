import { Star } from 'lucide-react';

interface StarRatingProps
{
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}

// Five stars. Pass onChange to make them clickable.
export default function StarRating({ value, size = 18, onChange }: StarRatingProps)
{
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) =>
      {
        const fill = Math.min(Math.max(value - star + 1, 0), 1) * 100;

        const icon = (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute left-0 top-0 text-[#D9DCE1]" fill="currentColor" strokeWidth={0} />
            <span className="absolute left-0 top-0 overflow-hidden" style={{ width: `${fill}%`, height: size }}>
              <Star size={size} className="text-[#EE7F4D]" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );

        if (!onChange)
          return <span key={star}>{icon}</span>;

        return (
          <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} stars`} className="transition hover:scale-110">
            {icon}
          </button>
        );
      })}
    </div>
  );
}

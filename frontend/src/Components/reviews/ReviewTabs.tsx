import type { ReviewTab, ReviewsResult } from '../../services/reviewService';

interface ReviewTabsProps
{
  tab: ReviewTab;
  counts: ReviewsResult['counts'];
  onChange: (tab: ReviewTab) => void;
}

const tabs: { id: ReviewTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owner', label: 'Owner reviews' },
  { id: 'roommate', label: 'Roommate reviews' },
];

// The three tabs with their numbers. The open one is orange.
export default function ReviewTabs({ tab, counts, onChange }: ReviewTabsProps)
{
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((t) =>
      {
        const active = t.id === tab;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-3 rounded-full px-6 py-3 text-[17px] font-bold transition ${active ? 'bg-[#EE7F4D] text-white' : 'bg-[#F3F4F6] text-[#1F2328] hover:bg-[#E9EBEE]'}`}
          >
            {t.label}
            <span className={`rounded-full px-2 text-xs font-bold leading-5 ${active ? 'bg-white/25' : 'bg-[#E3E5E8]'}`}>
              {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

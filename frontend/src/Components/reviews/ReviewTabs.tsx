import { translations } from '../../translations';
import type { Language } from '../../types';
import type { ReviewTab, ReviewsResult } from '../../services/reviewService';

interface ReviewTabsProps
{
  tab: ReviewTab;
  counts: ReviewsResult['counts'];
  lang: Language;
  onChange: (tab: ReviewTab) => void;
}

const tabs: ReviewTab[] = ['all', 'owner', 'roommate'];

// The three tabs with their numbers. The open one is orange
export default function ReviewTabs({ tab, counts, lang, onChange }: ReviewTabsProps)
{
  const t = translations[lang].reviews;
  const labels = { all: t.tabAll, owner: t.tabOwner, roommate: t.tabRoommate };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {tabs.map((id) =>
      {
        const active = id === tab;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-bold transition sm:gap-3 sm:px-6 sm:py-3 sm:text-[17px] ${active ? 'bg-[#EE7F4D] text-white' : 'bg-[#F3F4F6] text-[#1F2328] hover:bg-[#E9EBEE]'}`}
          >
            {labels[id]}
            <span className={`rounded-full px-2 text-xs font-bold leading-5 ${active ? 'bg-white/25' : 'bg-[#E3E5E8]'}`}>
              {counts[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

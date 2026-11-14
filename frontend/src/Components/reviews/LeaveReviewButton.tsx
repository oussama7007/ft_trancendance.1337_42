import { useState } from 'react';
import ReviewModal from './ReviewModal';
import { translations } from '../../translations';
import type { Language } from '../../types';
import type { ReviewRole } from '../../services/reviewService';

interface LeaveReviewButtonProps
{
  profileName: string;
  role: ReviewRole;
  lang: Language;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

// The orange button. Clicking it opens the review popup.
export default function LeaveReviewButton({ profileName, role, lang, onSubmit }: LeaveReviewButtonProps)
{
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-[18px] bg-[#EE7F4D] px-7 py-4 text-[17px] font-bold text-white shadow-[0_8px_18px_rgba(238,127,77,0.35)] transition hover:brightness-95 sm:w-auto"
      >
        {translations[lang].reviews.leaveReview}
      </button>
      {open && (<ReviewModal profileName={profileName} role={role} lang={lang} onSubmit={onSubmit} onClose={() => setOpen(false)} />)}
    </>
  );
}

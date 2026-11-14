import { useState } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import { translations } from '../../translations';
import type { Language } from '../../types';
import type { ReviewRole } from '../../services/reviewService';

interface ReviewModalProps
{
  profileName: string;
  role: ReviewRole;
  lang: Language;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onClose: () => void;
}

// The "Leave a review" popup: pick the stars, write something, send it
export default function ReviewModal({ profileName, role, lang, onSubmit, onClose }: ReviewModalProps)
{
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const t = translations[lang].reviews;
  const canSend = rating > 0 && comment.trim() !== '' && !sending;
  const isOwner = role === 'owner';
  const placeholder = (isOwner ? t.placeholderOwner : t.placeholderRoommate).replace('{name}', profileName);
  const willAppear = t.willAppear
    .replace('{name}', profileName)
    .replace('{tab}', isOwner ? t.tabOwner : t.tabRoommate);

  // Sends the review and closes the popup if it worked
  async function handleSubmit()
  {
    setSending(true);
    setError(false);
    try
    {
      await onSubmit(rating, comment.trim());
      onClose();
    }
    catch
    {
      setError(true);
      setSending(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-[#17315C]/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-140 overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(23,49,92,0.25)] sm:rounded-4xl sm:p-9"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="review-modal-title" className="text-2xl font-extrabold text-[#1F2328] sm:text-[28px]">{t.leaveReview}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1F2328] hover:bg-[#E9EBEE]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[20px] bg-[#F6F7F9] p-4 sm:mt-7 sm:p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-xl font-bold text-[#1F2328] sm:h-14 sm:w-14">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-bold text-[#1F2328] sm:text-xl">{t.rateName.replace('{name}', profileName)}</span>
            <span className="rounded-full bg-[#FDEDE5] px-3 py-1 text-[13px] font-bold text-[#C2562A]">
              {isOwner ? t.asOwner : t.asRoommate}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-9">
          <StarRating value={rating} size={40} lang={lang} onChange={setRating} />
          <p className="text-[15px] text-[#4B5563]">{t.tapToRate}</p>
        </div>

        <label htmlFor="review-comment" className="mt-7 block text-[17px] font-bold text-[#1F2328] sm:mt-8">{t.yourFeedback}</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={placeholder}
          className="mt-3 w-full resize-none rounded-[18px] border border-[#E5E7EB] bg-[#F6F7F9] p-4 text-[16px] text-[#1F2328] outline-none placeholder:text-[#9CA3AF] focus:border-[#EE7F4D]"
        />
        <p className="mt-2 text-end text-[13px] text-[#6B7280]"><span dir="ltr">{comment.length} / 500</span></p>

        <p className="mt-5 text-[13px] text-[#4B5563] sm:mt-6">{willAppear}</p>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{t.submitError}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[18px] border border-[#EEF0F3] px-7 py-4 text-[17px] font-bold text-[#1F2328] hover:bg-[#F6F7F9] sm:flex-none"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex-1 rounded-[18px] bg-[#EE7F4D] px-7 py-4 text-[17px] font-bold text-white shadow-[0_8px_18px_rgba(238,127,77,0.35)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {sending ? t.sending : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

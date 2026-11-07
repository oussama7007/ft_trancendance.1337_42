import { useState } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import type { ReviewRole } from '../../services/reviewService';

interface ReviewModalProps
{
  profileName: string;
  role: ReviewRole;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onClose: () => void;
}

// The "Leave a review" popup: pick the stars, write something, send it.
export default function ReviewModal({ profileName, role, onSubmit, onClose }: ReviewModalProps)
{
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const canSend = rating > 0 && comment.trim() !== '' && !sending;
  const tabName = role === 'owner' ? 'Owner reviews' : 'Roommate reviews';
  const placeholder = role === 'owner'
    ? `Share what it was like to rent to ${profileName}...`
    : `Share what it was like to live with ${profileName}...`;

  // Sends the review and closes the popup if it worked.
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
        className="w-full max-w-[560px] rounded-[32px] bg-white p-9 shadow-[0_24px_60px_rgba(23,49,92,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="review-modal-title" className="text-[28px] font-extrabold text-[#1F2328]">Leave a review</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1F2328] hover:bg-[#E9EBEE]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-7 flex items-center gap-4 rounded-[20px] bg-[#F6F7F9] p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-xl font-bold text-[#1F2328]">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xl font-bold text-[#1F2328]">Rate {profileName}</span>
          <span className="rounded-full bg-[#FDEDE5] px-3 py-1 text-[13px] font-bold text-[#C2562A]">As their {role}</span>
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <StarRating value={rating} size={42} onChange={setRating} />
          <p className="text-[15px] text-[#4B5563]">Tap a star to rate</p>
        </div>

        <label htmlFor="review-comment" className="mt-8 block text-[17px] font-bold text-[#1F2328]">Your feedback</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={placeholder}
          className="mt-3 w-full resize-none rounded-[18px] border border-[#E5E7EB] bg-[#F6F7F9] p-4 text-[16px] text-[#1F2328] outline-none placeholder:text-[#9CA3AF] focus:border-[#EE7F4D]"
        />
        <p className="mt-2 text-right text-[13px] text-[#6B7280]">{comment.length} / 500</p>

        <p className="mt-6 text-[13px] text-[#4B5563]">
          Your review will appear on {profileName}'s profile under {tabName}.
        </p>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">Something went wrong. Please try again.</p>}

        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="rounded-[18px] border border-[#EEF0F3] px-7 py-4 text-[17px] font-bold text-[#1F2328] hover:bg-[#F6F7F9]">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="rounded-[18px] bg-[#EE7F4D] px-7 py-4 text-[17px] font-bold text-white shadow-[0_8px_18px_rgba(238,127,77,0.35)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}

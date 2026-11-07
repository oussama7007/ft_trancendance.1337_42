import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, CalendarDays, MapPin, MessageCircle } from 'lucide-react';
import ReviewsSection from '../Components/reviews/ReviewsSection';

// Temporary page to try the reviews, until the real profile page is merged.
// Open /profile?viewer=6 to look at it as someone else (user 6 can leave a review).
export function ProfilePage()
{
  const [searchParams] = useSearchParams();
  const viewer = Number(searchParams.get('viewer') ?? 6);

  return (
    <div className="min-h-screen bg-[#F4F5F7] px-4 py-9 lg:px-9">
      <div className="mx-auto max-w-[1360px]">
        <ReviewsSection profileUserId={1} profileName="KhayBrother" currentUserId={viewer}>
          <div className="flex flex-col items-center rounded-[28px] bg-white p-9 shadow-[0_2px_12px_rgba(23,49,92,0.06)]">
            <div className="relative flex h-25 w-25 items-center justify-center rounded-full bg-[#E5E7EB] text-4xl font-bold text-[#1F2328]">
              K
              <span className="absolute right-1 bottom-1 h-5 w-5 rounded-full border-4 border-white bg-[#22A559]" />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <h1 className="text-[32px] font-extrabold text-[#1F2328]">KhayBrother</h1>
              <BadgeCheck size={26} className="text-[#EE7F4D]" />
            </div>
            <p className="text-[18px] text-[#178A4C]">Student · Mohammed V University</p>

            <div className="mt-7 flex w-full flex-col gap-4 rounded-[20px] bg-[#F6F7F9] p-6 text-[17px] text-[#1F2328]">
              <span className="flex items-center gap-3"><MapPin size={18} className="text-[#6B7280]" /> Rabat, Morocco</span>
              <span className="flex items-center gap-3"><CalendarDays size={18} className="text-[#6B7280]" /> On iRent since 2024</span>
            </div>

            <button type="button" className="mt-7 flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#EEF0F3] py-4 text-[17px] font-bold text-[#1F2328] shadow-[0_2px_8px_rgba(23,49,92,0.06)] hover:bg-[#F6F7F9]">
              <MessageCircle size={20} /> Message
            </button>
          </div>
        </ReviewsSection>
      </div>
    </div>
  );
}

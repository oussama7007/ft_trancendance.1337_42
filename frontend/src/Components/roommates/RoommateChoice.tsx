import type React from 'react';
import { House, Search } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../translations';

interface RoommateChoiceProps {
  lang: Language;
  isJoining: boolean;
  onJoin: () => void;
  onPost: () => void;
}

const BUTTON_STYLE =
  'flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-black transition cursor-pointer border';

export const RoommateChoice: React.FC<RoommateChoiceProps> = ({ lang, isJoining, onJoin, onPost }) => {
  const t = translations[lang].roommates;
  const joinColors = isJoining
    ? 'bg-(--color-accent) text-white border-transparent'
    : 'bg-white text-gray-800 border-gray-200 hover:border-(--color-accent)';

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 mb-3">
      <button type="button" onClick={onJoin} className={`${BUTTON_STYLE} ${joinColors}`}>
        <Search className="w-4 h-4" />
        {t.joinRoom}
      </button>
      <button
        type="button"
        onClick={onPost}
        className={`${BUTTON_STYLE} bg-white text-gray-800 border-gray-200 hover:border-(--color-accent)`}
      >
        <House className="w-4 h-4" />
        {t.postRoom}
      </button>
    </div>
  );
};

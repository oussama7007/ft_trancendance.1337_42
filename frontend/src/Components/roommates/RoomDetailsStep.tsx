import type React from 'react';
import type { Language } from '../../types';
import type { GenderChoice } from '../../types/roommate';
import { translations } from '../../translations';

export interface RoomDetails {
  monthlyShare: string;
  peopleWanted: string;
  genderPreference: GenderChoice;
}

interface RoomDetailsStepProps {
  lang: Language;
  details: RoomDetails;
  onChange: (details: RoomDetails) => void;
  onBack: () => void;
  onNext: () => void;
}

const INPUT_STYLE = 'w-full bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none';
const LABEL_STYLE = 'block text-sm font-bold text-gray-700 mb-1';

export const RoomDetailsStep: React.FC<RoomDetailsStepProps> = ({ lang, details, onChange, onBack, onNext }) => {
  const t = translations[lang].roommates;
  const isComplete = Number(details.monthlyShare) > 0 && Number(details.peopleWanted) >= 1;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={LABEL_STYLE}>{t.monthlyShare}</span>
        <input
          type="number"
          min="1"
          value={details.monthlyShare}
          onChange={(event) => onChange({ ...details, monthlyShare: event.target.value })}
          className={INPUT_STYLE}
        />
      </label>

      <label className="block">
        <span className={LABEL_STYLE}>{t.peopleWanted}</span>
        <input
          type="number"
          min="1"
          max="20"
          value={details.peopleWanted}
          onChange={(event) => onChange({ ...details, peopleWanted: event.target.value })}
          className={INPUT_STYLE}
        />
      </label>

      <label className="block">
        <span className={LABEL_STYLE}>{t.whoCanJoin}</span>
        <select
          value={details.genderPreference}
          onChange={(event) => onChange({ ...details, genderPreference: event.target.value as GenderChoice })}
          className={INPUT_STYLE}
        >
          <option value="any">{t.anyone}</option>
          <option value="male">{t.men}</option>
          <option value="female">{t.women}</option>
        </select>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-200 font-black text-sm py-3 rounded-2xl cursor-pointer"
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isComplete}
          className="flex-1 bg-(--color-accent) text-white font-black text-sm py-3 rounded-2xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.next}
        </button>
      </div>
    </div>
  );
};

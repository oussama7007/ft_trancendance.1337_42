import type React from 'react';
import { ListingCard } from '../ListingCard';
import type { Language } from '../../types';
import type { Roommate } from '../../types/roommate';
import { translations } from '../../translations';

interface RoommateResultsProps {
  lang: Language;
  rooms: Roommate[];
  hasError: boolean;
  onSelect: (room: Roommate) => void;
}

export const RoommateResults: React.FC<RoommateResultsProps> = ({ lang, rooms, hasError, onSelect }) => {
  const t = translations[lang].roommates;

  return (
    <section className="w-full max-w-[1600px] mx-auto mt-8 mb-16">
      <h2 className="text-lg font-black text-gray-900 mb-4">{t.roomsTitle}</h2>

      {hasError && <p className="text-sm text-red-600">{t.roomsError}</p>}
      {!hasError && rooms.length === 0 && <p className="text-sm text-gray-500">{t.roomsEmpty}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <ListingCard
            key={room.id}
            item={{ ...room.listing, price: room.monthlyShare }}
            lang={lang}
            availableLabel={`${t.peopleWanted}: ${room.peopleWanted}`}
            detailsLabel={t.details}
            onSelect={() => onSelect(room)}
          />
        ))}
      </div>
    </section>
  );
};

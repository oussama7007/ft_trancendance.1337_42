import type React from 'react';
import { MapPin, Users } from 'lucide-react';
import type { Roommate } from '../../types/roommate';

interface RoommateResultsProps {
  rooms: Roommate[];
  hasError: boolean;
  title: string;
  emptyLabel: string;
  errorLabel: string;
  onSelect: (room: Roommate) => void;
}

export const RoommateResults: React.FC<RoommateResultsProps> = ({
  rooms,
  hasError,
  title,
  emptyLabel,
  errorLabel,
  onSelect,
}) => {
  return (
    <section className="w-full max-w-[1600px] mx-auto mt-8 mb-16">
      <h2 className="text-lg font-black text-gray-900 mb-4">{title}</h2>

      {hasError && <p className="text-sm text-red-600">{errorLabel}</p>}
      {!hasError && rooms.length === 0 && <p className="text-sm text-gray-500">{emptyLabel}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article
            key={room.id}
            onClick={() => onSelect(room)}
            className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 p-5"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-gray-900 capitalize">{room.district}</h3>
              <span className="font-black text-(--color-accent)">{room.price} DH</span>
            </div>
            <p className="text-xs text-gray-500 font-bold flex items-center gap-1 mb-3 capitalize">
              <MapPin className="w-3 h-3 text-red-500" />
              {room.city}
            </p>
            <p className="text-xs text-gray-700 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {room.roommates.join(', ')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

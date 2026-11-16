import type React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import type { Language } from '../../types';
import type { Roommate } from '../../types/roommate';
import { translations } from '../../translations';
import { ModalShell } from './ModalShell';

interface RoommateDetailsModalProps {
  lang: Language;
  room: Roommate | null;
  onClose: () => void;
  onContact: (room: Roommate) => void;
}

export const RoommateDetailsModal: React.FC<RoommateDetailsModalProps> = ({ lang, room, onClose, onContact }) => {
  if (!room) {
    return null;
  }

  const t = translations[lang].roommates;
  const { listing } = room;
  const genderLabels = { any: t.anyone, male: t.men, female: t.women };

  const rows = [
    { label: t.owner, value: listing.ownerName },
    { label: t.peopleWanted, value: room.peopleWanted },
    { label: t.whoCanJoin, value: genderLabels[room.genderPreference] },
    { label: t.bedrooms, value: listing.bedrooms },
    { label: t.wifi, value: listing.hasWifi ? t.yes : t.no },
  ];

  return (
    <ModalShell title={listing.title[lang]} onClose={onClose}>
      <div className="flex gap-2 overflow-x-auto mb-4">
        {(listing.images ?? []).map((image) => (
          <img key={image} src={image} alt={listing.title[lang]} className="h-40 rounded-2xl object-cover" />
        ))}
      </div>

      {listing.video && <video src={listing.video} controls className="w-full rounded-2xl mb-4" />}

      <p className="text-sm text-gray-500 font-bold flex items-center gap-1 mb-3">
        <MapPin className="w-4 h-4 text-red-500" />
        {listing.districtEnFr} - {listing.city[lang]}
      </p>

      <p className="text-2xl font-black text-(--color-accent) mb-4">
        {room.monthlyShare} DH <span className="text-sm font-bold text-gray-500">{t.perPersonMonth}</span>
      </p>

      <p className="text-sm text-gray-700 mb-4">{listing.description[lang]}</p>

      <dl className="space-y-3 border-t border-gray-100 pt-4 mb-5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-sm">
            <dt className="text-gray-500 font-bold">{row.label}</dt>
            <dd className="text-gray-900 font-black text-end">{row.value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => onContact(room)}
        className="w-full flex items-center justify-center gap-2 bg-(--color-accent) text-white font-black py-3 rounded-2xl cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" />
        {t.contact}
      </button>
    </ModalShell>
  );
};

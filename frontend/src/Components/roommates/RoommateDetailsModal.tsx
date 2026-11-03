import type React from 'react';
import { MapPin, X } from 'lucide-react';
import type { Roommate } from '../../types/roommate';

interface RoommateDetailsLabels {
  detailsTitle: string;
  location: string;
  price: string;
  perMonth: string;
  roomOwner: string;
  roomLivingThere: string;
  roomFor: string;
  roomForMale: string;
  roomForFemale: string;
  roomForAnyone: string;
  roomWifi: string;
  roomYes: string;
  roomNo: string;
}

interface RoommateDetailsModalProps {
  room: Roommate | null;
  labels: RoommateDetailsLabels;
  onClose: () => void;
}

export const RoommateDetailsModal: React.FC<RoommateDetailsModalProps> = ({ room, labels, onClose }) => {
  if (!room) {
    return null;
  }

  const roomFor =
    room.genderPreference === 'male'
      ? labels.roomForMale
      : room.genderPreference === 'female'
        ? labels.roomForFemale
        : labels.roomForAnyone;

  const rows = [
    { label: labels.roomOwner, value: room.ownerName },
    { label: labels.roomLivingThere, value: room.roommates.join(', ') },
    { label: labels.roomFor, value: roomFor },
    { label: labels.roomWifi, value: room.hasWifi ? labels.roomYes : labels.roomNo },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-(--color-accent)">
              {labels.detailsTitle}
            </p>
            <h2 className="text-xl font-black text-gray-900 capitalize truncate">{room.district}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <p className="text-sm text-gray-500 font-bold flex items-center gap-1 mb-4 capitalize">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="sr-only">{labels.location}</span>
          {room.city}
        </p>

        <p className="text-2xl font-black text-(--color-accent) mb-5">
          <span className="sr-only">{labels.price} </span>
          {room.price} DH <span className="text-sm font-bold text-gray-500">{labels.perMonth}</span>
        </p>

        <dl className="space-y-3 border-t border-gray-100 pt-4">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-sm">
              <dt className="text-gray-500 font-bold">{row.label}</dt>
              <dd className="text-gray-900 font-black text-end">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

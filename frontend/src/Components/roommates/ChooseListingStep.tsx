import { useEffect, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchMyListings } from '../../api/myListings';
import type { Language, Listing } from '../../types';
import { translations } from '../../translations';

interface ChooseListingStepProps {
  lang: Language;
  selected: Listing | null;
  onSelect: (listing: Listing) => void;
  onNext: () => void;
}

export const ChooseListingStep: React.FC<ChooseListingStepProps> = ({ lang, selected, onSelect, onNext }) => {
  const t = translations[lang].roommates;
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchMyListings()
      .then(setListings)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm font-bold text-gray-700 mb-3">{t.chooseListing}</p>

      {isLoading && <p className="text-sm text-gray-500">{t.loading}</p>}
      {hasError && <p className="text-sm text-red-600">{t.listingsError}</p>}
      {!isLoading && !hasError && listings.length === 0 && (
        <p className="text-sm text-gray-500 mb-3">{t.noListings}</p>
      )}

      <div className="space-y-2 mb-4">
        {listings.map((listing) => (
          <button
            key={listing.id}
            type="button"
            onClick={() => onSelect(listing)}
            className={`w-full flex items-center gap-3 p-2 rounded-2xl border text-start cursor-pointer transition ${
              selected?.id === listing.id ? 'border-(--color-accent) bg-(--color-accent-soft)' : 'border-gray-200'
            }`}
          >
            <img src={listing.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            <span className="min-w-0">
              <span className="block text-sm font-black text-gray-900 truncate">{listing.title[lang]}</span>
              <span className="block text-xs text-gray-500">{listing.city[lang]}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/listings/new')}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-200 font-black text-sm py-3 rounded-2xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t.addListing}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-(--color-accent) text-white font-black text-sm py-3 rounded-2xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.next}
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing, uploadFiles } from '../api/myListings';
import { ApiError } from '../api/apiError';
import { LocationPicker, type Position } from '../Components/listings/LocationPicker';
import { CITIES } from '../data/cities';
import { translations } from '../translations';
import type { Language } from '../types';

interface NewListingPageProps {
  lang: Language;
}

const MAX_IMAGES = 8;
const MOROCCO_CENTER: Position = { lat: 31.7917, lng: -7.0926 };
const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'riad', 'villa'] as const;

const INPUT_STYLE = 'w-full bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none';
const LABEL_STYLE = 'block text-sm font-bold text-gray-700 mb-1';

export const NewListingPage: React.FC<NewListingPageProps> = ({ lang }) => {
  const t = translations[lang].newListing;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0]);
  const [cityName, setCityName] = useState('');
  const [district, setDistrict] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [hasWifi, setHasWifi] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const city = CITIES.find((item) => item.en === cityName);

  const findMissingInfo = () => {
    if (!city) return t.missingCity;
    if (images.length === 0) return t.missingImage;
    if (images.length > MAX_IMAGES) return t.tooManyImages;
    if (!position) return t.missingPosition;
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const missingInfo = findMissingInfo();
    if (missingInfo || !city || !position) {
      setErrorMessage(missingInfo);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const uploaded = await uploadFiles(video ? [...images, video] : images);

      await createListing({
        title,
        description,
        type,
        cityAr: city.ar,
        cityFr: city.fr,
        cityEn: city.en,
        district,
        price: Number(price),
        bedrooms: Number(bedrooms),
        hasWifi,
        images: uploaded.slice(0, images.length),
        video: video ? uploaded[images.length] : undefined,
        lat: position.lat,
        lng: position.lng,
      });

      navigate('/?tab=roommate');
    } catch (error) {
      const isSignedOut = error instanceof ApiError && error.status === 401;
      setErrorMessage(isSignedOut ? t.signInAgain : t.saveError);
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t.pageTitle}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={LABEL_STYLE}>{t.title}</span>
          <input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT_STYLE} />
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.description}</span>
          <textarea required minLength={10} maxLength={2000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={INPUT_STYLE} />
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.type}</span>
          <select value={type} onChange={(event) => setType(event.target.value)} className={INPUT_STYLE}>
            {PROPERTY_TYPES.map((item) => (
              <option key={item} value={item}>{t.types[item]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.city}</span>
          <select
            required
            value={cityName}
            onChange={(event) => {
              setCityName(event.target.value);
              setPosition(null);
            }}
            className={INPUT_STYLE}
          >
            <option value="">{t.chooseCity}</option>
            {CITIES.map((item) => (
              <option key={item.en} value={item.en}>{item[lang]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.district}</span>
          <input required minLength={2} maxLength={80} value={district} onChange={(event) => setDistrict(event.target.value)} className={INPUT_STYLE} />
        </label>

        <div className="flex gap-4">
          <label className="block flex-1">
            <span className={LABEL_STYLE}>{t.price}</span>
            <input required type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} className={INPUT_STYLE} />
          </label>
          <label className="block flex-1">
            <span className={LABEL_STYLE}>{t.bedrooms}</span>
            <input required type="number" min="0" max="50" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className={INPUT_STYLE} />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <input type="checkbox" checked={hasWifi} onChange={(event) => setHasWifi(event.target.checked)} />
          {t.wifi}
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.images}</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setImages(Array.from(event.target.files ?? []))}
            className={INPUT_STYLE}
          />
        </label>

        <label className="block">
          <span className={LABEL_STYLE}>{t.video}</span>
          <input
            type="file"
            accept="video/mp4"
            onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
            className={INPUT_STYLE}
          />
        </label>

        <div>
          <span className={LABEL_STYLE}>{t.mapHint}</span>
          <LocationPicker
            center={city ? { lat: city.lat, lng: city.lng } : MOROCCO_CENTER}
            zoom={city ? 13 : 5.5}
            position={position}
            onPick={setPosition}
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-(--color-accent) text-white font-black py-3 rounded-2xl cursor-pointer disabled:opacity-40"
        >
          {isSaving ? t.saving : t.save}
        </button>
      </form>
    </main>
  );
};

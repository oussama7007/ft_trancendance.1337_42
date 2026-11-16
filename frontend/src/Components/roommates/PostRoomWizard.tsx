import { useState } from 'react';
import type React from 'react';
import { ApiError } from '../../api/apiError';
import { createRoommatePost } from '../../api/roommates';
import type { Language, Listing } from '../../types';
import { translations } from '../../translations';
import { ChooseListingStep } from './ChooseListingStep';
import { ModalShell } from './ModalShell';
import { RoomDetailsStep, type RoomDetails } from './RoomDetailsStep';

interface PostRoomWizardProps {
  lang: Language;
  onClose: () => void;
  onPosted: () => void;
}

type Step = 'listing' | 'details' | 'review';

export const PostRoomWizard: React.FC<PostRoomWizardProps> = ({ lang, onClose, onPosted }) => {
  const t = translations[lang].roommates;
  const [step, setStep] = useState<Step>('listing');
  const [listing, setListing] = useState<Listing | null>(null);
  const [details, setDetails] = useState<RoomDetails>({
    monthlyShare: '',
    peopleWanted: '',
    genderPreference: 'any',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const genderLabels = { any: t.anyone, male: t.men, female: t.women };

  const messageForError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) return t.alreadyPosted;
    if (error instanceof ApiError && error.status === 401) return t.signInAgain;
    return t.postError;
  };

  const handlePost = async () => {
    if (!listing) return;

    setIsPosting(true);
    setErrorMessage('');

    try {
      await createRoommatePost({
        listingId: listing.id,
        monthlyShare: Number(details.monthlyShare),
        peopleWanted: Number(details.peopleWanted),
        genderPreference: details.genderPreference,
      });
      onPosted();
    } catch (error) {
      setErrorMessage(messageForError(error));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <ModalShell title={t.postRoom} onClose={onClose}>
      {step === 'listing' && (
        <ChooseListingStep
          lang={lang}
          selected={listing}
          onSelect={setListing}
          onNext={() => setStep('details')}
        />
      )}

      {step === 'details' && (
        <RoomDetailsStep
          lang={lang}
          details={details}
          onChange={setDetails}
          onBack={() => setStep('listing')}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && listing && (
        <div>
          <img src={listing.imageUrl} alt="" className="w-full h-40 rounded-2xl object-cover mb-3" />
          <p className="font-black text-gray-900 mb-1">{listing.title[lang]}</p>
          <p className="text-sm text-gray-500 mb-3">{listing.city[lang]}</p>
          <p className="text-sm text-gray-700">{t.monthlyShare}: {details.monthlyShare} DH</p>
          <p className="text-sm text-gray-700">{t.peopleWanted}: {details.peopleWanted}</p>
          <p className="text-sm text-gray-700 mb-4">{t.whoCanJoin}: {genderLabels[details.genderPreference]}</p>

          {errorMessage && <p className="text-sm text-red-600 mb-3">{errorMessage}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="flex-1 border border-gray-200 font-black text-sm py-3 rounded-2xl cursor-pointer"
            >
              {t.back}
            </button>
            <button
              type="button"
              onClick={handlePost}
              disabled={isPosting}
              className="flex-1 bg-(--color-accent) text-white font-black text-sm py-3 rounded-2xl cursor-pointer disabled:opacity-40"
            >
              {t.post}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
};

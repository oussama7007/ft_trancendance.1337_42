import { useEffect, useState } from 'react';
import { handshakeService } from '../../services/handshakeService';
import type { ChatListing } from '../../services/handshakeService';
import { translations } from '../../translations';
import type { Language } from '../../types';
import HandshakeButton from './HandshakeButton';

interface ChatHandshakeProps
{
  conversationId: number;
  lang: Language;
}

// Shows the handshake button in the chat header when the chat is about a listing
export default function ChatHandshake({ conversationId, lang }: ChatHandshakeProps)
{
  const t = translations[lang].handshake;
  const [listing, setListing] = useState<ChatListing | null>(null);

  useEffect(() =>
  {
    let ignore = false;

    handshakeService.getForConversation(conversationId)
      .then((data) => { if (!ignore) setListing(data); })
      .catch(() => { if (!ignore) setListing(null); });

    return () => { ignore = true; };
  }, [conversationId]);

  if (!listing)
    return null;

  return (
    <div className="ms-auto flex items-center gap-3">
      <p className="hidden max-w-56 truncate text-end text-xs text-[var(--color-muted)] md:block">
        {t.forListing} <span className="font-semibold text-[var(--color-text)]">{listing.title[lang]}</span>
      </p>
      <HandshakeButton key={listing.id} listingId={listing.id} clientId={listing.clientId} t={t} />
    </div>
  );
}

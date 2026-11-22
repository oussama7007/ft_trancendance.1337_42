import { Check, Handshake as HandshakeIcon } from 'lucide-react';
import { useHandshake } from '../../hooks/useHandshake';
import type { Handshake } from '../../services/handshakeService';
import type { HandshakeTranslations } from '../../translations';

interface HandshakeButtonProps
{
  listingId: number;
  clientId: number;
  t: HandshakeTranslations;
}

// text for each state
function getButtonText(handshake: Handshake | null, loading: boolean, t: HandshakeTranslations): string
{
  if (loading)
    return t.loading;
  if (!handshake)
    return t.unavailable;
  if (handshake.status === 'confirmed')
    return t.confirmed;
  if (handshake.hasUserApproved)
    return t.waiting;
  if (handshake.status === 'pending')
    return t.approve;
  return t.propose;
}

// the handshake button
export default function HandshakeButton({ listingId, clientId, t }: HandshakeButtonProps)
{
  const { handshake, loading, error, approve } = useHandshake(listingId, clientId);
  const disabled = loading || !handshake || handshake.hasUserApproved;
  const confirmed = handshake?.status === 'confirmed';

  const look = confirmed
    ? 'cursor-default bg-[#E8F5EE] text-[#178A4C]'
    : disabled
      ? 'cursor-not-allowed bg-[#F3F4F6] text-[#6B7280]'
      : 'bg-[#EE7F4D] text-white shadow-[0_6px_14px_rgba(238,127,77,0.3)] hover:brightness-95';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={approve}
        disabled={disabled}
        className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold whitespace-nowrap transition ${look}`}
      >
        {confirmed ? <Check size={18} aria-hidden="true" /> : <HandshakeIcon size={18} aria-hidden="true" />}
        {getButtonText(handshake, loading, t)}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {t.error}
        </p>
      )}
    </div>
  );
}

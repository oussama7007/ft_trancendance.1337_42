import { useHandshake } from '../../hooks/useHandshake';
import type { Handshake } from '../../services/handshakeService';

interface HandshakeButtonProps
{
  listingId: number;
  clientId: number;
}

function getButtonText(handshake: Handshake | null, loading: boolean): string
{
  if (loading)
    return 'Loading...';
  if (!handshake)
    return 'Unavailable';
  if (handshake.status === 'confirmed')
    return 'Handshake Confirmed!';
  if (handshake.hasUserApproved)
    return 'Waiting for the other person to approve...';
  if (handshake.status === 'pending')
    return 'Approve Handshake';
  return 'Propose Handshake';
}

export default function HandshakeButton(props: HandshakeButtonProps)
{
  const { handshake, loading, error, approve } = useHandshake(props.listingId, props.clientId);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={loading || !handshake || handshake.hasUserApproved}
        className="rounded-lg bg-irent-orange px-4 py-2 font-medium text-white transition hover:bg-irent-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {getButtonText(handshake, loading)}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}

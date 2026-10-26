import { useHandshake } from '../../hooks/useHandshake';
import type { Handshake } from '../../services/handshakeService';

interface HandshakeButtonProps
{
  listingId: number;
  clientId: number;
  // TODO(auth): temporary. It is the id of the logged-in user, passed in until
  // real login exists. Remove it together with the one in handshakeService.ts.
  userId: number;
}

// The text for each state: while something is loading, when the state could not
// be loaded, and the four stages of a handshake.
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

// The whole handshake flow in one button: propose, approve, wait for the other
// person, confirmed. It is disabled while a request runs, once the user has
// said yes, and when the state could not be loaded.
export default function HandshakeButton(props: HandshakeButtonProps)
{
  const { handshake, loading, error, approve } = useHandshake(props.listingId, props.clientId, props.userId);

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

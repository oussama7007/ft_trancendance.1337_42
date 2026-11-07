import { useEffect, useState } from 'react';
import { handshakeService } from '../services/handshakeService';
import type { Handshake } from '../services/handshakeService';

// Loads the handshake between a listing and a client and gives the button what
// it needs: the state, whether a request is running, an error flag, and the
// action to say yes.
export function useHandshake(listingId: number, clientId: number, userId: number)
{
  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetches the current state when the button appears or the ids change.
  // `ignore` drops an answer that arrives after the effect was replaced or the
  // component was removed, so an old response never overwrites a newer one.
  useEffect(() =>
  {
    let ignore = false;

    handshakeService.get(listingId, clientId, userId)
      .then((data) => { if (!ignore) setHandshake(data); })
      .catch(() => { if (!ignore) setError(true); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [listingId, clientId, userId]);

  // Sends the user's yes and shows the state the server answers with.
  // A failure only raises the error flag; the button stays usable.
  async function approve()
  {
    setLoading(true);
    setError(false);
    try
    {
      setHandshake(await handshakeService.approve(listingId, clientId, userId));
    }
    catch
    {
      setError(true);
    }
    setLoading(false);
  }

  return { handshake, loading, error, approve };
}

import { useEffect, useState } from 'react';
import { handshakeService } from '../services/handshakeService';
import type { Handshake } from '../services/handshakeService';

export function useHandshake(listingId: number, clientId: number)
{
  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load the current state when the button appears (or the ids change)
  useEffect(() =>
  {
    let ignore = false; // true once this effect is replaced or unmounted

    handshakeService.get(listingId, clientId)
      .then((data) => { if (!ignore) setHandshake(data); })
      .catch(() => { if (!ignore) setError(true); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [listingId, clientId]);

  async function approve()
  {
    setLoading(true);
    setError(false);
    try
    {
      setHandshake(await handshakeService.approve(listingId, clientId));
    }
    catch
    {
      setError(true);
    }
    setLoading(false);
  }

  return { handshake, loading, error, approve };
}

import { useEffect, useState } from 'react';
import { handshakeService } from '../services/handshakeService';
import type { Handshake } from '../services/handshakeService';

// loads the handshake for the button
export function useHandshake(listingId: number, clientId: number)
{
  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() =>
  {
    let ignore = false;

    handshakeService.get(listingId, clientId)
      .then((data) => { if (!ignore) setHandshake(data); })
      .catch(() => { if (!ignore) setError(true); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [listingId, clientId]);

  // sends the yes
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

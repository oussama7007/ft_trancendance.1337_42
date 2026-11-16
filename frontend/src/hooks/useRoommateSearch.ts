import { useEffect, useState } from 'react';
import { fetchRoommates } from '../api/roommates';
import type { Roommate } from '../types/roommate';

interface RoommateSearch {
  enabled: boolean;
  city: string;
  budget: string;
  gender: string;
}

export function useRoommateSearch({ enabled, city, budget, gender }: RoommateSearch) {
  const [rooms, setRooms] = useState<Roommate[]>([]);
  const [hasError, setHasError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchRoommates(
          {
            city,
            maxBudget: Number(budget) > 0 ? Number(budget) : undefined,
            gender: gender === 'male' || gender === 'female' ? gender : undefined,
          },
          controller.signal,
        );
        setRooms(data);
        setHasError(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setRooms([]);
        setHasError(true);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, city, budget, gender, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  return { rooms, hasError, reload };
}

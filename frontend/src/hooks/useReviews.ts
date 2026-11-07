import { useEffect, useState } from 'react';
import { reviewService } from '../services/reviewService';
import type { ReviewRole, ReviewTab, ReviewsResult } from '../services/reviewService';

// Loads the reviews of a profile and says if the current user can leave one.
export function useReviews(profileUserId: number, currentUserId?: number)
{
  const [tab, setTab] = useState<ReviewTab>('all');
  const [result, setResult] = useState<ReviewsResult | null>(null);
  const [error, setError] = useState(false);
  const [role, setRole] = useState<ReviewRole | null>(null);
  const [refresh, setRefresh] = useState(0);

  const canAsk = !!currentUserId && currentUserId !== profileUserId;

  useEffect(() =>
  {
    let ignore = false;

    reviewService.getByUser(profileUserId, tab)
      .then((data) => { if (!ignore) { setResult(data); setError(false); } })
      .catch(() => { if (!ignore) setError(true); });

    return () => { ignore = true; };
  }, [profileUserId, tab, refresh]);

  useEffect(() =>
  {
    let ignore = false;

    if (!currentUserId || currentUserId === profileUserId)
      return;

    reviewService.canReview(profileUserId, currentUserId)
      .then((data) => { if (!ignore) setRole(data.role); })
      .catch(() => { if (!ignore) setRole(null); });

    return () => { ignore = true; };
  }, [profileUserId, currentUserId, refresh]);

  // Saves the review, then loads everything again so it shows up.
  async function submit(rating: number, comment: string)
  {
    if (!currentUserId)
      return;
    await reviewService.create(profileUserId, currentUserId, rating, comment);
    setRefresh((n) => n + 1);
  }

  return { tab, setTab, result, error, reviewRole: canAsk ? role : null, submit };
}

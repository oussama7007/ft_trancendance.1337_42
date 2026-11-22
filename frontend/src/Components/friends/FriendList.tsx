import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import type { Friend } from '../../services/friendService';
import type { FriendsTranslations } from '../../translations';
import type { Language } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { FriendRow } from './FriendRow';

interface FriendListProps
{
  friends: Friend[];
  lang: Language;
  t: FriendsTranslations;
  onRemove: (userId: number) => void;
  onFindPeople: () => void;
}

// my friends list
export function FriendList({ friends, lang, t, onRemove, onFindPeople }: FriendListProps)
{
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // removes the friend after confirming
  function remove(userId: number)
  {
    setConfirmingId(null);
    onRemove(userId);
  }

  if (friends.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="font-bold text-(--color-primary)">{t.noFriends}</p>
        <p className="mt-1 mb-4 text-sm text-(--color-muted)">{t.noFriendsHint}</p>
        <button
          type="button"
          onClick={onFindPeople}
          className="h-11 rounded-xl bg-(--color-primary) px-5 text-sm font-bold text-white hover:bg-(--color-primary-dark)"
        >
          {t.tabFind}
        </button>
      </div>
    );
  }

  return (
    <ul>
      {friends.map((friend) => {
        const isConfirming = confirmingId === friend.user.id;

        return (
          <FriendRow
            key={friend.user.id}
            user={friend.user}
            subtitle={isConfirming ? t.removeQuestion : `${t.since} ${formatDate(friend.since, lang)}`}
          >
            {isConfirming ? (
              <>
                <button
                  type="button"
                  onClick={() => remove(friend.user.id)}
                  className="h-10 shrink-0 rounded-xl bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  {t.removeYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="h-10 shrink-0 rounded-xl border border-(--color-border) px-3 text-sm font-bold text-(--color-primary) hover:bg-(--color-background)"
                >
                  {t.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(friend.user.id)}
                aria-label={t.remove}
                title={t.remove}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--color-border) text-(--color-muted) hover:text-(--color-accent)"
              >
                <UserMinus size={18} />
              </button>
            )}
          </FriendRow>
        );
      })}
    </ul>
  );
}

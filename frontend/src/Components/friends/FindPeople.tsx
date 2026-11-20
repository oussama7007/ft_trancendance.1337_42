import { useEffect, useState } from 'react';
import { Check, Clock, Search, UserCheck, UserPlus } from 'lucide-react';
import { searchUsers } from '../../services/friendService';
import type { FriendshipStatus, SearchResult } from '../../services/friendService';
import type { FriendsTranslations } from '../../translations';
import { FriendRow } from './FriendRow';

type Action = (userId: number) => Promise<FriendshipStatus | null>;

interface FindPeopleProps {
  t: FriendsTranslations;
  onAdd: Action;
  onCancel: Action;
  onAccept: Action;
}

const buttonClass = 'flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold';

// Searches users by name and shows the right button next to each one
export function FindPeople({ t, onAdd, onCancel, onAccept }: FindPeopleProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const text = query.trim();

  useEffect(() => {
    if (text.length < 2) {
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(text);
        if (!ignore) setResults(data);
      } catch {
        if (!ignore) setResults([]);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [text]);

  // Runs the action and updates the button of that person only
  async function handle(action: Action, userId: number) {
    const status = await action(userId);
    if (status) {
      setResults((current) =>
        current.map((result) => (result.user.id === userId ? { ...result, status } : result)),
      );
    }
  }

  // Picks the button that matches where i stand with this person
  function renderButton(result: SearchResult) {
    const id = result.user.id;

    if (result.status === 'none') {
      return (
        <button type="button" onClick={() => handle(onAdd, id)} className={`${buttonClass} bg-(--color-primary) text-white`}>
          <UserPlus size={16} /> {t.add}
        </button>
      );
    }
    if (result.status === 'pending_sent') {
      return (
        <button type="button" onClick={() => handle(onCancel, id)} title={t.cancel} className={`${buttonClass} border border-(--color-border) text-(--color-primary)`}>
          <Clock size={16} /> {t.pending}
        </button>
      );
    }
    if (result.status === 'pending_received') {
      return (
        <button type="button" onClick={() => handle(onAccept, id)} className={`${buttonClass} bg-(--color-accent) text-(--color-text)`}>
          <Check size={16} /> {t.accept}
        </button>
      );
    }
    return (
      <span className={`${buttonClass} bg-(--color-success-soft) text-emerald-700`}>
        <UserCheck size={16} /> {t.isFriend}
      </span>
    );
  }

  return (
    <div>
      <label htmlFor="friend-search" className="mx-2 mt-2 mb-1 block text-xs font-bold uppercase tracking-wider text-(--color-muted)">
        {t.searchLabel}
      </label>
      <div className="relative mx-1">
        <Search size={18} className="absolute start-3.5 top-3 text-(--color-muted)" />
        <input
          id="friend-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-11 w-full rounded-xl border border-(--color-border) ps-10 pe-3 text-sm outline-none focus:border-(--color-primary)"
        />
      </div>

      {text.length < 2 && <p className="mx-2 py-3 text-sm text-(--color-muted)">{t.typeMore}</p>}
      {text.length >= 2 && results.length === 0 && <p className="mx-2 py-3 text-sm text-(--color-muted)">{t.noResults}</p>}
      {text.length >= 2 && (
        <ul className="mt-1">
          {results.map((result) => (
            <FriendRow key={result.user.id} user={result.user}>
              {renderButton(result)}
            </FriendRow>
          ))}
        </ul>
      )}
    </div>
  );
}

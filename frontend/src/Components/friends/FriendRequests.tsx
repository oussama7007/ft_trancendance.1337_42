import { Check, X } from 'lucide-react';
import type { FriendRequests as Requests } from '../../services/friendService';
import type { FriendsTranslations } from '../../translations';
import type { Language } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { FriendRow } from './FriendRow';

interface FriendRequestsProps {
  requests: Requests;
  lang: Language;
  t: FriendsTranslations;
  onAccept: (userId: number) => void;
  onReject: (userId: number) => void;
  onCancel: (userId: number) => void;
}

const titleClass = 'mx-2 mt-2 mb-1 text-xs font-bold uppercase tracking-wider text-(--color-muted)';
const emptyClass = 'mx-2 py-3 text-sm text-(--color-muted)';

// Shows the requests waiting for my answer and the ones i sent
export function FriendRequests({ requests, lang, t, onAccept, onReject, onCancel }: FriendRequestsProps) {
  return (
    <div>
      <p className={titleClass}>{t.received}</p>
      {requests.incoming.length === 0 && <p className={emptyClass}>{t.noReceived}</p>}
      <ul>
        {requests.incoming.map((request) => (
          <FriendRow
            key={request.user.id}
            user={request.user}
            subtitle={`${t.sentOn} ${formatDate(request.sentAt, lang)}`}
          >
            <button
              type="button"
              onClick={() => onAccept(request.user.id)}
              aria-label={t.accept}
              title={t.accept}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--color-primary) text-white hover:bg-(--color-primary-dark)"
            >
              <Check size={18} />
            </button>
            <button
              type="button"
              onClick={() => onReject(request.user.id)}
              aria-label={t.reject}
              title={t.reject}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--color-border) text-(--color-muted) hover:text-(--color-accent)"
            >
              <X size={18} />
            </button>
          </FriendRow>
        ))}
      </ul>

      <p className={`${titleClass} mt-5`}>{t.sent}</p>
      {requests.outgoing.length === 0 && <p className={emptyClass}>{t.noSent}</p>}
      <ul>
        {requests.outgoing.map((request) => (
          <FriendRow
            key={request.user.id}
            user={request.user}
            subtitle={`${t.sentOn} ${formatDate(request.sentAt, lang)}`}
          >
            <button
              type="button"
              onClick={() => onCancel(request.user.id)}
              className="h-11 shrink-0 rounded-xl border border-(--color-border) px-4 text-sm font-bold text-(--color-primary) hover:text-(--color-accent)"
            >
              {t.cancel}
            </button>
          </FriendRow>
        ))}
      </ul>
    </div>
  );
}

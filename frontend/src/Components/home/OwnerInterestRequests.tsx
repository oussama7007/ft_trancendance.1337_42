import React, { useState } from 'react';
import { CheckCircle, Home, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/chatContextValue';
import { listingTitleOf } from '../../services/interestService';
import { translations } from '../../translations';
import type { Language } from '../../types';
import ChatAvatar from '../chat/ChatAvatar';
import { getLocale } from '../chat/chatUtils';

interface OwnerInterestRequestsProps {
  lang: Language;
  onAcceptSuccess?: (conversationId?: number) => void;
}

export const OwnerInterestRequests: React.FC<OwnerInterestRequestsProps> = ({ lang, onAcceptSuccess }) => {
  const t = translations[lang].chat.interests;
  const { incomingRequests, acceptInterest, declineInterest } = useChat();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  async function run(requestId: number, action: () => Promise<void>) {
    setBusyId(requestId);
    setFailed(false);
    try {
      await action();
    } catch {
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  }

  const dateFormat = new Intl.DateTimeFormat(getLocale(lang), { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
        <Home className="h-5 w-5 text-[var(--color-accent)]" />
        {t.title}
      </h2>

      {failed && <p role="alert" className="mb-4 text-sm text-red-500">{t.actionError}</p>}

      {incomingRequests.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-muted)]">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {incomingRequests.map((req) => {
            const busy = busyId === req.id;
            return (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ChatAvatar name={req.personName} avatarUrl={req.personAvatarUrl} size="sm" />
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      <bdi>{req.personName ?? t.applicant}</bdi>
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      <bdi>{listingTitleOf(req, lang, t.listing)}</bdi> • <bdi>{dateFormat.format(new Date(req.createdAt))}</bdi>
                    </p>
                  </div>
                </div>

                {req.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(req.id, async () => {
                        const conversationId = await acceptInterest(req.id);
                        onAcceptSuccess?.(conversationId ?? undefined);
                      })}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[var(--color-accent-dark)] disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t.accept}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(req.id, async () => { await declineInterest(req.id); })}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
                    >
                      {t.decline}
                    </button>
                  </div>
                ) : req.status === 'REJECTED' ? (
                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">{t.declined}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t.accepted}
                    </span>
                    {req.conversationId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/chat?conversationId=${req.conversationId}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent-dark)] transition hover:bg-[var(--color-accent-soft)]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t.openChat}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { User, CheckCircle, Home, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { translations } from '../../translations';
import type { Language } from '../../types';
import { getLocale } from '../chat/chatUtils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface InterestRequest {
  id: number;
  tenantId: number;
  tenantName?: string;
  listingId: number;
  listingTitle?: string;
  listingTitleEn?: string | null;
  listingTitleFr?: string | null;
  listingTitleAr?: string | null;
  conversationId?: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface OwnerInterestRequestsProps {
  lang: Language;
  onAcceptSuccess?: (conversationId?: number) => void;
}

function titleFor(request: InterestRequest, lang: Language, fallback: string): string {
  const byLang = { en: request.listingTitleEn, fr: request.listingTitleFr, ar: request.listingTitleAr }[lang];
  return byLang || request.listingTitle || `${fallback} #${request.listingId}`;
}

export const OwnerInterestRequests: React.FC<OwnerInterestRequestsProps> = ({ lang, onAcceptSuccess }) => {
  const t = translations[lang].chat.interests;
  const { socket } = useChat();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetch(`${API_URL}/chat/interest-requests/owner`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as InterestRequest[];
        if (!ignore) setRequests(data);
      })
      .catch(() => { if (!ignore) setFailed(true); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewInterestRequest = (incoming: InterestRequest) => {
      setRequests((prev) =>
        prev.some((item) => item.id === incoming.id)
          ? prev.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item))
          : [incoming, ...prev],
      );
    };

    socket.on('newInterestRequest', handleNewInterestRequest);
    return () => { socket.off('newInterestRequest', handleNewInterestRequest); };
  }, [socket]);

  const handleAccept = async (requestId: number) => {
    try {
      const res = await fetch(`${API_URL}/chat/interest-requests/${requestId}/accept`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) return;

      const data = await res.json();
      const conversationId: number | undefined = data.conversation?.id;
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: 'ACCEPTED', conversationId } : req)),
      );
      onAcceptSuccess?.(conversationId);
    } catch (err) {
      console.error('Failed to accept interest request:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-[var(--color-muted)]">{t.loading}</div>;
  }

  const dateFormat = new Intl.DateTimeFormat(getLocale(lang), { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
        <Home className="h-5 w-5 text-[var(--color-accent)]" />
        {t.title}
      </h2>

      {failed && <p role="alert" className="mb-4 text-sm text-red-500">{t.loadError}</p>}

      {requests.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-muted)]">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
                  <User className="h-5 w-5 text-[var(--color-accent-dark)]" />
                </div>
                <div className="min-w-0 text-start">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    <bdi>{req.tenantName ?? t.applicant}</bdi>
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    <bdi>{titleFor(req, lang, t.listing)}</bdi> • <bdi>{dateFormat.format(new Date(req.createdAt))}</bdi>
                  </p>
                </div>
              </div>

              {req.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => handleAccept(req.id)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[var(--color-accent-dark)]"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t.accept}
                </button>
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
          ))}
        </div>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from "react";
import { Bell, Check, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/chatContextValue";
import { translations } from "../translations";
import type { Language } from "../types";
import type { InterestRequest } from "../services/interestService";
import { listingTitleOf } from "../services/interestService";
import ChatAvatar from "./chat/ChatAvatar";
import { fmt, formatTime, getLocale } from "./chat/chatUtils";

interface NotificationsMenuProps {
  lang: Language;
}

const MAX_ITEMS = 8;

function shortDate(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.toDateString() === new Date().toDateString()) return formatTime(date, lang);
  return new Intl.DateTimeFormat(getLocale(lang), { day: "numeric", month: "short" }).format(date);
}

export function NotificationsMenu({ lang }: NotificationsMenuProps) {
  const t = translations[lang].chat.interests;
  const navigate = useNavigate();
  const {
    incomingRequests,
    sentRequests,
    notificationCount,
    acceptInterest,
    declineInterest,
    notificationsOpen,
    setNotificationsOpen,
    markNotificationsSeen,
  } = useChat();

  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (notificationsOpen) markNotificationsSeen();
  }, [notificationsOpen, markNotificationsSeen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [notificationsOpen, setNotificationsOpen]);

  function openChat(conversationId: number | null) {
    setNotificationsOpen(false);
    navigate(conversationId ? `/chat?conversationId=${conversationId}` : "/chat");
  }

  async function run(requestId: number, action: () => Promise<unknown>) {
    setBusyId(requestId);
    setError("");
    try {
      await action();
    } catch {
      setError(t.actionError);
    } finally {
      setBusyId(null);
    }
  }

  const incoming = [...incomingRequests]
    .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"))
    .slice(0, MAX_ITEMS);
  const sent = sentRequests.slice(0, MAX_ITEMS);
  const isEmpty = incoming.length === 0 && sent.length === 0;

  const statusChip = (request: InterestRequest) => {
    if (request.status === "PENDING") {
      return <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{t.pending}</span>;
    }
    if (request.status === "REJECTED") {
      return <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">{t.declined}</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
        <Check size={12} /> {t.accepted}
      </span>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        aria-label={t.notifications}
        aria-expanded={notificationsOpen}
        title={t.notifications}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-(--color-accent)"
      >
        <Bell size={20} />
        {notificationCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div
          role="dialog"
          aria-label={t.notifications}
          className="fixed inset-x-3 top-[5.25rem] z-[60] flex max-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:max-h-[75vh] sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-bold text-(--color-text)">{t.notifications}</h2>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              aria-label={translations[lang].chat.dismiss}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto">
            {error && <p role="alert" className="mx-4 mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}

            {isEmpty && (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-(--color-muted)">
                <Bell size={28} className="text-gray-300" />
                {t.nothing}
              </div>
            )}

            {incoming.length > 0 && (
              <section className="py-2">
                <h3 className="px-4 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-(--color-muted)">{t.incomingTitle}</h3>
                <ul>
                  {incoming.map((request) => {
                    const busy = busyId === request.id;
                    return (
                      <li
                        key={`in-${request.id}`}
                        className={`flex gap-3 px-4 py-3 ${request.status === "PENDING" ? "bg-(--color-accent-soft)/40" : ""}`}
                      >
                        <ChatAvatar name={request.personName} avatarUrl={request.personAvatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-start text-sm text-(--color-text)">
                            {fmt(t.newRequest, {
                              name: request.personName || t.someone,
                              listing: listingTitleOf(request, lang, t.listing),
                            })}
                          </p>
                          <p className="mt-0.5 text-start text-xs text-(--color-muted)">{shortDate(request.createdAt, lang)}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {request.status === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void run(request.id, async () => {
                                    const conversationId = await acceptInterest(request.id);
                                    if (conversationId) openChat(conversationId);
                                  })}
                                  className="inline-flex items-center gap-1 rounded-lg bg-(--color-accent) px-3 py-1.5 text-xs font-bold text-white transition hover:bg-(--color-accent-dark) disabled:opacity-50"
                                >
                                  <Check size={14} /> {t.accept}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void run(request.id, () => declineInterest(request.id))}
                                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {t.decline}
                                </button>
                              </>
                            ) : (
                              <>
                                {statusChip(request)}
                                {request.status === "ACCEPTED" && (
                                  <button
                                    type="button"
                                    onClick={() => openChat(request.conversationId)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-(--color-accent-dark) hover:bg-(--color-accent-soft)"
                                  >
                                    <MessageCircle size={12} /> {t.openChat}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {sent.length > 0 && (
              <section className="border-t border-gray-100 py-2">
                <h3 className="px-4 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-(--color-muted)">{t.sentTitle}</h3>
                <ul>
                  {sent.map((request) => (
                    <li key={`out-${request.id}`} className="flex gap-3 px-4 py-3">
                      <ChatAvatar name={request.personName} avatarUrl={request.personAvatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-start text-sm text-(--color-text)">
                          {fmt(t.youAsked, { listing: listingTitleOf(request, lang, t.listing) })}
                        </p>
                        <p className="mt-0.5 text-start text-xs text-(--color-muted)">
                          <bdi>{request.personName || t.owner}</bdi> · {shortDate(request.updatedAt, lang)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {statusChip(request)}
                          {request.status === "ACCEPTED" && (
                            <button
                              type="button"
                              onClick={() => openChat(request.conversationId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-(--color-accent-dark) hover:bg-(--color-accent-soft)"
                            >
                              <MessageCircle size={12} /> {t.openChat}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {incomingRequests.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(false);
                navigate("/profile");
              }}
              className="border-t border-gray-100 px-4 py-3 text-center text-sm font-bold text-(--color-accent-dark) hover:bg-gray-50"
            >
              {t.seeAll}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

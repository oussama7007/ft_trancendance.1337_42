import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { chatService, resolveMediaUrl } from "../../services/chatService";
import type { PeerProfile } from "../../services/chatService";
import { translations } from "../../translations";
import type { Language } from "../../types";
import ChatAvatar from "./ChatAvatar";
import { fmt, formatLastSeen, getLocale } from "./chatUtils";
import { formatChatError } from "./chatErrorFormatter";

interface PeerProfilePanelProps {
  conversationId: number;
  lang: Language;
  online: boolean;
  onClose: () => void;
}

function safeLink(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default function PeerProfilePanel({ conversationId, lang, online, onClose }: PeerProfilePanelProps) {
  const t = translations[lang].chat;
  const [profile, setProfile] = useState<PeerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    chatService
      .getPeer(conversationId)
      .then((data) => { if (!ignore) setProfile(data); })
      .catch((err) => { if (!ignore) setError(formatChatError(err, lang, t.loadError)); });

    return () => { ignore = true; };
  }, [conversationId, lang, t.loadError]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const socials = profile
    ? ([
        ["LinkedIn", safeLink(profile.linkedin)],
        ["Instagram", safeLink(profile.instagram)],
        ["Facebook", safeLink(profile.facebook)],
      ].filter(([, url]) => url) as Array<[string, string]>)
    : [];

  const lastSeen = profile && !online ? formatLastSeen(profile.lastSeen, lang) : null;

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/30" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.profile.title}
        className="fixed inset-y-0 end-0 z-[60] flex w-full max-w-sm flex-col overflow-y-auto bg-[var(--color-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-bold text-[var(--color-text)]">{t.profile.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.profile.close}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-background)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!profile && !error && (
          <div className="flex flex-col items-center gap-3 p-8">
            <div className="h-28 w-28 animate-pulse rounded-full bg-[var(--color-background)]" />
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-background)]" />
          </div>
        )}

        {profile && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              {profile.avatarUrl ? (
                <a href={resolveMediaUrl(profile.avatarUrl) ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={t.openImage}>
                  <ChatAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} size="lg" online={online}
                    onlineLabel={t.online} offlineLabel={t.offline} />
                </a>
              ) : (
                <ChatAvatar name={profile.fullName} size="lg" online={online} onlineLabel={t.online} offlineLabel={t.offline} />
              )}
              <div>
                <p className="text-xl font-bold text-[var(--color-text)]"><bdi>{profile.fullName}</bdi></p>
                <p className="text-sm text-[var(--color-muted)]">
                  {online ? t.online : lastSeen ? fmt(t.lastSeen, { time: lastSeen }) : t.offline}
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">{t.profile.rating}</h3>
              {profile.rating.count > 0 && profile.rating.average != null ? (
                <div className="flex items-center gap-2">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[var(--color-text)]">
                    {new Intl.NumberFormat(getLocale(lang), { maximumFractionDigits: 1 }).format(profile.rating.average)}
                  </span>
                  <span className="text-sm text-[var(--color-muted)]">· {fmt(t.profile.reviews, { count: profile.rating.count })}</span>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">{t.profile.noReviews}</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">{t.profile.about}</h3>
              <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">
                {profile.bio?.trim() || t.profile.noBio}
              </p>
            </section>

            {socials.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">{t.profile.socials}</h3>
                <ul className="flex flex-wrap gap-2">
                  {socials.map(([label, url]) => (
                    <li key={label}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-block rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold text-[var(--color-accent-dark)] hover:bg-[var(--color-accent-soft)]"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-xs text-[var(--color-muted)]">
              {fmt(t.profile.chattingSince, {
                date: new Intl.DateTimeFormat(getLocale(lang), { day: "numeric", month: "long", year: "numeric" })
                  .format(new Date(profile.conversationSince)),
              })}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

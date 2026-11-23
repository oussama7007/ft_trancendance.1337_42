import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';
import { translations } from '../../translations';
import type { Language } from '../../types';
import { FindPeople } from './FindPeople';
import { FriendList } from './FriendList';
import { FriendRequests } from './FriendRequests';

type Tab = 'friends' | 'requests' | 'find';

interface FriendsMenuProps
{
  lang: Language;
}

// friends icon and its panel
export function FriendsMenu({ lang }: FriendsMenuProps)
{
  const t = translations[lang].friends;
  const { friends, requests, failed, sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend } =
    useFriends();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('friends');

  const requestCount = requests.incoming.length;
  const tabs = [
    { key: 'friends', label: t.tabFriends, count: 0 },
    { key: 'requests', label: t.tabRequests, count: requestCount },
    { key: 'find', label: t.tabFind, count: 0 },
  ] as const;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t.title}
        title={t.title}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
          open
            ? 'bg-(--color-primary) text-white'
            : 'text-(--color-primary) hover:bg-(--color-background) hover:text-(--color-accent)'
        }`}
      >
        <Users size={22} strokeWidth={1.9} />
        {requestCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-(--color-accent) px-1 text-[11px] font-bold text-(--color-text)">
            {requestCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label={t.title}
          className="fixed inset-x-3 top-24 bottom-3 z-30 flex flex-col rounded-[20px] border border-(--color-border) bg-(--color-surface) shadow-[0_20px_48px_rgba(30,58,95,0.18)] md:absolute md:inset-auto md:start-[calc(100%+24px)] md:top-0 md:max-h-[640px] md:w-[380px]"
        >
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
                <Users size={19} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-(--color-primary)">{t.title}</h2>
                <p className="text-sm text-(--color-muted)">
                  {t.count.replace('{count}', String(friends.length))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-(--color-muted) hover:bg-(--color-background)"
            >
              <X size={20} />
            </button>
          </div>

          <div role="tablist" className="mx-4 flex gap-1 rounded-2xl bg-(--color-background) p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => setTab(item.key)}
                className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold ${
                  tab === item.key ? 'bg-(--color-surface) text-(--color-primary) shadow-sm' : 'text-gray-600'
                }`}
              >
                {item.label}
                {item.count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-accent) px-1.5 text-[11px] text-(--color-text)">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {failed && (
            <p role="alert" className="mx-4 mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {t.error}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-4">
            {tab === 'friends' && (
              <FriendList
                friends={friends}
                lang={lang}
                t={t}
                onRemove={removeFriend}
                onFindPeople={() => setTab('find')}
              />
            )}
            {tab === 'requests' && (
              <FriendRequests
                requests={requests}
                lang={lang}
                t={t}
                onAccept={acceptRequest}
                onReject={rejectRequest}
                onCancel={cancelRequest}
              />
            )}
            {tab === 'find' && (
              <FindPeople
                t={t}
                onAdd={sendRequest}
                onCancel={cancelRequest}
                onAccept={acceptRequest}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

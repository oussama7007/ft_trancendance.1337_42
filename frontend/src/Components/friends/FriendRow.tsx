import type { ReactNode } from 'react';
import type { FriendUser } from '../../services/friendService';

interface FriendRowProps {
  user: FriendUser;
  subtitle?: string;
  children?: ReactNode;
}

// one person in a list
export function FriendRow({ user, subtitle, children }: FriendRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) font-bold text-(--color-primary)">
        {user.firstName[0]}
        {user.lastName[0]}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-(--color-text)">
          {user.firstName} {user.lastName}
        </p>
        {subtitle && <p className="truncate text-sm text-(--color-muted)">{subtitle}</p>}
      </div>

      {children}
    </li>
  );
}

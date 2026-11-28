
import {
    LayoutDashboard,
    MessageCircle,
    Settings,
    UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';



import type { ProfileTranslations } from '../../translations';

interface ProfileSidebarProps {
    t: ProfileTranslations['sidebar'];
    children?: ReactNode;
}

const navigationItems = [
    { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { key: 'settings', path: '/settings', icon: Settings },
    { key: 'profile', path: '/profile', icon: UserRound },
    { key: 'messages', path: '/chat', icon: MessageCircle },
] as const;

export function ProfileSidebar({t, children} : ProfileSidebarProps) {
    return (
        <aside className="h-fit rounded-2xl border border-(--color-border) bg-(--color-surface) p-2 shadow-sm">
            <nav
                aria-label={t.navigation}
                className="flex flex-row justify-around gap-1 md:flex-col md:justify-start"
            >
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const label = t[item.key];

                    return (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            end
                            title={label}
                            aria-label={label}
                            className={({ isActive }) =>
                                `flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                                    isActive
                                        ? 'bg-(--color-accent-soft) text-(--color-accent)'
                                        : 'text-(--color-primary) hover:bg-(--color-background) hover:text-(--color-accent)'
                                }`
                            }
                        >
                            <Icon size={22} strokeWidth={1.9} />
                        </NavLink>
                    );
                })}

                {children}
            </nav>
        </aside>
    );
}

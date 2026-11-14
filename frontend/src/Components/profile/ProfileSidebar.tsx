
import {
    Heart,
    LayoutDashboard,
    MessageCircle,
    Settings,
    UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';



import type { ProfileTranslations } from '../../translations';

interface ProfileSidebarProps {
    t: ProfileTranslations['sidebar'];
}

// Pages that already exist in the application.
const navigationItems = [
    // TODO [DASHBOARD TEAMMATE]:
    // Replace this destination with the Dashboard route when implemented.
    { key: 'dashboard', path: '/', icon: LayoutDashboard },

    // PROFILE: Implemented by the Profile developer.
    { key: 'profile', path: '/profile', icon: UserRound },

    // TODO [CHAT TEAMMATE]:
    // Integrate the Chat / Messages page here.
    { key: 'messages', path: '/chat', icon: MessageCircle },
] as const ;

// Future pages. Keep their icons visible until implementation.
const futureItems = [
    // TODO [FAVORITES TEAMMATE]:
    // Implement the user's favorite properties and connect the route.
    { key: 'favorites', icon: Heart },

    // TODO [SETTINGS TEAMMATE]:
    // Implement the user's account settings and connect the route.
    { key: 'settings', icon: Settings },
] as const;

export function ProfileSidebar({t} : ProfileSidebarProps) {
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
                            end={item.path === '/'}
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

                <div className="mx-2 hidden h-px bg-(--color-border) md:block" />

                {futureItems.map((item) => {
                    const Icon = item.icon;
                     const label = t[item.key];

                    return (
                        <button
                            key={item.key}
                            type="button"
                            title={`${label} (${t.comingSoon})`}
                            aria-label={`${label}, ${t.comingSoon}`}
                            // disabled
                            className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-xl text-(--color-muted) opacity-60"
                        >
                            <Icon size={22} strokeWidth={1.9} />
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}

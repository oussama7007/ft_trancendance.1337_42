
import {
    Heart,
    LayoutDashboard,
    MessageCircle,
    Settings,
    UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

// Pages that already exist in the application.
const navigationItems = [
    // TODO [DASHBOARD TEAMMATE]:
    // Replace this destination with the Dashboard route when implemented.
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },

    // PROFILE: Implemented by the Profile developer.
    { label: 'Profile', path: '/profile', icon: UserRound },

    // TODO [CHAT TEAMMATE]:
    // Integrate the Chat / Messages page here.
    { label: 'Messages', path: '/chat', icon: MessageCircle },
];

// Future pages. Keep their icons visible until implementation.
const futureItems = [
    // TODO [FAVORITES TEAMMATE]:
    // Implement the user's favorite properties and connect the route.
    { label: 'Favorites', icon: Heart },

    // TODO [SETTINGS TEAMMATE]:
    // Implement the user's account settings and connect the route.
    { label: 'Settings', icon: Settings },
];

export function ProfileSidebar() {
    return (
        <aside className="h-fit rounded-2xl border border-(--color-border) bg-(--color-surface) p-2 shadow-sm">
            <nav
                aria-label="Main navigation"
                className="flex flex-row justify-around gap-1 md:flex-col md:justify-start"
            >
                {navigationItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            end={item.path === '/'}
                            title={item.label}
                            aria-label={item.label}
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

                    return (
                        <button
                            key={item.label}
                            type="button"
                            title={`${item.label} (coming soon)`}
                            aria-label={`${item.label}, coming soon`}
                            disabled
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

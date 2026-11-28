
import './index.css'

import { useState, useEffect, useCallback } from 'react'
import {
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom'



import { SettingsPage } from './Pages/SettingsPage';
import { LegalPage } from './Pages/LegalPage'
import { HomePage } from './Pages/HomePage'
import { ListingsPage } from './Pages/ListingsPage'
import { NewListingPage } from './Pages/NewListingPage'
import { ProfilePage } from './Pages/ProfilePage'
import { LoginPage } from './Pages/LoginPage'
import { SignUpPage } from './Pages/SignUpPage'

import { Navbar } from './Components/Navbar'
import { Footer } from './Components/Footer'
import Chat from './Components/chat/Chat'
import { DashboardPage } from './Pages/DashboardPage'
import { ChatProvider } from './context/ChatContext'

import type { Language, User } from './types'
import { translations } from './translations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type BackendUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    gender?: string;
    cin?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
};

function mapBackendUser(user: BackendUser): User {
    const isEmail = user.email.includes('@');

    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        fullName: `${user.firstName} ${user.lastName}`,
        email: isEmail ? user.email : '',
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        linkedin: user.linkedin,
        instagram: user.instagram,
        facebook: user.facebook,
        dateOfBirth: user.dateOfBirth,
        
    };
}

const LANGUAGES: Language[] = ['ar', 'fr', 'en'];

function getInitialLanguage(): Language {
    try {
        const saved = localStorage.getItem('lang');

        if (saved && LANGUAGES.includes(saved as Language)) {
            return saved as Language;
        }
    } catch {
    }

    const browser = navigator.language.slice(0, 2);

    return LANGUAGES.includes(browser as Language)
        ? browser as Language
        : 'en';
}

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    const navigate = useNavigate();

    const [lang, setLang] = useState<Language>(getInitialLanguage);
    const t = translations[lang];

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function restoreSession() {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Session check failed: ${response.status}`);
                }

                const body = await response.text();
                const user: BackendUser | null = body ? JSON.parse(body) : null;

                if (isMounted) {
                    setCurrentUser(user ? mapBackendUser(user) : null);
                }
            } catch {
                if (isMounted) {
                    setCurrentUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsAuthLoading(false);
                }
            }
        }

        void restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.title = `iRent | ${t.navbar.brandSubtitle}`;

        try {
            localStorage.setItem('lang', lang);
        } catch {}
    }, [lang, t]);

    const handleSelectListing = () => {};

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Logout failed: ${response.status}`);
            }

            setCurrentUser(null);
            navigate('/');
        } catch {}
    };

    const handleAvatarChanged = useCallback((avatarUrl: string | null) => {
        setCurrentUser((previous) =>
            previous ? { ...previous, avatarUrl } : previous,
        );
    }, []);

    if (isAuthLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p>{translations[lang].homePage.loading}</p>
            </main>
        );
    }

    const isRtl = lang === 'ar';

    return (
        <ChatProvider currentUserId={currentUser?.id} lang={lang}>
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white">
            <Navbar
                lang={lang}
                setLang={setLang}
                currentUser={currentUser}
                handleLogout={handleLogout}
            />

            <ScrollToTop />

            <Routes>
                <Route
                    path="/"
                    element={
                        <HomePage
                            lang={lang}
                            onSelectListing={handleSelectListing}
                            isLoggedIn={currentUser !== null}
                            currentUserId={currentUser?.id}
                        />
                    }
                />

                <Route
                    path="/listings"
                    element={<ListingsPage lang={lang} currentUserId={currentUser?.id} />}
                />

                <Route
                    path="/listings/new"
                    element={
                        currentUser
                            ? <NewListingPage lang={lang} />
                            : <Navigate to="/signin" replace />
                    }
                />

               <Route
                        path="/settings"
                        element={
                            currentUser
                                ? (
                                    <SettingsPage
                                        user={currentUser}
                                        lang={lang}
                                        onEmailChanged={(newEmail: string) => {
                                            setCurrentUser((previous) =>
                                                previous ? { ...previous, email: newEmail } : previous,
                                            );
                                        }}
                                        onUserUpdated={(updatedUser) => {
                                            setCurrentUser((previous) =>
                                                previous
                                                    ? {
                                                        ...previous,
                                                        ...updatedUser,
                                                        fullName: `${updatedUser.firstName ?? previous.firstName} ${updatedUser.lastName ?? previous.lastName}`,
                                                    }
                                                    : previous,
                                            );
                                        }}
                                    />
                                )
                                : <Navigate to="/signin" replace />
                        }
                    />
                            
                <Route
                    path="/chat"
                    element={
                        currentUser
                            ? <Chat lang={lang} />
                            : <Navigate to="/signin" replace />
                    }
                />

                <Route
                    path="/profile"
                    element={
                        currentUser
                            ? (
                                <ProfilePage
                                    user={currentUser}
                                    lang={lang}
                                    onAvatarChanged={handleAvatarChanged}
                                />
                            )
                            : <Navigate to="/signin" replace />
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        currentUser
                            ? <DashboardPage lang={lang} />
                            : <Navigate to="/signin" replace />
                    }
                />


                <Route
                    path="/signin"
                    element={
                        <LoginPage
                            lang={lang}
                            onLoginSuccess={(user) => {
                                setCurrentUser(mapBackendUser(user));
                                navigate('/');
                            }}
                        />
                    }
                />

                <Route
                    path="/signup"
                    element={
                        currentUser ? (
                            <Navigate to="/" replace />
                        ) : (
                            <SignUpPage
                                lang={lang}
                                onRegistrationSuccess={(user) => {
                                    setCurrentUser(mapBackendUser(user));
                                    navigate('/');
                                }}
                            />
                        )
                    }
                />

                <Route
                    path="/privacy"
                    element={<LegalPage lang={lang} kind="privacy" />}
                />

                <Route
                    path="/terms"
                    element={<LegalPage lang={lang} kind="terms" />}
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer lang={lang} />
        </div>
        </ChatProvider>
    );
}

export default App
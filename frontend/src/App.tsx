
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

import type { Language, Listing, User } from './types'
import { translations } from './translations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// User information returned by the backend.
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

// Convert backend user data to the frontend User type.
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

// Supported application languages.
const LANGUAGES: Language[] = ['ar', 'fr', 'en'];

// Restore the saved language or use the browser language.
function getInitialLanguage(): Language {
    try {
        const saved = localStorage.getItem('lang');

        if (saved && LANGUAGES.includes(saved as Language)) {
            return saved as Language;
        }
    } catch {
        // Ignore localStorage errors.
    }

    const browser = navigator.language.slice(0, 2);

    return LANGUAGES.includes(browser as Language)
        ? browser as Language
        : 'en';
}

// Scroll to the top whenever the route changes.
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    const navigate = useNavigate();

    // Application language.
    const [lang, setLang] = useState<Language>(getInitialLanguage);
    const t = translations[lang];

    // Authentication state.
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Restore the user's session when the application starts.
    useEffect(() => {
        let isMounted = true;

        async function restoreSession() {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.status === 401) {
                    // 401 is a normal result for a visitor who is not signed in.
                    if (isMounted) {
                        setCurrentUser(null);
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Session check failed: ${response.status}`);
                }

                const user: BackendUser = await response.json();

                if (isMounted) {
                    setCurrentUser(mapBackendUser(user));
                }
            } catch (error) {
                // The public pages can still work without a restored session.
                // Keep the technical error in the browser console, not in the page.
                console.error('Session restoration failed:', error);

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

    // Keep the language, page direction and title synchronized.
    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.title = `iRent | ${t.navbar.brandSubtitle}`;

        try {
            localStorage.setItem('lang', lang);
        } catch (error) {
            console.warn('Could not save language preference:', error);
        }
    }, [lang, t]);

    // Handle listing selection.
    const handleSelectListing = (listing: Listing) => {
        console.log('Selected listing:', listing);
    };

    // Log out through the backend.
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
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleAvatarChanged = useCallback((avatarUrl: string | null) => {
        setCurrentUser((previous) =>
            previous ? { ...previous, avatarUrl } : previous,
        );
    }, []);

    // Wait until the backend session check finishes.
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
                {/* Your existing home page */}
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

                {/* Your existing listings page */}
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
                            
                {/* Existing placeholder pages */}
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


                {/* Teammate's login implementation */}
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

                {/* Teammate's signup implementation */}
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

                {/* Your existing legal pages */}
                <Route
                    path="/privacy"
                    element={<LegalPage lang={lang} kind="privacy" />}
                />

                <Route
                    path="/terms"
                    element={<LegalPage lang={lang} kind="terms" />}
                />

                {/* Unknown routes return home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer lang={lang} />
        </div>
        </ChatProvider>
    );
}

export default App
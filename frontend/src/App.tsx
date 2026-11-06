
import './App.css'
import './index.css'

import { useState, useEffect } from 'react'
import {
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom'

import { LegalPage } from './Pages/LegalPage'
import { HomePage } from './Pages/HomePage'
import { ListingsPage } from './Pages/ListingsPage'
import { LoginPage } from './Pages/LoginPage'
import { SignUpPage } from './Pages/SignUpPage'

import { Navbar } from './Components/Navbar'
import { Footer } from './Components/Footer'

import type { Language, Listing, User } from './types'
import { translations } from './translations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// User information returned by the backend.
type BackendUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    contact: string;
    gender?: string;
    cin?: string;
};

// Convert backend user data to the frontend User type.
function mapBackendUser(user: BackendUser): User {
    const isEmail = user.contact.includes('@');

    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: isEmail ? user.contact : '',
        phone: isEmail ? '' : user.contact,
        dateOfBirth: user.dateOfBirth,
        cin: user.cin,
    };
}

// Used for pages that are not implemented yet.
function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-black text-(--color-primary)">
                {title}
            </h1>
        </div>
    );
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
    const [authError, setAuthError] = useState('');

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
                console.error('Session restoration failed:', error);

                if (isMounted) {
                    setCurrentUser(null);
                    setAuthError('Could not verify your session.');
                }
            } finally {
                if (isMounted) {
                    setIsAuthLoading(false);
                }
            }
        }

        restoreSession();

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
        setAuthError('');

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
            setAuthError('Could not log out. Please try again.');
        }
    };

    // Wait until the backend session check finishes.
    if (isAuthLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p>Checking your session...</p>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar
                lang={lang}
                setLang={setLang}
                currentUser={currentUser}
                handleLogout={handleLogout}
            />

            {authError && (
                <p
                    role="alert"
                    className="p-3 text-center text-sm text-red-600"
                >
                    {authError}
                </p>
            )}

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
                        />
                    }
                />

                {/* Your existing listings page */}
                <Route
                    path="/listings"
                    element={<ListingsPage lang={lang} />}
                />

                {/* Existing placeholder pages */}
                <Route
                    path="/chat"
                    element={<Placeholder title={t.navbar.chat} />}
                />

                <Route
                    path="/profile"
                    element={<Placeholder title={t.navbar.profile} />}
                />

                {/* Teammate's login implementation */}
                <Route
                    path="/signin"
                    element={
                        <LoginPage
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
                        <SignUpPage
                            onGoToSignIn={() => navigate('/signin')}
                            onRegistrationSuccess={(user) => {
                                setCurrentUser(mapBackendUser(user));
                                navigate('/');
                            }}
                        />
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
    );
}

export default App
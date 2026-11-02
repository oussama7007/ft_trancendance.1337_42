import './App.css'
import './index.css'
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LegalPage } from './Pages/LegalPage'

import { HomePage } from './Pages/HomePage'
import { ListingsPage } from './Pages/ListingsPage'
import { Navbar } from './Components/Navbar'
import { Footer } from './Components/Footer'
import type { Language, Listing, User } from './types'

import { translations } from './translations'

function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-black text-(--color-primary)">{title}</h1>
        </div>
    );
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
    return LANGUAGES.includes(browser as Language) ? (browser as Language) : 'en';
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

    const handleLogout = () => {
        setCurrentUser(null);
        navigate('/');
    };

    const handleSelectListing = (listing: Listing) => {
        console.log('Selected listing:', listing);
    };
    useEffect(() => {
        document.documentElement.lang = lang;          
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.title = `iRent | ${t.navbar.brandSubtitle}`;
    try {
        localStorage.setItem('lang', lang);
    } catch(error){
        console.warn('Could not save language preference:', error);
    }
}, [lang, t]);

    return (
        <div className="min-h-screen bg-white">
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
                        />
                    }
                />
                <Route path="/listings" element={<ListingsPage lang={lang} />} />
                <Route path="/chat" element={<Placeholder title={t.navbar.chat} />} />
                <Route path="/profile" element={<Placeholder title={t.navbar.profile} />} />
                <Route path="/signin" element={<Placeholder title={t.navbar.signIn} />} />

                <Route path="/signup" element={<Placeholder title={t.navbar.signUp} />} />
                <Route path="/privacy" element={<LegalPage lang={lang} kind="privacy" />} />
                <Route path="/terms" element={<LegalPage lang={lang} kind="terms" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer lang={lang} />
        </div>
    );
}

export default App

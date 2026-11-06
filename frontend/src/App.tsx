import './App.css'
import './index.css'
import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import { HomePage } from './Pages/HomePage'
import { ListingsPage } from './Pages/ListingsPage'
import { ProfilePage } from './Pages/ProfilePage'
import { Navbar } from './Components/Navbar'
import { Footer } from './Components/Footer'
import type { Language, Listing, User } from './types'

function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-black text-(--color-primary)">{title}</h1>
        </div>
    );
}

function App() {
    const navigate = useNavigate();

    const [lang, setLang] = useState<Language>('en');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const handleLogout = () => {
        setCurrentUser(null);
        navigate('/');
    };

    const handleSelectListing = (listing: Listing) => {
        console.log('Selected listing:', listing);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar
                lang={lang}
                setLang={setLang}
                currentUser={currentUser}
                handleLogout={handleLogout}
            />

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
                <Route path="/chat" element={<Placeholder title="Chat" />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/signin" element={<Placeholder title="Sign in" />} />
                <Route path="/signup" element={<Placeholder title="Sign up" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer lang={lang} />
        </div>
    );
}

export default App

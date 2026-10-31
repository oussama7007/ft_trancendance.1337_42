import './App.css'
import './index.css'
import { HomePage } from './Pages/HomePage'
import { mockListings } from './Pages/mockListings'
import { Navbar } from './Components/Navbar'
import type { Language, Listing, User } from './types'
import { useEffect, useState } from 'react'
import { Footer } from './Components/Footer';
import { SignUpPage } from './Pages/SignUpPage';
import { LoginPage } from './Pages/LoginPage';

// function App() {
//   return (
//     <div className="min-h-screen bg-white-900 flex items-center justify-center">
//         <HomePage 
//           setActivePage={() => {}}
//           lang='en'
//           // listings={[]}
//           listings={mockListings}
//           onSelectListing={() => {}}
//           isLoggedIn={false}
//           onSearch={() => {}}        
//         />
//     </div>
//   )
// }




const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type BackendUser = {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    contact: string;
    gender?: string;
    cin?: string;
};

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





function App (){
    const [activePage, setActivePage] = useState('home');
    const [lang, setLang] = useState<Language>('en');
    const [currentUser, setCurrentUser] = useState <User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);   

    const [authError, setAuthError] = useState("");


        useEffect(() => {
            let isMounted = true;

            async function restoreSession() {
                try {
                    const response = await fetch(`${API_URL}/auth/me`, {
                        method: "GET",
                        credentials: "include",
                    });

                    // No valid session.
                    if (response.status === 401) {
                        if (isMounted) {
                            setCurrentUser(null);
                        }
                        return;
                    }

                    // Other server errors.
                    if (!response.ok) {
                        throw new Error(`Session check failed: ${response.status}`);
                    }

                    const user: BackendUser = await response.json();

                    if (isMounted) {
                        setCurrentUser(mapBackendUser(user));
                    }
                } catch (error) {
                    console.error("Session restoration failed:", error);

                    if (isMounted) {
                        setCurrentUser(null);
                        setAuthError("Could not verify your session.");
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


        const handleLogout = async () => {
            setAuthError("");

            try {
                const response = await fetch(`${API_URL}/auth/logout`, {
                    method: "POST",
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error(`Logout failed: ${response.status}`);
                }

                setCurrentUser(null);
                setActivePage('home');
            } catch (error) {
                console.error("Logout failed:", error);
                setAuthError("Could not log out. Please try again.");
            }
        };


    const handleSelectListing = (listing: Listing) => {
        console.log('Selected listing:', listing);
    }

    const handleSearch = (query: string) => {
        console.log('Search:', query);
    }

    // rendering page
    const renderPage = () => {
        if ( activePage === 'home')
            return (
                <HomePage 
                    setActivePage={setActivePage}
                    lang={lang}
                    listings={mockListings}
                    onSelectListing={handleSelectListing}
                    isLoggedIn={currentUser !== null}
                    onSearch={handleSearch}
                />
            );
        if (activePage === 'listings'){
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                        Listings
                    </h1>
                </div>
            );
        }
        if (activePage === 'chat') {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                        Chat
                    </h1>
                </div>
            );
        }

        if (activePage === 'profile') {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                        Profile
                    </h1>
                </div>
            );
        }


        if (activePage === 'signin') {
        return (
            <LoginPage
                onLoginSuccess={(user) => {
                    setCurrentUser(mapBackendUser(user));
                    setActivePage('home');
                }}
            />
        );
    }

            if (activePage === 'signup') {
                return (
                    <SignUpPage
                        onGoToSignIn={() => setActivePage('signin')}
                        onRegistrationSuccess={(user) => {
                        setCurrentUser(mapBackendUser(user));
                        setActivePage('home');}}
                    />
                );
            }
        return ( // fallback
            <HomePage 
                setActivePage={setActivePage}
                lang={lang}
                listings={mockListings}
                onSelectListing={handleSelectListing}
                isLoggedIn={currentUser !== null}
                onSearch={handleSearch}
            />
        );
    };
    if (isAuthLoading) {
            return (
                <main className="flex min-h-screen items-center justify-center">
                    <p>Checking your session...</p>
                </main>
            );
        }
    return(
        <div className='min-h-screen bg-white'>
            <Navbar 
                activePage={activePage}
                setActivePage={setActivePage}
                lang={lang}
                setLang={setLang}
                currentUser={currentUser}
                handleLogout={handleLogout}
            />
            {authError && (
                <p role="alert" className="p-3 text-center text-sm text-destructive">
                    {authError}
                </p>
            )}
            {renderPage()}
            <Footer
                lang={lang}
                setActivePage={setActivePage}
            
            
            />
        </div>
        
    )
   
}

export default App
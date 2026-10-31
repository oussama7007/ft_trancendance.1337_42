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
            async function restoreSession() {
                try {
                    const response = await fetch(`${API_URL}/auth/me`, {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        setCurrentUser(null);
                        return;
                    }

                    const user: BackendUser = await response.json();

                    setCurrentUser(mapBackendUser(user));
                } catch (error) {
                    console.error("Session restoration failed:", error);
                    setCurrentUser(null);
                } finally {
                    setIsAuthLoading(false);
                }
            }

            restoreSession();
        }, []);



    const handleLogout = () => {
        setCurrentUser(null);
        setActivePage('home');
    }

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
                    onLoginSuccess={(loggedInUser) => {
                        const isEmail = loggedInUser.contact.includes('@');

                        setCurrentUser({
                            id: loggedInUser.id,
                            firstName: loggedInUser.firstName,
                            lastName: loggedInUser.lastName,
                            fullName: `${loggedInUser.firstName} ${loggedInUser.lastName}`,
                            email: isEmail ? loggedInUser.contact : '',
                            phone: isEmail ? '' : loggedInUser.contact,
                            dateOfBirth: loggedInUser.dateOfBirth,
                        });

                        setActivePage('home');
                    }}
                />
            );
        }

        if (activePage === 'signup') {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                         <SignUpPage />
                    </h1>
                </div>
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
            {renderPage()}
            <Footer
                lang={lang}
                setActivePage={setActivePage}
            
            
            />
        </div>
        
    )
   
}

export default App
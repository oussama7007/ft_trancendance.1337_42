import './App.css'
import './index.css'
import { HomePage } from './Pages/HomePage'
import { mockListings } from './Pages/mockListings'
import { Navbar } from './Components/Navbar'
import type { Language, Listing, User } from './types'
import { useState } from 'react'


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
function App (){
    const [activePage, setActivePage] = useState('home');
    const [lang, setLang] = useState<Language>('en');
    const [currentUser, setCurrentUser] = useState <User | null>(null);

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
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                        Sign in
                    </h1>
                </div>
            );
        }
        if (activePage === 'signup') {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <h1 className="text-3xl font-black text-(--color-primary)">
                        Sign up
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
        </div>
        
    )
   
}

export default App
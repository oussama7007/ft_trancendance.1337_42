import './App.css'
import './index.css'
import { HomePage } from './Pages/HomePage'
import { mockListings } from './Pages/mockListings'


function App() {
  return (
    <div className="min-h-screen bg-white-900 flex items-center justify-center">
        <HomePage 
          setActivePage={() => {}}
          lang='en'
          // listings={[]}
          listings={mockListings}
          onSelectListing={() => {}}
          isLoggedIn={false}
          onSearch={() => {}}        
        />
    </div>
  )
}

export default App
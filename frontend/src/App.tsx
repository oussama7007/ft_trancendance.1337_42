import { useState } from 'react'

import './App.css'

import {Home, Search, User} from 'lucide-react';
import './index.css'
import { HomePage } from './Pages/HomePage'


function App() {
  return (
    <div className="min-h-screen bg-white-900 flex items-center justify-center">
      <h1 className="text-5xl font-bold text-irent-orange">
        {/* Hello iRent */}
        {/* <Home  size={41}/>
        <Search size={32}/>
        <User size={32}/> */}


        <HomePage 
          setActivePage={() => {}}
          lang='ar'
          listings={[]}
          onSelectListing={() => {}}
          isLoggedIn={false}
          onSearch={() => {}}        
        />
      </h1>
    </div>
  )
}

export default App
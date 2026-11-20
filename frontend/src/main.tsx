import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/geist';
import '@fontsource-variable/noto-sans-arabic';


const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const application =(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

createRoot(document.getElementById('root')!).render(
    googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
            {application}
        </GoogleOAuthProvider>
    ) : application,
);
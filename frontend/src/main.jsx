import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Only mount the Google provider when a client ID is configured.
function withGoogle(children) {
  if (!googleClientId) return children
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {withGoogle(
          <AuthModalProvider>
            <App />
          </AuthModalProvider>
        )}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

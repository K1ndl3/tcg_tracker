import { createContext, useCallback, useContext, useState } from 'react'
import AuthModal from '../components/AuthModal'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openAuthModal = useCallback(() => setOpen(true), [])
  const closeAuthModal = useCallback(() => setOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      {open && <AuthModal onClose={closeAuthModal} />}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider')
  return ctx
}

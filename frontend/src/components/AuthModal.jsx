import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function AuthModal({ onClose }) {
  const { login, register, loginWithGoogle } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle(credentialResponse) {
    setError('')
    try {
      await loginWithGoogle(credentialResponse.credential)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">
          {mode === 'login' ? 'Log in' : 'Create your account'}
        </h2>
        <p className="modal-subtitle">
          {mode === 'login'
            ? 'Access your collection and saved data.'
            : 'Save the cards you own and track your collection.'}
        </p>

        {error && <div className="modal-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="field">
              <span>Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ash Ketchum"
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>

          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="divider"><span>or</span></div>
            <div className="google-wrap">
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => setError('Google sign-in failed')}
                useOneTap={false}
              />
            </div>
          </>
        )}

        <p className="switch-mode">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}

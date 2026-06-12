import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import './Layout.css'

function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-trigger" onClick={() => setOpen((o) => !o)}>
        {user.avatarUrl ? (
          <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar-fallback">
            {(user.displayName || user.email)[0]?.toUpperCase()}
          </span>
        )}
        <span className="user-name">{user.displayName || user.email}</span>
        <span className="chevron">▾</span>
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="dropdown-email">{user.email}</div>
          <button className="dropdown-item" onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-left">
          <NavLink to="/" className="brand">TCG Tracker</NavLink>
          <nav className="nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/browse">Browse Cards</NavLink>
            <NavLink to="/collection">My Collection</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
            <NavLink to="/spending">Spending</NavLink>
          </nav>
        </div>
        <div className="topbar-right">
          {user ? (
            <UserMenu />
          ) : (
            <button className="login-btn" onClick={openAuthModal}>Log in</button>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

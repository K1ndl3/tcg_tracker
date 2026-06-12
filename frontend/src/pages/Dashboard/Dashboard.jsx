import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setCards([])
      return
    }
    setLoading(true)
    api
      .listCards()
      .then((data) => setCards(data.cards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome">
          {user
            ? `Welcome back, ${user.displayName || user.email}`
            : 'Browse the Pokémon TCG catalog. Log in to track the cards you own.'}
        </p>
      </header>

      {!user && (
        <section className="panel guest-panel">
          <p>You're browsing as a guest. Anyone can explore cards freely.</p>
          <div className="guest-actions">
            <Link className="btn-primary" to="/browse">Browse cards</Link>
            <button className="btn-secondary" onClick={openAuthModal}>Log in</button>
          </div>
        </section>
      )}

      {user && (
        <section className="stats">
          <div className="stat">
            <span className="stat-value">{cards.length}</span>
            <span className="stat-label">unique cards</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalCards}</span>
            <span className="stat-label">total cards owned</span>
          </div>
        </section>
      )}

      {user && (
        <section className="panel">
          <div className="panel-head">
            <h2>Your collection</h2>
            <Link className="link" to="/collection">View all →</Link>
          </div>
          {loading && <p className="muted">Loading your cards…</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && cards.length === 0 && (
            <p className="muted">
              You don't own any cards yet. Head to <Link to="/browse">Browse Cards</Link> to start.
            </p>
          )}
          {!loading && cards.length > 0 && (
            <ul className="card-list">
              {cards.slice(0, 6).map((c) => (
                <li key={c.id}>
                  {c.image_url && <img className="thumb" src={c.image_url} alt="" loading="lazy" />}
                  <span className="card-name">{c.name}</span>
                  {c.set_name && <span className="card-set">{c.set_name}</span>}
                  <span className="card-qty">×{c.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export default Dashboard

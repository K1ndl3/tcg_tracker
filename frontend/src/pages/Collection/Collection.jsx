import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'
import './Collection.css'

function Collection() {
  const { user, loading: authLoading } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .listCards()
      .then((data) => setCards(data.cards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  async function changeQuantity(card, delta) {
    const newQty = card.quantity + delta
    if (newQty < 1) return remove(card)
    try {
      const { card: updated } = await api.updateCard(card.id, { quantity: newQty })
      setCards((cs) => cs.map((c) => (c.id === card.id ? updated : c)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(card) {
    try {
      await api.deleteCard(card.id)
      setCards((cs) => cs.filter((c) => c.id !== card.id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (authLoading) {
    return <div className="collection"><p className="muted">Loading…</p></div>
  }

  if (!user) {
    return (
      <div className="collection">
        <div className="signin-prompt">
          <h2>Your collection lives here</h2>
          <p className="muted">Log in to view and manage the cards you own.</p>
          <button className="prompt-btn" onClick={openAuthModal}>Log in</button>
        </div>
      </div>
    )
  }

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className="collection">
      <header className="collection-header">
        <h1>My Collection</h1>
        <p className="muted">
          {cards.length} unique {cards.length === 1 ? 'card' : 'cards'} · {totalCards} total
        </p>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading your cards…</p>}

      {!loading && cards.length === 0 && (
        <p className="muted">
          You haven't added any cards yet. Head to <strong>Browse Cards</strong> to start your collection.
        </p>
      )}

      <div className="owned-grid">
        {cards.map((card) => (
          <div className="owned-card" key={card.id}>
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} loading="lazy" />
            ) : (
              <div className="card-noimg">No image</div>
            )}
            <div className="owned-info">
              <div className="owned-name">{card.name}</div>
              {card.set_name && <div className="owned-set">{card.set_name}</div>}
            </div>
            <div className="qty-row">
              <button onClick={() => changeQuantity(card, -1)} aria-label="Decrease">−</button>
              <span className="qty">{card.quantity}</span>
              <button onClick={() => changeQuantity(card, 1)} aria-label="Increase">+</button>
            </div>
            <button className="remove-btn" onClick={() => remove(card)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Collection

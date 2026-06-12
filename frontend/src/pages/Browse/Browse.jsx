import { useEffect, useState, useCallback } from 'react'
import { api, searchPokemonCards } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useAuthModal } from '../../context/AuthModalContext'
import './Browse.css'

function Browse() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [term, setTerm] = useState('')
  const [query, setQuery] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedIds, setAddedIds] = useState({}) // apiCardId -> 'adding' | 'done'

  const load = useCallback(async (q) => {
    setLoading(true)
    setError('')
    try {
      const { cards } = await searchPokemonCards(q)
      setCards(cards)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(query)
  }, [query, load])

  function handleSearch(e) {
    e.preventDefault()
    setQuery(term)
  }

  async function handleAdd(card) {
    if (!user) {
      openAuthModal()
      return
    }
    setAddedIds((m) => ({ ...m, [card.id]: 'adding' }))
    try {
      await api.addCard({
        name: card.name,
        setName: card.set?.name || null,
        cardNumber: card.number || null,
        imageUrl: card.images?.small || null,
        apiCardId: card.id,
        purchasePrice: card.cardmarket?.prices?.averageSellPrice ?? null,
      })
      setAddedIds((m) => ({ ...m, [card.id]: 'done' }))
    } catch (err) {
      setError(err.message)
      setAddedIds((m) => {
        const next = { ...m }
        delete next[card.id]
        return next
      })
    }
  }

  return (
    <div className="browse">
      <header className="browse-header">
        <h1>Browse Cards</h1>
        <p className="muted">
          Search the Pokémon TCG catalog
          {user ? ' and add cards to your collection.' : '. Log in to save cards to your collection.'}
        </p>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name, e.g. Charizard"
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading cards…</p>}

      {!loading && cards.length === 0 && !error && (
        <p className="muted">No cards found. Try a different search.</p>
      )}

      <div className="card-grid">
        {cards.map((card) => {
          const status = addedIds[card.id]
          return (
            <div className="catalog-card" key={card.id}>
              {card.images?.small ? (
                <img src={card.images.small} alt={card.name} loading="lazy" />
              ) : (
                <div className="card-noimg">No image</div>
              )}
              <div className="catalog-info">
                <div className="catalog-name">{card.name}</div>
                <div className="catalog-set">{card.set?.name}</div>
              </div>
              <button
                className="add-btn"
                onClick={() => handleAdd(card)}
                disabled={status === 'adding' || status === 'done'}
              >
                {status === 'done'
                  ? 'Added ✓'
                  : status === 'adding'
                    ? 'Adding…'
                    : user
                      ? 'Add to collection'
                      : 'Log in to add'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Browse

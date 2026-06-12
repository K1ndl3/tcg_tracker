const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Wrapper around fetch that always sends the auth cookie and parses JSON.
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. empty response) — leave data as null.
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  me: () => request('/api/auth/me'),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  loginWithGoogle: (credential) =>
    request('/api/auth/google', { method: 'POST', body: { credential } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  listCards: () => request('/api/cards'),
  addCard: (payload) => request('/api/cards', { method: 'POST', body: payload }),
  updateCard: (id, payload) => request(`/api/cards/${id}`, { method: 'PATCH', body: payload }),
  deleteCard: (id) => request(`/api/cards/${id}`, { method: 'DELETE' }),
};

// Public Pokémon TCG catalog (no auth, no API key needed for light use).
const POKEMON_TCG_URL = 'https://api.pokemontcg.io/v2/cards';

export async function searchPokemonCards(searchText, page = 1) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '24',
    orderBy: 'name',
  });
  const q = searchText?.trim();
  if (q) {
    // Escape quotes so the query syntax stays valid.
    params.set('q', `name:"*${q.replace(/"/g, '')}*"`);
  }
  const res = await fetch(`${POKEMON_TCG_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Could not load Pokémon cards right now. Please try again.');
  }
  const data = await res.json();
  return {
    cards: data.data || [],
    page: data.page,
    totalCount: data.totalCount,
    pageSize: data.pageSize,
  };
}

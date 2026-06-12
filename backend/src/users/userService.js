import { query } from '../db/pool.js';

// Only expose safe fields to the client (never password_hash).
export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [
    email.toLowerCase(),
  ]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function findUserByGoogleSub(sub) {
  const { rows } = await query('SELECT * FROM users WHERE google_sub = $1', [sub]);
  return rows[0] || null;
}

export async function createUser({
  email,
  displayName = null,
  passwordHash = null,
  googleSub = null,
  avatarUrl = null,
}) {
  const { rows } = await query(
    `INSERT INTO users (email, display_name, password_hash, google_sub, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email.toLowerCase(), displayName, passwordHash, googleSub, avatarUrl]
  );
  return rows[0];
}

// Link a Google identity to an existing (email/password) account.
export async function attachGoogleToUser(id, { googleSub, avatarUrl }) {
  const { rows } = await query(
    `UPDATE users
       SET google_sub = COALESCE(google_sub, $2),
           avatar_url = COALESCE(avatar_url, $3)
     WHERE id = $1
     RETURNING *`,
    [id, googleSub, avatarUrl]
  );
  return rows[0];
}

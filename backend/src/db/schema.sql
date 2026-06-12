-- Users: supports both email/password and Google sign-in.
-- password_hash is NULL for accounts that only sign in with Google.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  password_hash TEXT,
  google_sub    TEXT UNIQUE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-account owned cards. This is the foundation for account-tailored data;
-- the collection feature is built on top of this later.
CREATE TABLE IF NOT EXISTS cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  set_name       TEXT,
  card_number    TEXT,
  quantity       INTEGER NOT NULL DEFAULT 1,
  condition      TEXT,
  purchase_price NUMERIC(10, 2),
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reference to the card in the Pokémon TCG API (when added from Browse).
ALTER TABLE cards ADD COLUMN IF NOT EXISTS api_card_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- A user can't have the same API card twice; we bump quantity instead.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_user_api_card
  ON cards(user_id, api_card_id)
  WHERE api_card_id IS NOT NULL;

-- Keep updated_at fresh on any row update.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cards_updated_at ON cards;
CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

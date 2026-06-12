import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();

const CARD_COLUMNS = `id, name, set_name, card_number, quantity, condition,
                      purchase_price, image_url, api_card_id, created_at`;

// Everything here is scoped to the logged-in user.
router.use(requireAuth);

// List the current account's owned cards (empty for new accounts).
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${CARD_COLUMNS}
         FROM cards
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json({ cards: rows });
  } catch (err) {
    next(err);
  }
});

// Add a card to the current account's collection.
// If the same API card was already added, bump its quantity instead.
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      setName = null,
      cardNumber = null,
      quantity = 1,
      condition = null,
      purchasePrice = null,
      imageUrl = null,
      apiCardId = null,
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Card name is required' });
    }
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

    if (apiCardId) {
      const { rows } = await query(
        `INSERT INTO cards
           (user_id, name, set_name, card_number, quantity, condition, purchase_price, image_url, api_card_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, api_card_id) WHERE api_card_id IS NOT NULL
         DO UPDATE SET quantity = cards.quantity + EXCLUDED.quantity
         RETURNING ${CARD_COLUMNS}`,
        [req.userId, name.trim(), setName, cardNumber, qty, condition, purchasePrice, imageUrl, apiCardId]
      );
      return res.status(201).json({ card: rows[0] });
    }

    const { rows } = await query(
      `INSERT INTO cards
         (user_id, name, set_name, card_number, quantity, condition, purchase_price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${CARD_COLUMNS}`,
      [req.userId, name.trim(), setName, cardNumber, qty, condition, purchasePrice, imageUrl]
    );
    res.status(201).json({ card: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Update quantity (and optionally condition) of an owned card.
router.patch('/:id', async (req, res, next) => {
  try {
    const { quantity, condition } = req.body || {};
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }
    const { rows } = await query(
      `UPDATE cards
          SET quantity = COALESCE($3, quantity),
              condition = COALESCE($4, condition)
        WHERE id = $1 AND user_id = $2
        RETURNING ${CARD_COLUMNS}`,
      [req.params.id, req.userId, quantity ?? null, condition ?? null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Card not found' });
    res.json({ card: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Remove a card from the current account's collection.
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

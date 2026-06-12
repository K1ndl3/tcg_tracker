import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from '../auth/tokens.js';
import {
  publicUser,
  findUserByEmail,
  findUserById,
  findUserByGoogleSub,
  createUser,
  attachGoogleToUser,
} from '../users/userService.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleClient = config.googleClientId
  ? new OAuth2Client(config.googleClientId)
  : null;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }
    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      email,
      passwordHash,
      displayName: displayName?.trim() || email.split('@')[0],
    });

    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    // Generic message so we don't leak which emails exist.
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookie(res, signToken(user));
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    if (!googleClient) {
      return res
        .status(501)
        .json({ error: 'Google sign-in is not configured on the server' });
    }
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google account email not verified' });
    }

    const googleSub = payload.sub;
    let user = await findUserByGoogleSub(googleSub);

    if (!user) {
      // Fall back to matching by email so existing accounts get linked.
      const existing = await findUserByEmail(payload.email);
      if (existing) {
        user = await attachGoogleToUser(existing.id, {
          googleSub,
          avatarUrl: payload.picture || null,
        });
      } else {
        user = await createUser({
          email: payload.email,
          displayName: payload.name || payload.email.split('@')[0],
          googleSub,
          avatarUrl: payload.picture || null,
        });
      }
    }

    setAuthCookie(res, signToken(user));
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;

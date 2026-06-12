import jwt from 'jsonwebtoken';
import { config, COOKIE_NAME } from '../config.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

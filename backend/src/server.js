import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import cardRoutes from './routes/cards.js';

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', googleEnabled: Boolean(config.googleClientId) });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
  if (!config.googleClientId) {
    console.log('Google sign-in disabled (set GOOGLE_CLIENT_ID to enable).');
  }
});

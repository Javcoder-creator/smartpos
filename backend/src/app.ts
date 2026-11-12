import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth';

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Rate limiting on /api
app.use('/api', apiRateLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SMARTPOS API is running',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

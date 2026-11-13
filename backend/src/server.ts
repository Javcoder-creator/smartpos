require('dotenv').config();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Attach Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = env.PORT || 5000;

async function start() {
  try {
    const { sequelize } = await import('./database/models');
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // In production or first start, ensure tables and seed exist
    await sequelize.sync({ alter: false });
    const { runSeeds } = await import('./database/seed');
    await runSeeds();
  } catch (err) {
    logger.error('Database connection/sync warning:', err);
  }

  server.listen(PORT, () => {
    logger.info(`🚀 SMARTPOS API running on port ${PORT}`);
    logger.info(`📍 Environment: ${env.NODE_ENV}`);
  });
}

start();

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server, io };

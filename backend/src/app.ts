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
import { branchRoutes } from './modules/branch';
import { categoryRoutes } from './modules/category';
import { brandRoutes } from './modules/brand';
import { productRoutes } from './modules/product';
import { dashboardRoutes } from './modules/dashboard';
import { warehouseRoutes } from './modules/warehouse';
import { inventoryRoutes } from './modules/inventory';
import { supplierRoutes } from './modules/supplier';
import { purchaseRoutes } from './modules/purchase';

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
app.use('/api/branches', branchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

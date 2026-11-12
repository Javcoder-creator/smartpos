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
import { shiftRoutes } from './modules/shift';
import { saleRoutes } from './modules/sale';
import { customerRoutes } from './modules/customer';
import { financeRoutes } from './modules/finance';
import { reportRoutes } from './modules/report';
import { employeeRoutes } from './modules/employee';
import { adminRoutes } from './modules/admin';
import { subscriptionRoutes } from './modules/subscription';
import { paymentGatewayRoutes } from './modules/paymentGateway';

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
app.use('/api/shifts', shiftRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks/payments', paymentGatewayRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

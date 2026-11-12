import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.get('/sales-trend', ReportController.getSalesTrend);
router.get('/top-products', ReportController.getTopProducts);
router.get('/categories', ReportController.getSalesByCategory);
router.get('/cashiers', ReportController.getCashierPerformance);
router.get('/inventory-valuation', ReportController.getInventoryValuation);

export default router;

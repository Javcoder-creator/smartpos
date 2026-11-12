import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', requirePermission('purchases.read'), PurchaseController.list);
router.get('/:id', requirePermission('purchases.read'), PurchaseController.getById);
router.post('/', requirePermission('purchases.create'), PurchaseController.create);
router.post('/:id/receive', requirePermission('purchases.create'), PurchaseController.receive);
router.post('/:id/cancel', requirePermission('purchases.delete'), PurchaseController.cancel);

export default router;

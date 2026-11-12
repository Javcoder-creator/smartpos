import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', requirePermission('suppliers.read'), SupplierController.list);
router.get('/:id', requirePermission('suppliers.read'), SupplierController.getById);
router.post('/', requirePermission('suppliers.create'), SupplierController.create);
router.put('/:id', requirePermission('suppliers.update'), SupplierController.update);
router.post('/:id/payment', requirePermission('finance.manage'), SupplierController.recordPayment);
router.delete('/:id', requirePermission('suppliers.delete'), SupplierController.delete);

export default router;

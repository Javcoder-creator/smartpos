import { Router } from 'express';
import { BrandController } from './brand.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', requirePermission('products.read'), BrandController.list);
router.get('/:id', requirePermission('products.read'), BrandController.getById);
router.post('/', requirePermission('products.create'), BrandController.create);
router.put('/:id', requirePermission('products.update'), BrandController.update);
router.delete('/:id', requirePermission('products.delete'), BrandController.delete);

export default router;

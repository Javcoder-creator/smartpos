import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', requirePermission('products.read'), CategoryController.list);
router.get('/:id', requirePermission('products.read'), CategoryController.getById);
router.post('/', requirePermission('products.create'), CategoryController.create);
router.put('/:id', requirePermission('products.update'), CategoryController.update);
router.delete('/:id', requirePermission('products.delete'), CategoryController.delete);

export default router;

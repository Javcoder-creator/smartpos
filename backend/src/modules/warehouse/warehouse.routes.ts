import { Router } from 'express';
import { WarehouseController } from './warehouse.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', requirePermission('inventory.read'), WarehouseController.list);
router.get('/:id', requirePermission('inventory.read'), WarehouseController.getById);
router.post('/', requirePermission('inventory.adjust'), WarehouseController.create);
router.put('/:id', requirePermission('inventory.adjust'), WarehouseController.update);
router.delete('/:id', requirePermission('inventory.adjust'), WarehouseController.delete);

export default router;

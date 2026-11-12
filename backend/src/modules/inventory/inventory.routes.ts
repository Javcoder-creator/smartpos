import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/balances', requirePermission('inventory.read'), InventoryController.getBalances);
router.get('/movements', requirePermission('inventory.read'), InventoryController.getMovements);
router.post('/transfer', requirePermission('inventory.transfer'), InventoryController.transfer);
router.post('/adjust', requirePermission('inventory.adjust'), InventoryController.adjust);
router.post('/write-off', requirePermission('inventory.adjust'), InventoryController.writeOff);

export default router;

import { Router } from 'express';
import { ShiftController } from './shift.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.get('/current', ShiftController.getCurrent);
router.get('/registers', ShiftController.listRegisters);
router.get('/', ShiftController.list);
router.post('/open', ShiftController.open);
router.get('/:id/summary', ShiftController.getSummary);
router.post('/:id/close', ShiftController.close);
router.post('/:id/cash-movement', ShiftController.recordCashMovement);

export default router;

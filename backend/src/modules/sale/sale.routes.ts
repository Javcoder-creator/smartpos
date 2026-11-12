import { Router } from 'express';
import { SaleController } from './sale.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.post('/checkout', SaleController.checkout);
router.post('/hold', SaleController.hold);
router.get('/held', SaleController.getHeld);
router.post('/:id/resume', SaleController.resume);
router.post('/:id/return', SaleController.return);
router.get('/', SaleController.list);
router.get('/:id', SaleController.getById);

export default router;

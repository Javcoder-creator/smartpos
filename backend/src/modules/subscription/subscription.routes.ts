import { Router } from 'express';
import { SubscriptionController } from './subscription.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);

router.get('/plans', SubscriptionController.getPlans);
router.get('/current', tenantMiddleware, SubscriptionController.getCurrent);
router.post('/upgrade', tenantMiddleware, SubscriptionController.upgrade);

export default router;

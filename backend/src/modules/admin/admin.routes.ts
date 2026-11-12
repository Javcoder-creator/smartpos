import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireSuperAdmin } from '../../middleware/auth';

const router = Router();

// Only Super Admin can access platform admin endpoints
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/stats', AdminController.getStats);
router.get('/businesses', AdminController.listBusinesses);
router.put('/businesses/:id/status', AdminController.toggleStatus);
router.put('/businesses/:id/subscription', AdminController.changeSubscription);
router.get('/plans', AdminController.listPlans);
router.put('/plans/:id', AdminController.updatePlan);

export default router;

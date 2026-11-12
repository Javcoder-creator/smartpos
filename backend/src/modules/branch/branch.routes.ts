import { Router } from 'express';
import { BranchController } from './branch.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/', BranchController.list);
router.get('/:id', BranchController.getById);
router.post('/', authorize('business_owner', 'administrator'), BranchController.create);
router.put('/:id', authorize('business_owner', 'administrator'), BranchController.update);
router.delete('/:id', authorize('business_owner', 'administrator'), BranchController.delete);

export default router;

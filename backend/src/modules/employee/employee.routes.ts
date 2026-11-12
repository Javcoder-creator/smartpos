import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.get('/roles', EmployeeController.listRoles);
router.get('/', EmployeeController.list);
router.post('/', EmployeeController.create);
router.put('/:id', EmployeeController.update);
router.delete('/:id', EmployeeController.delete);

export default router;

import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.get('/summary', FinanceController.getSummary);
router.get('/expenses', FinanceController.listExpenses);
router.post('/expenses', FinanceController.createExpense);
router.delete('/expenses/:id', FinanceController.deleteExpense);
router.post('/customers/:id/debt-payment', FinanceController.recordCustomerDebtPayment);

export default router;

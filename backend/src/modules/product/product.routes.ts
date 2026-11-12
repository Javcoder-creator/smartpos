import { Router } from 'express';
import multer from 'multer';
import { ProductController } from './product.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/authorize';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.use(authenticate, tenantMiddleware);

// Export & Import routes
router.get('/export/excel', requirePermission('products.read'), ProductController.exportExcel);
router.post(
  '/import/excel',
  requirePermission('products.create'),
  upload.single('file'),
  ProductController.importExcel
);

// Barcode scanner lookup route
router.get('/barcode/:barcode', requirePermission('products.read'), ProductController.getByBarcode);

// Standard CRUD
router.get('/', requirePermission('products.read'), ProductController.list);
router.get('/:id', requirePermission('products.read'), ProductController.getById);
router.post('/', requirePermission('products.create'), ProductController.create);
router.put('/:id', requirePermission('products.update'), ProductController.update);
router.delete('/:id', requirePermission('products.delete'), ProductController.delete);

export default router;

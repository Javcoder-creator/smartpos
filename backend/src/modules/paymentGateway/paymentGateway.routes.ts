import { Router, Request, Response } from 'express';
import { PaymeService } from './payme.service';
import { ClickService } from './click.service';
import { FiscalService } from './fiscal.service';

const router = Router();

// Payme JSON-RPC webhook endpoint
router.post('/payme', async (req: Request, res: Response) => {
  const result = await PaymeService.handleRpc(req.body, req.headers.authorization);
  res.json(result);
});

// Click webhook endpoint (form-urlencoded or json)
router.post('/click', async (req: Request, res: Response) => {
  const result = await ClickService.handleWebhook(req.body);
  res.json(result);
});

// Soliq OFD Fiscal receipt query
router.get('/fiscal/:saleId', async (req: Request, res: Response) => {
  const receipt = await FiscalService.buildReceiptPayload(String(req.params.saleId));
  res.json({ success: true, data: receipt });
});

export default router;

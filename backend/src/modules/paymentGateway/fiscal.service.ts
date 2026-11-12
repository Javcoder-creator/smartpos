import { Sale, SaleItem, Product, Business } from '../../database/models';

/**
 * Uzbekistan State Tax Committee (DSQ / Soliq / OFD)
 * Fiscal receipt payload generator with MXIK (IKPU) codes
 */
export class FiscalService {
  /**
   * Build Soliq OFD compliant fiscal receipt JSON
   */
  static async buildReceiptPayload(saleId: string) {
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: Business, as: 'business' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!sale) return null;

    const items = (sale.items || []).map((it) => ({
      name: it.product?.name || 'Mahsulot',
      spic: '02102001001000000', // Default MXIK/IKPU package code in UZ
      packageCode: '796', // dona
      price: Math.round(Number(it.unitPrice) * 100), // in tiyin
      amount: it.quantity,
      vatRate: 12, // 12% QQS (VAT in Uzbekistan)
      discount: Math.round(Number(it.discountAmount || 0) * 100),
      barcode: it.product?.sku || '',
    }));

    return {
      receiptType: 0, // 0 = Sale, 1 = Refund
      fiscalNumber: sale.saleNumber,
      dateTime: sale.completedAt || sale.createdAt,
      total: Math.round(Number(sale.totalAmount) * 100),
      items,
      payments: [
        {
          paymentType: 0, // 0 = Cash, 1 = Card
          amount: Math.round(Number(sale.paidAmount) * 100),
        },
      ],
      qrCodeUrl: `https://ofd.soliq.uz/check?t=${sale.saleNumber}&s=${sale.totalAmount}`,
    };
  }
}

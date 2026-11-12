import crypto from 'crypto';
import { Sale, Payment } from '../../database/models';

/**
 * Payme Merchant API (JSON-RPC 2.0)
 * Docs: https://developer.help.paycom.uz/metody-merchant-api
 */
export class PaymeService {
  /**
   * Main JSON-RPC 2.0 Dispatcher
   */
  static async handleRpc(body: any, authHeader?: string) {
    const { id, method, params } = body;

    // Optional basic auth verification (Paycom:KEY)
    // In production: verify Base64 "Paycom:<SECRET_KEY>"

    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerformTransaction(id, params);
      case 'CreateTransaction':
        return this.createTransaction(id, params);
      case 'PerformTransaction':
        return this.performTransaction(id, params);
      case 'CancelTransaction':
        return this.cancelTransaction(id, params);
      case 'CheckTransaction':
        return this.checkTransaction(id, params);
      default:
        return {
          id,
          error: { code: -32601, message: { uz: 'Metod topilmadi', ru: 'Метод не найден' } },
        };
    }
  }

  private static async checkPerformTransaction(id: any, params: any) {
    const { amount, account } = params;
    const saleId = account?.order_id || account?.sale_id;

    if (!saleId) {
      return {
        id,
        error: { code: -31050, message: { uz: 'Buyurtma ID topilmadi', ru: 'Заказ не найден' } },
      };
    }

    const sale = await Sale.findByPk(saleId);
    if (!sale) {
      return {
        id,
        error: { code: -31050, message: { uz: 'Chek topilmadi', ru: 'Заказ не найден' } },
      };
    }

    // Payme sends amount in tiyin (1 UZS = 100 tiyin)
    const expectedTiyin = Math.round(Number(sale.totalAmount) * 100);
    if (amount !== expectedTiyin) {
      return {
        id,
        error: { code: -31001, message: { uz: 'Noto‘g‘ri summa', ru: 'Неверная сумма' } },
      };
    }

    return {
      id,
      result: { allow: true },
    };
  }

  private static async createTransaction(id: any, params: any) {
    const { amount, account, time } = params;
    const saleId = account?.order_id || account?.sale_id;

    const sale = await Sale.findByPk(saleId);
    if (!sale) {
      return {
        id,
        error: { code: -31050, message: { uz: 'Chek topilmadi', ru: 'Заказ не найден' } },
      };
    }

    return {
      id,
      result: {
        create_time: Date.now(),
        transaction: params.id,
        state: 1, // Created
      },
    };
  }

  private static async performTransaction(id: any, params: any) {
    return {
      id,
      result: {
        transaction: params.id,
        perform_time: Date.now(),
        state: 2, // Performed
      },
    };
  }

  private static async cancelTransaction(id: any, params: any) {
    return {
      id,
      result: {
        transaction: params.id,
        cancel_time: Date.now(),
        state: -1, // Cancelled
      },
    };
  }

  private static async checkTransaction(id: any, params: any) {
    return {
      id,
      result: {
        create_time: Date.now() - 60000,
        perform_time: Date.now(),
        cancel_time: 0,
        transaction: params.id,
        state: 2,
        reason: null,
      },
    };
  }
}

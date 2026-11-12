import crypto from 'crypto';
import { Sale } from '../../database/models';

/**
 * Click Merchant API
 * Docs: https://docs.click.uz/merchant-api/
 */
export class ClickService {
  private static readonly SECRET_KEY = process.env.CLICK_SECRET_KEY || 'click_test_secret';

  /**
   * Main Click Handler: Action 0 (Prepare) & Action 1 (Complete)
   */
  static async handleWebhook(data: any) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string,
    } = data;

    // Verify MD5 signature
    const checkString = `${click_trans_id}${service_id}${this.SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`;
    const calculatedHash = crypto.createHash('md5').update(checkString).digest('hex');

    if (sign_string !== calculatedHash) {
      return {
        error: -1,
        error_note: 'SIGN CHECK FAILED',
      };
    }

    // Check order / sale exists
    const sale = await Sale.findByPk(merchant_trans_id);
    if (!sale) {
      return {
        error: -5,
        error_note: 'User / Order does not exist',
      };
    }

    // Check Amount
    if (Math.abs(Number(sale.totalAmount) - Number(amount)) > 0.01) {
      return {
        error: -2,
        error_note: 'Incorrect amount',
      };
    }

    // Action 0: Prepare
    if (Number(action) === 0) {
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: click_trans_id,
        error: 0,
        error_note: 'Success',
      };
    }

    // Action 1: Complete
    if (Number(action) === 1) {
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: click_trans_id,
        error: 0,
        error_note: 'Success',
      };
    }

    return {
      error: -3,
      error_note: 'Action not found',
    };
  }
}

import { createPayment } from '../services/finikService.js';
import { markDealPaid } from '../services/bitrixService.js';
import { getPaymentUrlById } from '../services/getPaymentUrlById.js';
const FINIK_API_URL = process.env.FINIK_API_URL;
export async function handleCheckout(req, res) {
  try {
    const { BX_SYSTEM_PARAMS, FINIK_KEY, FINIK_ACCOUNT_ID } = req.body;

    if (!BX_SYSTEM_PARAMS || !FINIK_API_URL || !FINIK_KEY || !FINIK_ACCOUNT_ID) {
      return res.status(400).json({
        PAYMENT_ERRORS: ['Недостаточно параметров для создания оплаты']
      });
    }

    const { PAYMENT_ID, SUM, EXTERNAL_PAYMENT_ID } = BX_SYSTEM_PARAMS;

    const finikConfig = {
      apiUrl: FINIK_API_URL,
      apiKey: FINIK_KEY,
      accountId: FINIK_ACCOUNT_ID,
      callbackBaseUrl: process.env.CALLBACK_BASE_URL // всё ещё можно оставить из .env
    };
    if (EXTERNAL_PAYMENT_ID) {
      const { PAYMENT_URL } = await getPaymentUrlById(EXTERNAL_PAYMENT_ID, finikConfig);
      return res.json({
        PAYMENT_ID: EXTERNAL_PAYMENT_ID,
        PAYMENT_URL
      });
    }

    const { PAYMENT_ID: id, PAYMENT_URL } = await createPayment(PAYMENT_ID, parseFloat(SUM), finikConfig);
    return res.json({ PAYMENT_ID: id, PAYMENT_URL });

  } catch (err) {
    console.error('Ошибка:', err);
    return res.status(500).json({
      PAYMENT_ERRORS: [`Ошибка создания оплаты: ${err.message}`]
    });
  }
}


export async function getQrPage(req, res) {
  const { ORDER, SUM } = req.query;
  if (!ORDER || !SUM) {
    return res.status(400).send('ORDER and SUM query parameters are required');
  }

  try {
    // createPayment отдаёт { PAYMENT_ID, PAYMENT_URL }
    const { PAYMENT_URL } = await createPayment(ORDER, parseFloat(SUM));
    return res.redirect(PAYMENT_URL);
  } catch (err) {
    console.error('QR redirect error:', err);
    return res.status(500).send('Ошибка перенаправления на страницу оплаты');
  }
}

export async function handleNotify(req, res) {
  console.log('Finik webhook payload:', JSON.stringify(req.body, null, 2));

  const { status, requestId } = req.body;

  if (status === 'PAID' && requestId) {
    const parts = requestId.split('-');
    const orderPaymentId = parts[1];

    if (orderPaymentId) {
      try {
        await markDealPaid(orderPaymentId);
        console.log(`Оплата подтверждена для сделки ${orderPaymentId}`);
      } catch (e) {
        console.error(`Ошибка при обновлении статуса сделки ${orderPaymentId}:`, e);
      }
    } else {
      console.warn('Не удалось извлечь orderPaymentId из requestId:', requestId);
    }
  }

  return res.json({ code: 0 });
}


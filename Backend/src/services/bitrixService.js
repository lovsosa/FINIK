// src/services/bitrixService.js
import axios from 'axios';

const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;

/**
 * Переводит сделку в стадию WON
 */
export async function markDealPaid(orderId) {
  await axios.post(
    `${BITRIX_WEBHOOK_URL}crm.deal.update`,
    { id: orderId, fields: { STAGE_ID: 'WON' } }
  );
}

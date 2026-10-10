import axiosClient from '@/api/axiosClient';

/**
 * Payment API calls.
 *
 * Route mount: /api/payments (verified from backend app.js).
 * Both endpoints require authentication (paymentRoutes uses auth.protect).
 *
 * ── Verified request / response shapes ──────────────────────────
 *
 * POST /api/payments/create-order
 *   Request:  { campaign: <ObjectId string>, amount: <Number> }
 *   Response: { status, data: { order: <Razorpay order>, donationId } }
 *
 * POST /api/payments/verify-payment
 *   Request:  { order_id, payment_id, signature }
 *   Response: { status, message, data: { donation } }
 *
 * NOTE: verify-payment sets donation.status = 'captured' AND
 * increments campaign.amountRaised synchronously — the webhook
 * is a redundant/backup path, not the sole source of truth.
 */

/**
 * Create a Razorpay order for a fundraising donation.
 *
 * @param {string} campaignId — the campaign's MongoDB _id (NOT slug).
 * @param {number} amount — donation amount in INR (whole rupees).
 * @returns {{ status, data: { order, donationId } }}
 */
export function createOrder(campaignId, amount) {
  return axiosClient
    .post('/payments/create-order', { campaign: campaignId, amount })
    .then((res) => res.data);
}

/**
 * Verify a Razorpay payment after checkout completes.
 *
 * @param {{ order_id: string, payment_id: string, signature: string }} paymentData
 * @returns {{ status, message, data: { donation } }}
 */
export function verifyPayment(paymentData) {
  return axiosClient
    .post('/payments/verify-payment', paymentData)
    .then((res) => res.data);
}

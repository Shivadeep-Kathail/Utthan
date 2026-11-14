import axiosClient from '@/api/axiosClient';

/**
 * Goods Donation API calls.
 *
 * Route mount: /api/goods-donations (verified from backend app.js line 111).
 * All endpoints require authentication (goodsDonationRoutes uses auth.protect).
 *
 * ── Verified request / response shapes ──────────────────────────
 *
 * POST /api/goods-donations/campaigns/:slug   (create pledge)
 *   Request:  { address: string, items: [{ item: string, quantity: number }], preferredCollectionDate: string }
 *   Response: { status, data: { donation } }
 *
 * PATCH /api/goods-donations/:id              (update pledge)
 *   Request:  { address?, items?, preferredCollectionDate? }  — all optional
 *   Response: { status, data: { donation } }
 *   Constraint: only own pledge, only status === 'pledged', campaign must be 'active'
 *
 * PATCH /api/goods-donations/:id/cancel       (cancel pledge)
 *   Request:  (no body)
 *   Response: { status, data: { donation } }
 *   Constraint: only own pledge, only status === 'pledged'
 *
 * PATCH /api/goods-donations/:id/collect      (mark collected)
 *   Request:  (no body)
 *   Response: { status, data: { donation } }
 *   Constraint: campaign-creator only. Increments campaign item.received.
 *
 * GET /api/goods-donations/campaigns/:slug    (list campaign pledges)
 *   Response: { status, results, data: { donations } }
 *   Constraint: campaign-creator or admin only
 *
 * GET /api/goods-donations/my                 (list own pledges)
 *   Response: { status, results, data: { donations } }
 *
 * ── Quantity validation (backend mirror) ─────────────────────────
 *   remaining = item.needed - item.received - totalPledgedByOthers
 *   Frontend should validate against (item.needed - item.received) as the conservative max.
 */

/**
 * Create a goods-donation pledge for a campaign.
 *
 * @param {string} slug — campaign slug
 * @param {{ address: string, items: Array<{ item: string, quantity: number }>, preferredCollectionDate: string }} data
 * @returns {{ status, data: { donation } }}
 */
export function pledgeGoods(slug, data) {
  return axiosClient
    .post(`/goods-donations/campaigns/${slug}`, data)
    .then((res) => res.data);
}

/**
 * Update an existing goods-donation pledge.
 *
 * @param {string} id — donation _id
 * @param {{ address?, items?, preferredCollectionDate? }} data
 * @returns {{ status, data: { donation } }}
 */
export function updatePledge(id, data) {
  return axiosClient
    .patch(`/goods-donations/${id}`, data)
    .then((res) => res.data);
}

/**
 * Cancel a goods-donation pledge.
 *
 * @param {string} id — donation _id
 * @returns {{ status, data: { donation } }}
 */
export function cancelPledge(id) {
  return axiosClient
    .patch(`/goods-donations/${id}/cancel`)
    .then((res) => res.data);
}

/**
 * Mark a goods-donation pledge as collected (campaign-creator only).
 * This increments campaign item.received for each pledged item.
 *
 * @param {string} id — donation _id
 * @returns {{ status, data: { donation } }}
 */
export function markCollected(id) {
  return axiosClient
    .patch(`/goods-donations/${id}/collect`)
    .then((res) => res.data);
}

/**
 * Get all pledges for a campaign (campaign-creator or admin only).
 *
 * @param {string} slug — campaign slug
 * @returns {{ status, results, data: { donations } }}
 */
export function getCampaignPledges(slug) {
  return axiosClient
    .get(`/goods-donations/campaigns/${slug}`)
    .then((res) => res.data);
}

/**
 * Get the current user's own pledges.
 *
 * @returns {{ status, results, data: { donations } }}
 */
export function getMyPledges() {
  return axiosClient
    .get('/goods-donations/my')
    .then((res) => res.data);
}


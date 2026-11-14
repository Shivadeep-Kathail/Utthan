import axiosClient from '@/api/axiosClient';

/**
 * Donation API calls.
 *
 * Route mount: /api/donations (verified from backend app.js line 107).
 * All endpoints require authentication (donationRoutes uses auth.protect).
 *
 * ── Verified request / response shapes ──────────────────────────
 *
 * GET /api/donations/me   (list own monetary donations)
 *   Response: { status, results, data: { donations } }
 *   Each donation: { _id, amount, currency, status, createdAt,
 *     campaign: { _id, title, slug } | null }
 *   Status enum: 'created' | 'captured' | 'failed' | 'refunded'
 */

/**
 * Get the current user's own monetary donations.
 *
 * @returns {Promise<{ status: string, results: number, data: { donations: Array } }>}
 */
export function getMyDonations() {
  return axiosClient.get('/donations/me').then((res) => res.data);
}


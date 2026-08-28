import axiosClient from '@/api/axiosClient';

/**
 * Campaign API calls.
 *
 * Route mount: /api/campaign (singular — verified from backend app.js).
 * Convention: every function returns the parsed JSON body (response.data).
 *
 * Query params supported by the backend (via ApiFeatures):
 *   type, category     — direct equality filters
 *   sort               — comma-separated, `-` prefix for desc (default: -createdAt)
 *   fields             — comma-separated field selection
 *   page               — 1-indexed (default: 1)
 *   limit              — items per page, clamped to [1, 100] (default: 25)
 *   [field][gte|gt|lte|lt] — comparison operators
 */

// ── Public (no auth required) ──────────────────────────────────

/**
 * List campaigns (public). Backend already scopes to active + closed,
 * non-deleted campaigns — no status filter needed from the frontend.
 */
export function getCampaigns(params = {}) {
  return axiosClient
    .get('/campaign', { params })
    .then((res) => res.data);
}

/**
 * Get a single campaign by slug (public).
 * Backend populates creator with name + email.
 */
export function getCampaignBySlug(slug) {
  return axiosClient
    .get(`/campaign/${slug}`)
    .then((res) => res.data);
}

// ── Protected (require auth cookie) ────────────────────────────

/**
 * Create a new campaign.
 * Backend sets creator from the cookie and defaults status to 'pending'.
 */
export function createCampaign(data) {
  return axiosClient
    .post('/campaign', data)
    .then((res) => res.data);
}

/**
 * Upload a single image file.
 *
 * Uses multipart/form-data — the Content-Type header is explicitly
 * set to undefined so the browser auto-generates the correct
 * multipart boundary. axiosClient defaults to application/json
 * which would break file uploads.
 *
 * Returns: { status, data: { url: 'http://...' } }
 */
export function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  return axiosClient
    .post('/upload', formData, {
      headers: { 'Content-Type': undefined },
    })
    .then((res) => res.data);
}

import axios from 'axios';
import { normalizeError } from '@/utils/apiError';

/**
 * Configured Axios instance for all API requests.
 *
 * Auth contract:
 * - Backend uses httpOnly `jwt` cookie — never a bearer token.
 * - `withCredentials: true` sends cookies on every request.
 * - No localStorage/sessionStorage for tokens, no Authorization header.
 *
 * Future API modules (auth.api.js, campaigns.api.js, etc.) should import
 * this client rather than creating their own Axios instance.
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor — normalize all errors into ApiError instances.
 *
 * 401 handling strategy:
 * - Does NOT auto-redirect to /login (that's AuthContext's job in Phase 2).
 * - Attaches `requestUrl` to the error so Phase 2 can distinguish
 *   hydration calls (e.g. `/users/me` returning 401 = "not logged in")
 *   from real protected-route failures that should redirect.
 * - This prevents redirect loops.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normalizeError(error);
    return Promise.reject(apiError);
  },
);

export default axiosClient;

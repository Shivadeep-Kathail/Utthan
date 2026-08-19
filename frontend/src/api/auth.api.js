import axiosClient from '@/api/axiosClient';

/**
 * Auth & user API calls.
 *
 * Convention: every function returns the parsed JSON body (response.data).
 * Token-bearing responses (signup, login, updatePassword, resetPassword)
 * include a `token` field — callers must NEVER store, log, or assign it.
 * The httpOnly cookie is the sole auth mechanism; the token field is
 * a server-side artifact we intentionally discard.
 */

// ── Public auth ────────────────────────────────────────────────

export function signup({ name, email, password, passwordConfirm }) {
  return axiosClient
    .post('/users/signup', { name, email, password, passwordConfirm })
    .then((res) => res.data);
}

export function login({ email, password }) {
  return axiosClient
    .post('/users/login', { email, password })
    .then((res) => res.data);
}

export function logout() {
  return axiosClient.post('/users/logout').then((res) => res.data);
}

export function forgotPassword({ email }) {
  return axiosClient
    .post('/users/forgotPassword', { email })
    .then((res) => res.data);
}

export function resetPassword(token, { password, passwordConfirm }) {
  return axiosClient
    .patch(`/users/resetPassword/${token}`, { password, passwordConfirm })
    .then((res) => res.data);
}

// ── Protected (require cookie) ─────────────────────────────────

export function getMe() {
  return axiosClient.get('/users/me').then((res) => res.data);
}

export function updateMe(fields) {
  return axiosClient.patch('/users/updateMe', fields).then((res) => res.data);
}

export function updatePassword({ passwordCurrent, password, passwordConfirm }) {
  return axiosClient
    .patch('/users/updatePassword', { passwordCurrent, password, passwordConfirm })
    .then((res) => res.data);
}

export function deleteMe() {
  return axiosClient.delete('/users/deleteMe');
}

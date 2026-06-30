// Now pointing at the real backend on the VPS (api.tryride.ng) — no more local
// ngrok tunnel needed. TODO: read this from app config instead of hardcoding
// once we have separate dev/staging/prod environments.
export const API_BASE_URL = 'https://api.tryride.ng';

export const API_HEADERS = {
  'Content-Type': 'application/json',
};

// Merges the session token into headers — every authenticated endpoint now
// requires it (see backend UserJwtGuard). Pass the token from useAuth().
export function authHeaders(token: string | null) {
  return { ...API_HEADERS, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// Now pointing at the real backend on the VPS (api.tryride.ng) — no more local
// ngrok tunnel needed. TODO: read this from app config instead of hardcoding
// once we have separate dev/staging/prod environments.
export const API_BASE_URL = 'https://api.tryride.ng';

export const API_HEADERS = {
  'Content-Type': 'application/json',
};

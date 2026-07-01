// Every browser-based origin that legitimately calls this API — shared
// between the REST CORS config (main.ts) and the WebSocket gateway
// (dispatch.gateway.ts) so the two never drift out of sync. Mobile apps
// aren't affected by CORS at all, so they don't need an entry here.
export const ALLOWED_ORIGINS = [
  'https://tryride.ng',
  'https://www.tryride.ng',
  'https://admin.tryride.ng',
  'https://novapath.ng',
  'https://www.novapath.ng',
  // Local development against the deployed API.
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:4321',
  'http://localhost:4322',
];

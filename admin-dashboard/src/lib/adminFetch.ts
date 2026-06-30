const TOKEN_KEY = 'try_admin_token';

// Drop-in replacement for fetch() that attaches the admin's bearer token and
// bounces to login on a 401 (expired/invalid session) instead of leaving
// every page to silently fail. Pages should always call this, never raw fetch,
// for anything under /admin/*.
export async function adminFetch(input: string, init: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event('admin-unauthorized'));
  }

  return res;
}

// Where the API lives. NEXT_PUBLIC_API_URL is usually http://localhost:5100.
// "localhost" means "this very computer", so when the site is opened from another address (your IP, or a phone on
// the same Wi-Fi, e.g. http://172.50.254.28:3100) a localhost API URL would point at the visitor's own machine.
// In that case swap in the host the page was opened from, keeping the API's port.
const LOCAL = ['localhost', '127.0.0.1', '[::1]'];

export const API = (() => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100';
  if (typeof window === 'undefined') return base;
  try {
    const url = new URL(base);
    if (LOCAL.includes(url.hostname) && !LOCAL.includes(window.location.hostname)) url.hostname = window.location.hostname;
    return url.origin;
  } catch { return base; }
})();

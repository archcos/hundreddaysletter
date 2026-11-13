'use client';

import { API } from '../api-base';
export { API };

// Login is kept for this browser tab only (sessionStorage), and cleared on logout or a 401.
const KEY = 'letters-admin-auth';
export const session = {
  get: () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } },
  set: v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch {} },
};

// HTTP Basic credentials, UTF-8 safe.
export const basicAuth = (user, pass) => btoa(String.fromCharCode(...new TextEncoder().encode(`${user}:${pass}`)));

export function makeApi(auth, onUnauthorized) {
  return async (path, { method = 'GET', body } = {}) => {
    let res;
    try {
      res = await fetch(`${API}/api/admin/${path}`, {
        method,
        headers: { Authorization: `Basic ${auth}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch { throw new Error('Could not reach the server.'); }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) onUnauthorized?.();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };
}

export const FLAG_LABELS = {
  'personal-info': 'Personal info', code: 'Code / script', 'hidden-link': 'Hidden link', garbled: 'Garbled text',
  threat: 'Possible threat', 'self-harm': 'Self-harm', spam: 'Spam-like',
};
export const REASON_LABELS = { spam: 'Spam', abuse: 'Abusive', personal: 'Personal info', danger: 'Dangerous', other: 'Other' };

export const LIFE = 100;
export const ageText = days => {
  const d = Number(days);
  return d < 1 / 24 ? 'just now' : d < 1 ? `${Math.floor(d * 24)}h ago` : `${Math.floor(d)}d ago`;
};
export const since = date => ageText((Date.now() - new Date(date).getTime()) / 864e5);

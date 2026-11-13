'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';
const KEY = 'letters-admin-token';
const store = { get: () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } },
                set: v => { try { sessionStorage.setItem(KEY, v); } catch {} } };

export default function Admin() {
  const [token, setToken] = useState('');
  const [letters, setLetters] = useState(null);
  const [error, setError] = useState('');

  const call = (path, opts = {}, t = token) =>
    fetch(`${API}/api/admin/letters${path}`, { ...opts, headers: { Authorization: `Bearer ${t}` } })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });

  const load = async (t = token) => {
    setError('');
    try { setLetters(await call('', {}, t)); store.set(t); }
    catch (e) { setLetters(null); setError(e.message === 'Failed to fetch' ? 'Could not reach the server.' : e.message); }
  };

  useEffect(() => { const t = store.get(); if (t) { setToken(t); load(t); } }, []);

  const remove = async id => {
    if (!confirm('Delete this letter for good?')) return;
    try { await call(`/${id}`, { method: 'DELETE' }); setLetters(ls => ls.filter(l => l.id !== id)); }
    catch (e) { setError(e.message); }
  };

  return (
    <main className="admin">
      <h1>Letters admin</h1>
      <form onSubmit={e => { e.preventDefault(); load(); }} className="row" style={{ justifyContent: 'flex-start' }}>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Admin password" aria-label="Admin password" style={{ maxWidth: 320 }} />
        <button className="btn">Open</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {letters && (
        <table>
          <thead><tr><th>Reports</th><th>Letter</th><th>Age</th><th></th></tr></thead>
          <tbody>
            {letters.map(l => (
              <tr key={l.id} className={l.reports >= 3 ? 'flagged' : ''}>
                <td>{l.reports}{l.reports >= 3 ? ' (hidden)' : ''}</td>
                <td className="body">{l.body}<br /><em>— {l.name || 'anonymous'}</em></td>
                <td>{Math.floor(Number(l.age_days))}d</td>
                <td><button className="link" onClick={() => remove(l.id)}>Delete</button></td>
              </tr>
            ))}
            {!letters.length && <tr><td colSpan={4}>No letters yet.</td></tr>}
          </tbody>
        </table>
      )}
    </main>
  );
}

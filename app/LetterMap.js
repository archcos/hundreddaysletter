'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';
const LIFE = 100;

// Fresh letters are deep wax-red; they fade to pale paper as they age.
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => {
  const x = parseInt(a.slice(i, i + 2), 16), y = parseInt(b.slice(i, i + 2), 16);
  return Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
}).join('');
const fadeOf = age => Math.min(Math.max(age / LIFE, 0), 1);
const style = age => {
  const t = fadeOf(age);
  return { bubblingMouseEvents: false, radius: 7, weight: 1.5, color: mix('#5c1810', '#a8956f', t), fillColor: mix('#a8321f', '#e8dcc0', t), fillOpacity: 1 - t * 0.6, opacity: 1 - t * 0.5 };
};

export default function LetterMap() {
  const el = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const draftRef = useRef(null);
  const [open, setOpen] = useState(null);   // letter being read
  const [draft, setDraft] = useState(null); // { lat, lng } being written to

  const addMarker = letter =>
    L.circleMarker([letter.lat, letter.lng], style(Number(letter.age_days)))
      .on('click', () => { setDraft(null); setOpen(letter); })
      .addTo(layerRef.current);

  useEffect(() => {
    const map = L.map(el.current, { worldCopyJump: true, preferCanvas: true, minZoom: 2, zoomControl: false }).setView([20, 10], 2);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    // ponytail: OSM's free tiles are for light traffic; switch to MapTiler/Stadia (free tiers) before a big launch
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    let controller;
    const load = async () => {
      controller?.abort(); controller = new AbortController();
      const b = map.getBounds();
      const q = new URLSearchParams({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
      try {
        const res = await fetch(`${API}/api/letters?${q}`, { signal: controller.signal });
        const letters = await res.json();
        layerRef.current.clearLayers();
        letters.forEach(addMarker);
      } catch (e) { if (e.name !== 'AbortError') console.error(e); }
    };
    map.on('moveend', load);
    map.on('click', e => { setOpen(null); setDraft(e.latlng.wrap()); });
    load();
    return () => { controller?.abort(); map.remove(); };
  }, []);

  // Show a dashed ring where the new letter will go.
  useEffect(() => {
    draftRef.current?.remove();
    if (draft) draftRef.current = L.circleMarker(draft, { radius: 10, color: '#8e2a1f', weight: 2, dashArray: '4 4', fill: false }).addTo(mapRef.current);
  }, [draft]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setOpen(null); setDraft(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSent = letter => { addMarker(letter); setDraft(null); setOpen(letter); };

  return (
    <>
      <div ref={el} className="map" />
      <header className="title card">
        <h1>Hundred Day Letters</h1>
        <p>Click anywhere on Earth to leave a letter. Every letter fades and disappears after 100 days.</p>
      </header>
      {draft && <WriteLetter key={`${draft.lat},${draft.lng}`} at={draft} onSent={onSent} onClose={() => setDraft(null)} />}
      {open && <ReadLetter key={open.id} letter={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function WriteLetter({ at, onSent, onClose }) {
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API}/api/letters`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, name, lat: at.lat, lng: at.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send.');
      onSent(data);
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message); }
    finally { setBusy(false); }
  };

  return (
    <section className="panel card" role="dialog" aria-label="Write a letter">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h2>A letter to this place</h2>
      <form onSubmit={send}>
        <textarea autoFocus value={body} onChange={e => setBody(e.target.value)} maxLength={500}
          placeholder="Dear…" aria-label="Your letter" />
        <label htmlFor="sig">Sign it (optional)</label>
        <input id="sig" type="text" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="anonymous" />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <span className="count">{body.length}/500 · no links</span>
          <button className="btn" disabled={busy || !body.trim()}>{busy ? 'Sending…' : 'Leave letter'}</button>
        </div>
      </form>
    </section>
  );
}

function ReadLetter({ letter, onClose }) {
  const [reported, setReported] = useState(false);
  const age = Number(letter.age_days);
  const daysLeft = Math.max(0, Math.ceil(LIFE - age));
  const written = age < 1 ? 'today' : `${Math.floor(age)} day${Math.floor(age) === 1 ? '' : 's'} ago`;

  const report = async () => {
    setReported(true);
    await fetch(`${API}/api/letters/${letter.id}/report`, { method: 'POST' }).catch(() => {});
  };

  return (
    <section className="panel card" role="dialog" aria-label="Letter" style={{ opacity: 1 - fadeOf(age) * 0.35 }}>
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <p className="letter-body">{letter.body}</p>
      <p className="sign">— {letter.name || 'anonymous'}</p>
      <div className="meta">
        <span>Written {written} · fades in {daysLeft} day{daysLeft === 1 ? '' : 's'}</span>
        {reported ? <span>Reported. Thanks.</span> : <button className="link" onClick={report}>Report</button>}
      </div>
    </section>
  );
}

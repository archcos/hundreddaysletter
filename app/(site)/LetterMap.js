'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { Copy, RotateCcw } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { parseCoords, formatCoords } from './coords';
import { LANDMARKS } from './landmarks';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100';
const LIFE = 100;
const THEMES = { paper: '📜 Paper', night: '🌙 Night', clear: '☀️ Clear' };
const THEME_KEY = 'letters-theme';
const readTheme = () => {
  try { const t = localStorage.getItem(THEME_KEY); if (THEMES[t]) return t; } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'paper';
};

const fadeOf = age => Math.min(Math.max(age / LIFE, 0), 1);

// Which letters this browser has read: { [id]: time the letter fades (ms) }. Faded ones are dropped on load.
const READ_KEY = 'letters-read';
const loadRead = () => {
  try {
    const now = Date.now();
    return Object.fromEntries(Object.entries(JSON.parse(localStorage.getItem(READ_KEY)) || {}).filter(([, exp]) => exp > now));
  } catch { return {}; }
};
const saveRead = read => { try { localStorage.setItem(READ_KEY, JSON.stringify(read)); } catch {} };

// Closest landmark within 300 km, if any.
const nearest = (lat, lng) => {
  let best = null, bestD = 300e3;
  for (const p of LANDMARKS) { const d = L.latLng(lat, lng).distanceTo([p.lat, p.lng]); if (d < bestD) { best = p; bestD = d; } }
  return best;
};
const placeName = (lat, lng) => {
  const p = nearest(lat, lng);
  return p ? `${p.emoji} Near ${p.name}` : `📍 ${lat.toFixed(1)}, ${lng.toFixed(1)}`;
};

// Travel animation: which vehicle carries you there, by distance. All three are drawn from ABOVE, nose pointing up,
// and rotated toward the destination. Plane: Material Icons "flight" path (Apache 2.0). Ship and bus: drawn here.
// ponytail: distance only, so a ship can "sail" over land (e.g. Paris to Rome); add a land/sea check if that bothers people
const vehicleFor = meters => (meters < 20e3 ? null : meters < 300e3 ? 'bus' : meters < 1200e3 ? 'ship' : 'plane');
const TRAVEL = {
  bus: {
    verb: 'Riding', seconds: 2.2, viewBox: '0 0 24 24',
    art: (<>
      <rect x="5.4" y="4.2" width="1.6" height="1.4" rx=".4" fill="#2b2118" />{/* mirrors */}
      <rect x="17" y="4.2" width="1.6" height="1.4" rx=".4" fill="#2b2118" />
      <rect x="7" y="1.5" width="10" height="21" rx="2.2" fill="#e3a72b" />{/* roof */}
      <rect x="8" y="2.4" width="8" height="3.2" rx="1.2" fill="#2d3e52" stroke="none" />{/* windscreen */}
      <rect x="9.3" y="9.5" width="5.4" height="4.5" rx=".6" fill="#c98d1c" stroke="none" />{/* roof hatch */}
      <rect x="8.6" y="20" width="6.8" height="1.4" rx=".5" fill="#2d3e52" stroke="none" />{/* rear window */}
      <path d="M8 7.3h8M8 17h8" stroke="#c98d1c" strokeWidth=".6" />
    </>),
  },
  ship: {
    verb: 'Sailing', seconds: 3, viewBox: '0 0 24 30',
    art: (<>
      <path d="M9.5 22.5 5 29.5M14.5 22.5 19 29.5M12 23v6" stroke="#fff" strokeOpacity=".75" strokeWidth=".9" strokeLinecap="round" fill="none" />{/* wake */}
      <path d="M12 1c3.4 2.8 5 6.6 5 10.6v9.2c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-9.2C7 7.6 8.6 3.8 12 1z" fill="#f6f2ea" />{/* hull */}
      <path d="M12 3.2c2.3 2.1 3.4 5 3.5 8.3H8.5c.1-3.3 1.2-6.2 3.5-8.3z" fill="#d9d2c3" stroke="none" />{/* bow deck */}
      <rect x="8.8" y="11.5" width="6.4" height="7.5" rx="1" fill="#2f56b0" />{/* cabin */}
      <rect x="9.6" y="12.3" width="4.8" height="1.3" rx=".4" fill="#9fc0ff" stroke="none" />{/* bridge windows */}
      <circle cx="12" cy="16.4" r="1.5" fill="#c8322b" />{/* funnel */}
    </>),
  },
  plane: {
    verb: 'Flying', seconds: 3.6, viewBox: '0 0 24 24',
    art: <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />,
  },
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const ago = age => (age < 1 ? 'today' : `${plural(Math.floor(age), 'day')} ago`);

// Letter styles the writer picks; the server only accepts these keys.
const FONTS = { hand: 'Handwritten', type: 'Typewriter', serif: 'Classic', neat: 'Neat' };
const PAPERS = { cream: 'Cream', airmail: 'Airmail', rose: 'Rose', mint: 'Mint', kraft: 'Kraft' };
const paperOf = l => (PAPERS[l.paper] ? l.paper : 'cream');
const sheetClass = l => `sheet font-${FONTS[l.font] ? l.font : 'hand'} paper-${paperOf(l)}`;
// Hotspot glow colour for the paper most used in that area.
const PAPER_GLOW = { cream: '#d39b3a', airmail: '#2f56b0', rose: '#d8577a', mint: '#3fae7a', kraft: '#9a6a34' };

// Map pins are envelopes in the letter's paper: sealed with wax until you read it, then opened.
// Older letters fade out.
// inHotspot: when zoomed out, letters inside a hotspot are hidden and shown as one bundle instead.
const envIcon = (letter, read, inHotspot) => L.divIcon({
  className: `env-icon${inHotspot ? ' in-hotspot' : ''}`, iconSize: [24, 17], iconAnchor: [12, 9],
  html: `<div class="env paper-${paperOf(letter)}${read ? ' read' : ''}" style="opacity:${(1 - fadeOf(Number(letter.age_days)) * 0.55).toFixed(2)}"></div>`,
});

// Hotspots are ~100 km grid cells: ROUND(lat),ROUND(lng) on the server. Same rounding here (half away from zero).
const roundAway = x => Math.sign(x) * Math.round(Math.abs(x));
const cellOf = l => `${roundAway(Number(l.lat))},${roundAway(Number(l.lng))}`;
const BUNDLE_MAX_ZOOM = 7; // at this zoom and below, hotspots show as bundles

// A small stack of envelopes in the area's most-used paper, with a count badge.
const bundleIcon = h => {
  const paper = PAPERS[h.paper] ? h.paper : 'cream';
  return L.divIcon({
    className: 'bundle-icon', iconSize: null,
    html: `<div class="bundle">${'<span class="env paper-' + paper + '"></span>'.repeat(3)}<b>${h.n}</b></div>`,
  });
};

export default function LetterMap() {
  const el = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const haloRef = useRef(null);
  const draftRef = useRef(null);
  const [open, setOpen] = useState(null);       // letter being read
  const [draft, setDraft] = useState(null);     // { lat, lng } being written to
  const [hotspotsOpen, setHotspotsOpen] = useState(false);
  const [stats, setStats] = useState({ total: null, hotspots: [] });
  const [theme, setTheme] = useState(readTheme);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [linkedId] = useState(() => new URLSearchParams(location.search).get('letter')); // read once, before the URL sync below rewrites it

  const [trip, setTrip] = useState(null); // { kind, angle, text } while the map is travelling
  const [read, setRead] = useState(loadRead);
  const readRef = useRef(read);       // map event handlers outlive renders, so they read this
  const markersRef = useRef(new Map()); // letter id -> { pin, letter }, to redraw its envelope when read state changes
  const hotCellsRef = useRef(new Set()); // hotspot cells, so their letters can hide behind a bundle when zoomed out

  const closeAll = () => { setOpen(null); setDraft(null); setResults([]); setHotspotsOpen(false); setNotice(''); };

  const iconFor = letter => envIcon(letter, !!readRef.current[letter.id], hotCellsRef.current.has(cellOf(letter)));
  const addMarker = letter => {
    const pin = L.marker([letter.lat, letter.lng], { icon: iconFor(letter), title: 'Letter', riseOnHover: true })
      .on('click', () => { closeAll(); setOpen(letter); })
      .addTo(layerRef.current);
    markersRef.current.set(letter.id, { pin, letter });
  };
  const redrawPins = () => markersRef.current.forEach(({ pin, letter }) => pin.setIcon(iconFor(letter)));

  const markRead = letter => {
    if (readRef.current[letter.id]) return;
    const fadesAt = Date.now() + Math.max(0, LIFE - Number(letter.age_days)) * 864e5;
    readRef.current = { ...readRef.current, [letter.id]: fadesAt };
    setRead(readRef.current); saveRead(readRef.current);
    markersRef.current.get(letter.id)?.pin.setIcon(iconFor(letter));
  };

  // Asked first in a shadcn AlertDialog (see confirmReset below).
  const [confirmReset, setConfirmReset] = useState(false);
  const resetRead = () => {
    readRef.current = {};
    setRead({}); saveRead({});
    redrawPins();
    toast.success('All letters are unread again');
  };

  const loadStats = () => fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});

  // Drop read letters that are gone (faded, archived by the admin, or hidden by reports) so the unread count is exact.
  // Only ids we sent can be dropped, so a letter opened while this runs is kept.
  const syncRead = async () => {
    const sent = Object.keys(readRef.current);
    if (!sent.length) return;
    try {
      const alive = new Set((await postJSON(`${API}/api/letters/alive`, { ids: sent.slice(-1500) })).ids);
      const sentSet = new Set(sent.slice(-1500));
      readRef.current = Object.fromEntries(Object.entries(readRef.current).filter(([id]) => !sentSet.has(id) || alive.has(id)));
      setRead(readRef.current); saveRead(readRef.current);
    } catch {}
  };

  const showLetter = letter => {
    closeAll();
    mapRef.current.flyTo([letter.lat, letter.lng], Math.max(mapRef.current.getZoom(), 10));
    setOpen(letter);
  };

  useEffect(() => {
    // Hard stop at the top/bottom edge of the world (±85.05° is where Web Mercator maps end), so you can't
    // drag off into grey space. Left/right stays endless: worldCopyJump wraps you back, the ±540° just leaves room for that.
    const map = L.map(el.current, {
      worldCopyJump: true, minZoom: 2, zoomControl: false,
      maxBounds: [[-85.0511, -540], [85.0511, 540]], maxBoundsViscosity: 1,
    }).setView([20, 10], 2);
    // Never zoom out so far that the world is shorter than the screen (tall phones and monitors).
    const fitMinZoom = () => map.setMinZoom(Math.max(2, Math.ceil(Math.log2(el.current.clientHeight / 256))));
    fitMinZoom();
    map.on('resize', fitMinZoom);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    // ponytail: OSM's free tiles are for light traffic; switch to MapTiler/Stadia (free tiers) before a big launch
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;

    // Every trip goes through flyTo (flyToBounds calls it too), so this is the one place that:
    // - hides glows mid-flight (Leaflet stretches that layer instead of redrawing it, so they balloon)
    // - shows a bus/ship/plane at screen centre while the world moves underneath it
    const flyTo = map.flyTo.bind(map);
    map.flyTo = (latlng, zoom, options = {}) => {
      const from = map.getCenter(), to = L.latLng(latlng);
      const meters = from.distanceTo(to), kind = vehicleFor(meters);
      el.current.classList.add('flying');
      if (kind) {
        const a = map.project(from), b = map.project(to), place = nearest(to.wrap().lat, to.wrap().lng);
        setTrip({
          kind, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI,
          text: `${TRAVEL[kind].verb} ${place ? `to ${place.name} · ` : ''}${Math.round(meters / 1000).toLocaleString()} km`,
        });
        options = { duration: TRAVEL[kind].seconds, ...options };
      }
      map.once('moveend', () => { el.current?.classList.remove('flying'); setTrip(null); });
      return flyTo(latlng, zoom, options);
    };

    // Stamps sit above the hotspot glows (400) and below envelopes (600). Each stamp is drawn just ABOVE its
    // spot (see .stamp-inner) and letters/bundles on or below it, so they don't cover each other.
    map.createPane('stamps').style.zIndex = 450;
    LANDMARKS.forEach(p => L.marker([p.lat, p.lng], {
      pane: 'stamps', keyboard: false, title: p.name,
      icon: L.divIcon({ className: `stamp tier${p.tier}`, iconSize: null, html: `<div class="stamp-inner"><span>${p.emoji}</span><small>${p.name}</small></div>` }),
    }).on('click', () => map.flyTo([p.lat, p.lng], 12)).addTo(map));

    haloRef.current = L.layerGroup().addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    const setZoomClass = () => {
      const z = map.getZoom();
      el.current.dataset.zoom = z <= 3 ? 'far' : z >= 11 ? 'near' : 'mid';
      el.current.dataset.bundle = z <= BUNDLE_MAX_ZOOM ? '1' : '0';
    };
    let controller;
    const load = async () => {
      controller?.abort(); controller = new AbortController();
      const b = map.getBounds();
      const q = new URLSearchParams({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
      try {
        const res = await fetch(`${API}/api/letters?${q}`, { signal: controller.signal });
        const letters = await res.json();
        layerRef.current.clearLayers(); markersRef.current.clear();
        letters.forEach(addMarker);
      } catch (e) { if (e.name !== 'AbortError') console.error(e); }
    };
    map.on('moveend', load);
    map.on('zoomend', setZoomClass);
    map.on('click', e => { closeAll(); setDraft(e.latlng.wrap()); });
    setZoomClass(); load(); loadStats(); syncRead();

    // Shared link: /?letter=123 opens that letter.
    let alive = true;
    if (/^[0-9a-f-]{36}$/i.test(linkedId || '')) {
      fetch(`${API}/api/letters/${linkedId}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(l => { if (alive) { map.setView([l.lat, l.lng], 12); setOpen(l); } })
        .catch(() => alive && toast('That letter has already faded away.', { description: 'Letters disappear after 100 days.' }));
    } else if (linkedId) toast('That letter has already faded away.'); // old numeric or broken link
    return () => { alive = false; controller?.abort(); map.remove(); };
  }, []);

  // Theme: CSS does the work via data-theme; remember the choice per browser.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);
  const nextTheme = () => { const keys = Object.keys(THEMES); setTheme(keys[(keys.indexOf(theme) + 1) % keys.length]); };

  // Hotspots: a glow and (when zoomed out) a bundle, both in the paper most used there.
  useEffect(() => {
    if (!haloRef.current) return;
    haloRef.current.clearLayers();
    hotCellsRef.current = new Set(stats.hotspots.map(h => h.cell));
    stats.hotspots.forEach(h => {
      L.circleMarker([h.lat, h.lng], {
        interactive: false, stroke: false, fillColor: PAPER_GLOW[h.paper] || PAPER_GLOW.cream, fillOpacity: 0.22, radius: 14 + Math.sqrt(h.n) * 6, className: 'halo',
      }).addTo(haloRef.current);
      L.marker([h.lat, h.lng], { icon: bundleIcon(h), title: `${plural(h.n, 'letter')} here, mostly ${PAPERS[h.paper] || 'Cream'} paper. Click to zoom in.` })
        .on('click', () => mapRef.current.flyTo([h.lat, h.lng], BUNDLE_MAX_ZOOM + 2))
        .addTo(haloRef.current);
    });
    redrawPins();
  }, [stats]);

  // Keep the address bar pointing at the open letter so it can be shared; opening a letter marks it read.
  useEffect(() => {
    history.replaceState(null, '', open ? `?letter=${open.id}` : location.pathname);
    if (open) markRead(open);
  }, [open]);

  // Dashed ring where the new letter will go.
  useEffect(() => {
    draftRef.current?.remove();
    if (draft) draftRef.current = L.circleMarker(draft, { radius: 10, color: '#8e2a1f', weight: 2, dashArray: '4 4', fill: false }).addTo(mapRef.current);
  }, [draft]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSent = letter => {
    setDraft(null);
    if (letter.held) return toast.success('Thanks! Your letter was sent.', { description: 'It will appear on the map after a quick review.' });
    addMarker(letter); setOpen(letter); loadStats();
    toast.success('Your letter is on the map', { description: 'It will fade away in 100 days.' });
  };

  // Prefer letters you haven't read; once you've read them all, any letter will do.
  const randomLetter = async () => {
    setNotice('');
    try {
      const exclude = Object.keys(readRef.current).slice(-150).join(',');
      let r = await fetch(`${API}/api/letters/random?exclude=${exclude}`);
      if (!r.ok && exclude) { r = await fetch(`${API}/api/letters/random`); if (r.ok) toast("You've read every letter!", { description: "Here's one you've seen before." }); }
      if (!r.ok) return toast('No letters yet', { description: 'Click anywhere on the map to write the first one.' });
      const letter = await r.json();
      showLetter(letter);
    } catch { toast.error('Could not reach the server.'); }
  };

  const readCount = Object.keys(read).length;
  const unread = stats.total === null ? null : Math.max(0, stats.total - readCount);

  const flyToPlace = p => {
    closeAll();
    const [s, n, w, e] = p.boundingbox.map(Number);
    mapRef.current.flyToBounds([[s, w], [n, e]], { maxZoom: 16 });
  };

  // Coordinates fly there and open a letter; anything else is looked up as a place name.
  const goTo = async e => {
    e.preventDefault();
    setNotice(''); setResults([]);
    const text = query.trim();
    if (!text) return;
    const at = parseCoords(text);
    if (at) {
      closeAll();
      mapRef.current.flyTo([at.lat, at.lng], Math.max(mapRef.current.getZoom(), 12));
      return setDraft(L.latLng(at.lat, at.lng));
    }
    setSearching(true);
    try {
      // ponytail: Nominatim (OpenStreetMap) is free but capped at ~1 search/sec, submit-only;
      // switch to a paid geocoder (MapTiler, LocationIQ) when traffic grows
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error();
      const places = await res.json();
      if (!places.length) setNotice('No place found. Try another name or coordinates.');
      else if (places.length === 1) flyToPlace(places[0]);
      else setResults(places);
    } catch { setNotice('Place search is unavailable right now. Coordinates still work.'); }
    finally { setSearching(false); }
  };

  return (
    <>
      <div ref={el} className="map" />
      {trip && (
        <div className={`vehicle vehicle-${trip.kind}`} role="status">
          <svg viewBox={TRAVEL[trip.kind].viewBox} aria-hidden="true" style={{ transform: `rotate(${trip.angle + 90}deg)` }}>
            {TRAVEL[trip.kind].art}
          </svg>
          <span>{trip.text}</span>
        </div>
      )}
      <header className="title card">
        <h1>Hundred Day Letters</h1>
        <p>Click anywhere on Earth to leave a letter. Every letter fades and disappears after 100 days.</p>
        {unread !== null && (
          <p className="count-line">
            {stats.total === 0 ? 'No letters yet. Be the first!'
              : unread === 0 ? <>You&apos;ve read every letter. <strong>Write one?</strong></>
              : <><strong>{unread}</strong> unread {unread === 1 ? 'letter is' : 'letters are'} waiting</>}
            {readCount > 0 && <span className="muted"> · {readCount} opened · <button className="link" onClick={() => setConfirmReset(true)}>Reset</button></span>}
          </p>
        )}
        <form className="search" onSubmit={goTo} role="search">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search a place or 14.5547, 121.0244" aria-label="Search a place or coordinates" />
          <button className="btn" disabled={searching}>{searching ? '…' : 'Go'}</button>
        </form>
        {notice && <p className="error" role="alert">{notice}</p>}
        {results.length > 0 && (
          <ul className="results" aria-label="Places found">
            {results.map(p => (
              <li key={p.place_id}><button type="button" onClick={() => flyToPlace(p)}>{p.display_name}</button></li>
            ))}
          </ul>
        )}
      </header>

      <nav className="toolbar" aria-label="Map tools">
        <button className="tool card" onClick={randomLetter}>🎲 Random letter</button>
        <button className="tool card" onClick={() => { const v = !hotspotsOpen; closeAll(); setHotspotsOpen(v); }} aria-pressed={hotspotsOpen}>🔥 Hotspots</button>
        <button className="tool card" onClick={nextTheme} aria-label={`Theme: ${theme}. Switch theme`}>{THEMES[theme]}</button>
      </nav>

      {draft && <WriteLetter key={`${draft.lat},${draft.lng}`} at={draft} onSent={onSent} onClose={() => setDraft(null)} />}
      {open && <ReadLetter key={open.id} letter={open} onClose={() => setOpen(null)} />}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark all {plural(readCount, 'letter')} as unread?</AlertDialogTitle>
            <AlertDialogDescription>
              Every envelope you&apos;ve opened will be sealed again, so you can read them all from the start.
              Your reading history on this device will be erased. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my history</AlertDialogCancel>
            <AlertDialogAction onClick={resetRead}><RotateCcw /> Mark all unread</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-center" theme={theme === 'night' ? 'dark' : 'light'} richColors closeButton />{/* status pop-ups */}
      {hotspotsOpen && (
        <section className="panel card" role="dialog" aria-label="Hotspots">
          <button className="close" onClick={() => setHotspotsOpen(false)} aria-label="Close">×</button>
          <h2>🔥 Hotspots</h2>
          {stats.hotspots.length ? (
            <ol className="hotspots">
              {stats.hotspots.map(h => (
                <li key={`${h.lat},${h.lng}`}>
                  <button onClick={() => { setHotspotsOpen(false); mapRef.current.flyTo([h.lat, h.lng], 9); }}>
                    <span><i className={`env mini paper-${PAPERS[h.paper] ? h.paper : 'cream'}`} aria-hidden="true" /> {placeName(h.lat, h.lng)}</span>
                    <em>{plural(h.n, 'letter')} · mostly {PAPERS[h.paper] || 'Cream'}</em>
                  </button>
                </li>
              ))}
            </ol>
          ) : <p className="muted">No hotspots yet. Places with 2 or more letters show up here.</p>}
        </section>
      )}
    </>
  );
}

const errorText = err => (err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message);

async function postJSON(url, payload) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not send.');
  return data;
}

function WriteLetter({ at, onSent, onClose }) {
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [font, setFont] = useState('hand');
  const [paper, setPaper] = useState('cream');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try { onSent(await postJSON(`${API}/api/letters`, { body, name, font, paper, lat: at.lat, lng: at.lng })); }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };

  return (
    <section className="panel card" role="dialog" aria-label="Write a letter">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h2>{nearest(at.lat, at.lng) ? `A letter near ${nearest(at.lat, at.lng).name}` : 'A letter to this place'}</h2>
      <p className="coords">{formatCoords(at)}</p>
      <form onSubmit={send}>
        <div className="chips" role="radiogroup" aria-label="Font">
          {Object.entries(FONTS).map(([k, label]) => (
            <button type="button" key={k} role="radio" aria-checked={font === k} className={`chip font-${k}`} onClick={() => setFont(k)}>{label}</button>
          ))}
        </div>
        <div className="swatches" role="radiogroup" aria-label="Paper">
          {Object.entries(PAPERS).map(([k, label]) => (
            <button type="button" key={k} role="radio" aria-checked={paper === k} aria-label={`${label} paper`} title={label}
              className={`swatch paper-${k}`} onClick={() => setPaper(k)} />
          ))}
        </div>
        <textarea className={sheetClass({ font, paper })} autoFocus value={body} onChange={e => setBody(e.target.value)} maxLength={500}
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

// Report link that asks why; the reason shows up in the admin Reports tab.
const REPORT_REASONS = { spam: 'Spam', abuse: 'Hateful or abusive', personal: 'Personal info', danger: 'Dangerous', other: 'Other' };
function ReportButton({ url }) {
  const [state, setState] = useState('idle'); // idle | choosing | done
  if (state === 'done') return <span>Reported. Thanks.</span>;
  if (state === 'idle') return <button className="link" onClick={() => setState('choosing')}>Report</button>;
  const send = reason => {
    setState('done');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }).catch(() => {});
  };
  return (
    <span className="report-reasons" role="group" aria-label="Why are you reporting this?">
      {Object.entries(REPORT_REASONS).map(([k, label]) => <button key={k} className="chip" onClick={() => send(k)}>{label}</button>)}
      <button className="link" onClick={() => setState('idle')}>Cancel</button>
    </span>
  );
}

function ReadLetter({ letter, onClose }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false); // fallback dialog when the browser blocks copying
  const age = Number(letter.age_days);
  const day = Math.min(LIFE, Math.floor(age) + 1);
  const daysLeft = Math.max(0, Math.ceil(LIFE - age));
  const url = `${typeof location === 'undefined' ? '' : location.origin}/?letter=${letter.id}`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied', { description: 'Anyone with the link can read this letter until it fades.' });
    } catch { setShareOpen(true); }
  };

  return (
    <section className="panel card letter" role="dialog" aria-label="Letter" style={{ '--fade': fadeOf(age) }}>
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <div className="postmark" aria-label={`Day ${day} of ${LIFE}`}><b>DAY {day}</b><span>of {LIFE}</span></div>
      <p className="coords">{placeName(letter.lat, letter.lng)}<br />{formatCoords(letter)}</p>
      <div className={sheetClass(letter)}>
        <p className="letter-body">{letter.body}</p>
        <p className="sign">— {letter.name || 'anonymous'}</p>
      </div>
      <div className="meta">
        <span>Written {ago(age)} · fades in {plural(daysLeft, 'day')}</span>
        <span className="actions">
          <button className="link" onClick={share}>{copied ? 'Link copied' : 'Share'}</button>
          <ReportButton url={`${API}/api/letters/${letter.id}/report`} />
        </span>
      </div>
      <Replies letterId={letter.id} />

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this letter</DialogTitle>
            <DialogDescription>Anyone with this link can read the letter until it fades away.</DialogDescription>
          </DialogHeader>
          <Input readOnly value={url} onFocus={e => e.target.select()} aria-label="Link to this letter" className="h-9 rounded-md border px-3" />
          <DialogFooter>
            <Button onClick={async e => {
              const input = e.currentTarget.closest('[data-slot=dialog-content]').querySelector('input');
              input.select();
              try { await navigator.clipboard.writeText(url); } catch { document.execCommand?.('copy'); }
              toast.success('Link copied'); setShareOpen(false); setCopied(true);
            }}><Copy /> Copy link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Replies({ letterId }) {
  const [list, setList] = useState(null);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/letters/${letterId}/replies`).then(r => r.json()).then(setList).catch(() => setList([]));
  }, [letterId]);

  const send = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await postJSON(`${API}/api/letters/${letterId}/replies`, { body, name });
      if (r.held) toast.success('Thanks! Your reply was sent.', { description: 'It will appear after a quick review.' });
      else { setList(l => [...(l || []), r]); toast.success('Reply posted'); }
      setBody('');
    }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };

  const n = list?.length ?? 0;
  return (
    <div className="replies">
      <h3>{list === null ? 'Replies' : n ? `${n} ${n === 1 ? 'reply' : 'replies'}` : 'No replies yet'}</h3>
      {n > 0 && (
        <ul>
          {list.map(r => (
            <li key={r.id}>
              <p>{r.body}</p>
              <small>— {r.name || 'anonymous'} · {ago(Number(r.age_days))} · <ReportButton url={`${API}/api/replies/${r.id}/report`} /></small>
            </li>
          ))}
        </ul>
      )}
      <form className="reply-form" onSubmit={send}>
        <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={300} placeholder="Write a reply…" aria-label="Your reply" />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="anonymous" aria-label="Sign your reply (optional)" />
          <button className="btn" disabled={busy || !body.trim()}>{busy ? '…' : 'Reply'}</button>
        </div>
      </form>
    </div>
  );
}

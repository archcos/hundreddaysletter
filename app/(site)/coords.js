// Accepts "14.5547, 121.0244", "14.5547 121.0244" and "14.5547° N, 121.0244° E" (latitude first).
const PART = String.raw`(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?`;
const RE = new RegExp(String.raw`^${PART}\s*[,\s]\s*${PART}$`, 'i');

export function parseCoords(text) {
  const m = String(text).trim().match(RE);
  if (!m || /[EW]/i.test(m[2] || '') || /[NS]/i.test(m[4] || '')) return null;
  const signed = (n, h) => (/[SW]/i.test(h || '') ? -Math.abs(n) : Number(n));
  const lat = signed(m[1], m[2]), lng = signed(m[3], m[4]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export const formatCoords = ({ lat, lng }) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

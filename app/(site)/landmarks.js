// Postage-stamp markers for well-known places. tier 1 shows at world zoom, tier 2 once you zoom in.
// Emoji are used for most places. Singapore has no Merlion emoji, so it uses a small hand-drawn illustration (svg).
// NOTE: the Merlion is a registered trademark of the Singapore Tourism Board. This is an original drawing of it, but for a
// commercial site get their permission, or delete the `svg: MERLION` part on the Singapore line to fall back to the lion emoji.

// A merlion: a lion head with a mane, on a fish body with a tail, standing on waves.
const mane = Array.from({ length: 9 }, (_, k) => {
  const a = (k * 2 * Math.PI) / 9;
  return `<circle cx="${(17 + 9.6 * Math.cos(a)).toFixed(1)}" cy="${(14 + 9.6 * Math.sin(a)).toFixed(1)}" r="3.7" fill="#e3a72b" stroke="#2b2118" stroke-width="1.1"/>`;
}).join('');
const MERLION = `<svg viewBox="0 0 40 46" aria-hidden="true">
<path d="M2 43.5q4-3.2 8 0t8 0 8 0 8 0 6 0" fill="none" stroke="#3b82c4" stroke-width="2" stroke-linecap="round"/>
<path d="M31 29.5 38.5 22.5c.4 4.2-.4 8.6-2.8 13z" fill="#cfe0e4" stroke="#2b2118" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M14 24c-6 6-6 15 1 19 7 4 16 1 17-7 .6-4-1.5-7-4.5-7 .4 3.2-.6 6.5-4.5 6.5-4.4 0-5.6-5.2-2.2-9.6z" fill="#eef4f5" stroke="#2b2118" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M13 33q3 2.5 6 0M15 38q3 2.5 6 0M22 36q3 2.5 6 0" fill="none" stroke="#7aa0aa" stroke-width="1" stroke-linecap="round"/>
${mane}
<circle cx="17" cy="14.5" r="7.4" fill="#f6d57a" stroke="#2b2118" stroke-width="1.1"/>
<circle cx="14.2" cy="13.6" r="1.1" fill="#2b2118"/><circle cx="19.8" cy="13.6" r="1.1" fill="#2b2118"/>
<path d="M15.4 16.4h3.2l-1.6 1.8z" fill="#2b2118"/>
<path d="M14.6 18.9q2.4 2 4.8 0" fill="none" stroke="#2b2118" stroke-width="1" stroke-linecap="round"/>
</svg>`;
export const LANDMARKS = [
  { name: 'Singapore', emoji: '🦁', svg: MERLION, lat: 1.2868, lng: 103.8545, tier: 1 },
  { name: 'Paris', emoji: '🗼', lat: 48.8584, lng: 2.2945, tier: 1 },
  { name: 'New York', emoji: '🗽', lat: 40.6892, lng: -74.0445, tier: 1 },
  { name: 'Tokyo', emoji: '🌸', lat: 35.6762, lng: 139.6503, tier: 1 },
  { name: 'Sydney', emoji: '🎶', lat: -33.8568, lng: 151.2153, tier: 1 },
  { name: 'Rio de Janeiro', emoji: '🏖️', lat: -22.9519, lng: -43.2105, tier: 1 },
  { name: 'Cairo', emoji: '🐪', lat: 29.9792, lng: 31.1342, tier: 1 },
  { name: 'Agra', emoji: '🕌', lat: 27.1751, lng: 78.0421, tier: 1 },
  { name: 'Beijing', emoji: '🏯', lat: 39.9163, lng: 116.3972, tier: 1 },
  { name: 'Moscow', emoji: '🪆', lat: 55.7539, lng: 37.6208, tier: 1 },
  { name: 'Cape Town', emoji: '🐧', lat: -33.9249, lng: 18.4241, tier: 1 },
  { name: 'Reykjavik', emoji: '🌌', lat: 64.1466, lng: -21.9426, tier: 1 },
  { name: 'Honolulu', emoji: '🌺', lat: 21.2793, lng: -157.8292, tier: 1 },
  { name: 'Mexico City', emoji: '🌮', lat: 19.4326, lng: -99.1332, tier: 1 },
  { name: 'Machu Picchu', emoji: '🦙', lat: -13.1631, lng: -72.545, tier: 1 },
  { name: 'Dubai', emoji: '🏙️', lat: 25.1972, lng: 55.2744, tier: 1 },
  { name: 'Nairobi', emoji: '🦒', lat: -1.2921, lng: 36.8219, tier: 1 },
  { name: 'Buenos Aires', emoji: '💃', lat: -34.6037, lng: -58.3816, tier: 1 },
  { name: 'Manila', emoji: '🌅', lat: 14.5826, lng: 120.9787, tier: 1 },
  { name: 'San Francisco', emoji: '🌉', lat: 37.8199, lng: -122.4783, tier: 1 },
  { name: 'London', emoji: '💂', lat: 51.5033, lng: -0.1196, tier: 2 },
  { name: 'Rome', emoji: '🏛️', lat: 41.8902, lng: 12.4922, tier: 2 },
  { name: 'Venice', emoji: '🛶', lat: 45.4408, lng: 12.3155, tier: 2 },
  { name: 'Amsterdam', emoji: '🌷', lat: 52.3676, lng: 4.9041, tier: 2 },
  { name: 'Barcelona', emoji: '⛪', lat: 41.4036, lng: 2.1744, tier: 2 },
  { name: 'Lisbon', emoji: '🚋', lat: 38.7223, lng: -9.1393, tier: 2 },
  { name: 'Athens', emoji: '🏺', lat: 37.9715, lng: 23.7257, tier: 2 },
  { name: 'Istanbul', emoji: '🧿', lat: 41.0086, lng: 28.9802, tier: 2 },
  { name: 'Kyoto', emoji: '⛩️', lat: 35.0116, lng: 135.7681, tier: 2 },
  { name: 'Seoul', emoji: '🏮', lat: 37.5796, lng: 126.977, tier: 2 },
  { name: 'Hong Kong', emoji: '🌃', lat: 22.2783, lng: 114.1747, tier: 2 },
  { name: 'Bangkok', emoji: '🛕', lat: 13.75, lng: 100.4913, tier: 2 },
  { name: 'Hanoi', emoji: '🍜', lat: 21.0278, lng: 105.8342, tier: 2 },
  { name: 'Kuala Lumpur', emoji: '🌇', lat: 3.1579, lng: 101.7116, tier: 2 },
  { name: 'Bali', emoji: '🌴', lat: -8.3405, lng: 115.092, tier: 2 },
  { name: 'Los Angeles', emoji: '🎬', lat: 34.1341, lng: -118.3215, tier: 2 },
  { name: 'Toronto', emoji: '🍁', lat: 43.6426, lng: -79.3871, tier: 2 },
];

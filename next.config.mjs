// Addresses (besides localhost) that may open the dev server, e.g. your computer's IP or a phone on the same Wi-Fi.
// Set ALLOWED_DEV_ORIGINS in .env.local as a comma-separated list: ALLOWED_DEV_ORIGINS=172.50.254.28
// Only affects `next dev`; a production build doesn't need it.
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export default { allowedDevOrigins };

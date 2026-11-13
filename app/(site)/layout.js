import './site.css';

// The public map. The "(site)" folder is a route group: it doesn't appear in the URL.
// site.css loads Leaflet, the map's own styles (globals.css) and the shadcn bits, in that order.
export default function SiteLayout({ children }) {
  return children;
}

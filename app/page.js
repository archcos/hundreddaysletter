'use client';
import dynamic from 'next/dynamic';

// Leaflet touches `window`, so the map only renders in the browser.
const LetterMap = dynamic(() => import('./LetterMap'), { ssr: false });

export default function Home() {
  return <LetterMap />;
}

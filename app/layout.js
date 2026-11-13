import { Lora } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const lora = Lora({ subsets: ['latin'], style: ['normal', 'italic'] });

export const metadata = {
  title: 'Hundred Day Letters',
  description: 'Leave a letter anywhere on Earth. Every letter fades away after 100 days.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f4ecdc' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={lora.className}>{children}</body>
    </html>
  );
}

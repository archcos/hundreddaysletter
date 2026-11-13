import { Lora, Caveat, Special_Elite, Nunito } from 'next/font/google';

// Root layout: fonts and <html> only. Styles live in each section's own layout:
// app/(site)/layout.js for the map, app/admin/layout.js for the shadcn admin panel.
const serif = Lora({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif' });
const hand = Caveat({ subsets: ['latin'], variable: '--font-hand' });
const type = Special_Elite({ subsets: ['latin'], weight: '400', variable: '--font-type' });
const neat = Nunito({ subsets: ['latin'], variable: '--font-neat' });

const description = 'Leave a letter anywhere on Earth. Every letter fades away after 100 days.';
export const metadata = {
  title: 'Hundred Day Letters',
  description,
  openGraph: { title: 'Hundred Day Letters', description, type: 'website' },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f4ecdc' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="paper" className={`${serif.variable} ${hand.variable} ${type.variable} ${neat.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

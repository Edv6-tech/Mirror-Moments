import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mirror Moment — Wear the dress before it’s yours',
  description:
    'A virtual dress try-on app. Lift a dress out of any photo, then see yourself wearing it.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen bg-[var(--pearl-50)] text-[var(--ink-900)]">
        {children}
      </body>
    </html>
  );
}

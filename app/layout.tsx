import './globals.css';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'LinkRoutine',
  description: 'A privacy-first URL mailbox and shortcut dashboard inside Pi Browser.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#17130f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}

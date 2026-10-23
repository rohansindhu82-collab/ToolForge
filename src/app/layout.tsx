import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://toolforge-ashen.vercel.app'),
  title: { default: 'ToolForge — Simple tools. Done beautifully.', template: '%s | ToolForge' },
  description: 'Free, simple tools for your files, media, text and everyday tasks. Explore browser-first utilities built to be fast and easy to use.',
  applicationName: 'ToolForge',
  openGraph: { type: 'website', siteName: 'ToolForge', title: 'ToolForge — Simple tools. Done beautifully.', description: 'Everyday file, media and productivity tools in one clean workspace.' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

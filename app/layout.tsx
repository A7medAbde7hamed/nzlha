import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'nzlha — Creator Studio',
  description: 'A private, bilingual workspace to organize your videos and platform plans.',
  applicationName: 'nzlha',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}

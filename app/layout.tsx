import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'nzlha — Creator Studio',
  description: 'مساحة واحدة لإدارة وجدولة محتواك على منصات التواصل.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}

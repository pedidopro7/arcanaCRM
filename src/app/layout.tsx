import type { Metadata, Viewport } from 'next';
import './globals.css';
import './auth.css';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Arcana OS — Influencer Operations',
  description: 'Operação de clientes, campanhas e influenciadores em um único lugar.',
  icons: { icon: '/brand/agency-logo.jpeg', apple: '/brand/agency-logo.jpeg' },
};

export const viewport: Viewport = {
  themeColor: '#10276f',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><AppShell>{children}</AppShell></body></html>;
}

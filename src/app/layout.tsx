import type { Metadata, Viewport } from 'next';
import './globals.css';
import './styles/auth.css';
import './styles/shell.css';
import './styles/general.css';
import './styles/tables.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/operational.css';
import './styles/casting.css';
import './styles/pipeline.css';
import './styles/files.css';
import './styles/public.css';
import './styles/states.css';
import './styles/overlays.css';
import './styles/responsive.css';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: { default: 'Arcana OS', template: '%s · Arcana OS' },
  description: 'Influencer Operations — clientes, campanhas, creators, contratos, conteúdo, logística e financeiro em um único lugar.',
  icons: { icon: '/brand/agency-logo.jpeg', apple: '/brand/agency-logo.jpeg' },
};

export const viewport: Viewport = { themeColor:'#10276f', colorScheme:'light' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><AppShell>{children}</AppShell></body></html>}

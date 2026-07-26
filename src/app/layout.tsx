import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

interface TenantTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

// Simulação/Busca de tema por Tenant
async function getTenantTheme(host: string): Promise<TenantTheme> {
  if (host.includes('alfa')) {
    return {
      name: 'Curso Alfa Preparatórios',
      primaryColor: '#1e3a8a',
      secondaryColor: '#10b981',
    };
  }

  return {
    name: 'Question Engine',
    primaryColor: '#2563eb',
    secondaryColor: '#f59e0b',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('x-tenant-host') || headersList.get('host') || '';
  const theme = await getTenantTheme(host);

  return {
    title: `${theme.name} | Plataforma de Questões`,
    description: 'Treine questões e simulados para o seu exame.',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('x-tenant-host') || headersList.get('host') || '';
  const theme = await getTenantTheme(host);

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      style={
        {
          '--primary-color': theme.primaryColor,
          '--secondary-color': theme.secondaryColor,
        } as React.CSSProperties
      }
    >
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
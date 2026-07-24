// question-engine-frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Simulação de busca de tema por Tenant (Integrado com Cache no Redis/Backend)
async function getTenantTheme(host: string) {
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
  const host = headersList.get('x-tenant-host') || '';
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
  const host = headersList.get('x-tenant-host') || '';
  const theme = await getTenantTheme(host);

  return (
    <html
      lang="pt-BR"
      style={
        {
          '--primary-color': theme.primaryColor,
          '--secondary-color': theme.secondaryColor,
        } as React.CSSProperties
      }
    >
      <body 
        suppressHydrationWarning // <--- Adicionado para ignorar alterações de extensões no body
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
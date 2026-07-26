'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { BookOpen, FileCheck, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserEmail(Cookies.get('userEmail') || '');
    setUserRole(Cookies.get('userRole') || '');
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('userRole');
    Cookies.remove('userEmail');
    Cookies.remove('tenantId');
    router.push('/login');
  };

  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'TEACHER'].includes(userRole);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
      {/* Brand / Logo White-label */}
      <div className="flex items-center gap-6">
        <Link href="/questoes" className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md"
            style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
          >
            QE
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-none">Question Engine</h1>
            <p className="text-[10px] text-slate-400 mt-1">Plataforma de Estudos</p>
          </div>
        </Link>

        {/* Links de Navegação */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
          <Link
            href="/questoes"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname.startsWith('/questoes')
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Caderno de Questões</span>
          </Link>

          <Link
            href="/simulados/1"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname.startsWith('/simulados')
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Simulados</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-all border border-amber-500/20"
            >
              <span>Painel do Professor ⚙️</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Perfil & Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <UserIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{userEmail || 'Aluno'}</span>
        </div>

        <button
          onClick={handleLogout}
          title="Sair da conta"
          className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-medium flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
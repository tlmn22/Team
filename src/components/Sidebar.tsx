'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/login/actions';
import TeamSwitcher from '@/components/TeamSwitcher';
import { IconLogout } from '@/components/icons';
import type { MyTeam } from '@/lib/auth';
import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Ерөнхий админ',
  manager: 'Менежер',
  owner: 'Эзэн',
  coach: 'Дасгалжуулагч',
  player: 'Тоглогч',
  user: 'Хэрэглэгч',
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  owner: 'bg-purple-100 text-purple-700',
  coach: 'bg-green-100 text-green-700',
  player: 'bg-orange-100 text-orange-700',
  user: 'bg-gray-100 text-gray-700',
};

export default function Sidebar({
  userName,
  primaryRole,
  myTeams,
  currentTeamId,
  navItems,
}: {
  userName: string;
  primaryRole: string;
  myTeams: MyTeam[];
  currentTeamId: number | null;
  navItems: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = userName.slice(0, 1).toUpperCase();
  const currentTeam = myTeams.find((t) => t.id === currentTeamId) ?? null;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <aside className="h-full bg-slate-800 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Sport Manager</p>
                <p className="text-slate-400 text-xs">Багийн менежментийн систем</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                    ROLE_BADGE[primaryRole] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ROLE_LABEL[primaryRole] ?? primaryRole}
                </span>
              </div>
            </div>
          </div>

          {primaryRole !== 'player' && myTeams.length > 1 && (
            <div className="px-3 py-3 border-b border-slate-700">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1.5 px-2">
                Баг сонгох
              </p>
              <TeamSwitcher teams={myTeams} currentTeamId={currentTeamId} dark />
              {currentTeam && (
                <p className="text-orange-400 text-xs mt-1 px-1">✓ {currentTeam.name}</p>
              )}
            </div>
          )}
          {primaryRole !== 'player' && myTeams.length === 1 && (
            <div className="px-5 py-2 border-b border-slate-700">
              <p className="text-slate-400 text-xs">
                Баг: <span className="text-orange-400">{myTeams[0].name}</span>
              </p>
            </div>
          )}

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-slate-700">
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <IconLogout className="w-[18px] h-[18px]" />
                Гарах
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileOpen(true)}
          className="font-bold text-orange-600 text-sm flex items-center gap-1.5"
        >
          🏆 Sport Manager
        </button>
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initial}
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import { requireUser, getPrimaryRole, getMyTeams, getCurrentTeamId } from '@/lib/auth';
import { logout } from '@/app/login/actions';
import TeamSwitcher from '@/components/TeamSwitcher';

/** includes/header.php-ийн role-based nav visibility логикийн орлого */
function navVisibility(role: string) {
  return {
    showClubs: role === 'superadmin',
    showTeams: role === 'superadmin' || role === 'manager',
    showUsers: role === 'superadmin',
    showMembers: ['superadmin', 'manager', 'coach'].includes(role),
    showEvents: ['superadmin', 'manager', 'owner', 'coach', 'player'].includes(role),
    showPosts: ['superadmin', 'manager', 'owner', 'coach', 'player'].includes(role),
    showReports: ['superadmin', 'manager', 'owner', 'coach'].includes(role),
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const role = await getPrimaryRole();
  const myTeams = await getMyTeams();
  const currentTeamId = await getCurrentTeamId();
  const nav = navVisibility(role);

  const links: { href: string; label: string; show: boolean }[] = [
    { href: '/dashboard', label: 'Нүүр', show: true },
    { href: '/events', label: 'Хуваарь', show: nav.showEvents },
    { href: '/posts', label: 'Мэдээ', show: nav.showPosts },
    { href: '/members', label: 'Гишүүд', show: nav.showMembers },
    { href: '/reports', label: 'Тайлан', show: nav.showReports },
    { href: '/teams', label: 'Багууд', show: nav.showTeams },
    { href: '/clubs', label: 'Клубууд', show: nav.showClubs },
    { href: '/users', label: 'Хэрэглэгчид', show: nav.showUsers },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="font-bold text-slate-900">Sport Manager</div>
          <div className="text-xs text-slate-500 mt-1">{user.name}</div>
          <TeamSwitcher teams={myTeams} currentTeamId={currentTeamId} />
        </div>
        <nav className="flex-1 py-2">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600"
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <form action={logout} className="px-4 py-3 border-t border-slate-200">
          <button type="submit" className="text-sm text-slate-500 hover:text-red-600">
            Гарах
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

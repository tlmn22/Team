import { requireUser, getPrimaryRole, getMyTeams, getCurrentTeamId } from '@/lib/auth';
import Sidebar, { type NavItem } from '@/components/Sidebar';
import {
  IconDashboard,
  IconClubs,
  IconTeams,
  IconMembers,
  IconEvents,
  IconPosts,
  IconReports,
  IconUsers,
} from '@/components/icons';

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

  const iconClass = 'w-[18px] h-[18px]';
  const allItems: (NavItem & { show: boolean })[] = [
    { href: '/dashboard', label: 'Нүүр', icon: <IconDashboard className={iconClass} />, show: true },
    { href: '/clubs', label: 'Клубууд', icon: <IconClubs className={iconClass} />, show: nav.showClubs },
    { href: '/teams', label: 'Багууд', icon: <IconTeams className={iconClass} />, show: nav.showTeams },
    { href: '/members', label: 'Гишүүд', icon: <IconMembers className={iconClass} />, show: nav.showMembers },
    { href: '/events', label: 'Хуваарь', icon: <IconEvents className={iconClass} />, show: nav.showEvents },
    { href: '/posts', label: 'Мэдээ', icon: <IconPosts className={iconClass} />, show: nav.showPosts },
    { href: '/reports', label: 'Тайлан', icon: <IconReports className={iconClass} />, show: nav.showReports },
    { href: '/users', label: 'Хэрэглэгчид', icon: <IconUsers className={iconClass} />, show: nav.showUsers },
  ];
  const navItems: NavItem[] = allItems.filter((item) => item.show);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={user.name}
        primaryRole={role}
        myTeams={myTeams}
        currentTeamId={currentTeamId}
        navItems={navItems}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 pt-20 pb-6 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

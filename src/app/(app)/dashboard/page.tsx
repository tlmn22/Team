import Link from 'next/link';
import {
  requireUser,
  getPrimaryRole,
  getMyClubs,
  getMyTeams,
  getCurrentTeamId,
} from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { IconClubs, IconEvents, IconPosts, IconChevronRight } from '@/components/icons';

const TYPE_LABEL: Record<string, string> = { practice: 'Бэлтгэл', meeting: 'Уулзалт', game: 'Тоглолт', other: 'Бусад' };
const TYPE_COLOR: Record<string, string> = {
  practice: 'bg-orange-100 text-orange-700',
  meeting: 'bg-blue-100 text-blue-700',
  game: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};
const ROLE_BADGE: Record<string, string> = {
  manager: 'bg-blue-100 text-blue-700',
  owner: 'bg-purple-100 text-purple-700',
};
const MONTHS = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

export default async function DashboardPage() {
  const user = await requireUser();
  const [role, myClubs, myTeams, currentTeamId] = await Promise.all([
    getPrimaryRole(),
    getMyClubs(),
    getMyTeams(),
    getCurrentTeamId(),
  ]);

  const teamIds = currentTeamId ? [currentTeamId] : myTeams.map((t) => t.id);
  const admin = createAdminClient();

  let totalPlayers = 0;
  let upcomingEvents: { id: number; title: string; type: string; date: string; time: string | null; location: string | null }[] = [];
  let recentPosts: { id: number; title: string; created_at: string }[] = [];
  let attendanceRate = 0;

  if (teamIds.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const [{ count: playerCount }, { data: events }, { data: posts }, { data: allEvents }] =
      await Promise.all([
        admin
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds)
          .eq('role', 'player')
          .eq('active', true),
        admin
          .from('events')
          .select('id, title, type, date, time, location')
          .in('team_id', teamIds)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(5),
        admin
          .from('posts')
          .select('id, title, created_at')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false })
          .limit(4),
        admin.from('events').select('id').in('team_id', teamIds),
      ]);
    totalPlayers = playerCount ?? 0;
    upcomingEvents = events ?? [];
    recentPosts = posts ?? [];

    const eventIds = (allEvents ?? []).map((e) => e.id);
    if (eventIds.length > 0) {
      const { data: attendance } = await admin
        .from('event_attendance')
        .select('status')
        .in('event_id', eventIds);
      const rows = attendance ?? [];
      const present = rows.filter((a) => a.status === 'present' || a.status === 'late').length;
      attendanceRate = rows.length > 0 ? Math.round((present / rows.length) * 100) : 0;
    }
  }

  const totalPosts = recentPosts.length; // жагсаалт (4) харагдана, нийт тоо reports хуудсаар нарийвчлан

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Сайн байна уу, {user.name}!</h1>
        <p className="text-gray-500 text-sm mt-0.5">Багийн өнөөдрийн байдал</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<IconTeamsInline />} color="orange" value={totalPlayers} label="Нийт тоглогч" />
        <StatCard icon={<IconEvents className="w-5 h-5" />} color="blue" value={upcomingEvents.length} label="Ирэх эвент" />
        <StatCard icon={<IconPosts className="w-5 h-5" />} color="green" value={totalPosts} label="Нийт пост" />
        <StatCard icon={<IconRateInline />} color="purple" value={`${attendanceRate}%`} label="Ирцийн хувь" />
      </div>

      {(role === 'superadmin' || myClubs.length > 1) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Клубууд</h2>
            {role === 'superadmin' && (
              <Link href="/clubs" className="text-orange-500 hover:text-orange-600 text-sm">
                Бүгдийг харах
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {myClubs.slice(0, 5).map((club) => (
              <Link
                key={club.id}
                href={`/teams?club_id=${club.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {club.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm group-hover:text-orange-600 truncate">
                    {club.name}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[club.my_role] ?? 'bg-blue-100 text-blue-700'}`}
                >
                  {club.my_role === 'owner' ? 'Эзэн' : 'Менежер'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ирэх эвентүүд</h2>
            <Link href="/events" className="text-orange-500 hover:text-orange-600 text-sm flex items-center gap-1">
              Бүгдийг харах
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Ирэх эвент алга</p>
          ) : (
            <div className="space-y-1">
              {upcomingEvents.map((ev) => {
                const d = new Date(ev.date + 'T00:00:00');
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="text-center min-w-[42px] bg-orange-50 rounded-lg p-1.5">
                      <p className="text-orange-600 text-xs font-medium">{MONTHS[d.getMonth()]}</p>
                      <p className="text-orange-700 font-bold text-lg leading-none">{d.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm group-hover:text-orange-600 truncate">
                        {ev.title}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {ev.time ? `${ev.time.slice(0, 5)} · ` : ''}
                        {ev.location || 'Байршил тодорхойгүй'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLOR[ev.type] ?? TYPE_COLOR.other}`}
                    >
                      {TYPE_LABEL[ev.type] ?? ev.type}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Сүүлийн мэдээ</h2>
            <Link href="/posts" className="text-orange-500 hover:text-orange-600 text-sm flex items-center gap-1">
              Бүгдийг харах
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Пост алга</p>
          ) : (
            <div className="space-y-1">
              {recentPosts.map((p) => (
                <Link
                  key={p.id}
                  href="/posts"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconPosts className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm group-hover:text-orange-600 truncate">
                      {p.title}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('mn-MN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: 'orange' | 'blue' | 'green' | 'purple';
  value: number | string;
  label: string;
}) {
  const bg = { orange: 'bg-orange-50', blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50' }[color];
  const fg = { orange: 'text-orange-500', blue: 'text-blue-500', green: 'text-green-500', purple: 'text-purple-500' }[color];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 ${fg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  );
}

function IconTeamsInline() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function IconRateInline() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

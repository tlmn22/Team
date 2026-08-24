import { requireUser, getCurrentTeamId, getMyTeams } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';
import type { AttendanceStatus } from '@/lib/actions/attendance';
import ReportsTabs, {
  type AttendanceRow,
  type PlayerRow,
  type ContentStats,
} from '@/components/reports/ReportsTabs';

export default async function ReportsPage() {
  await requireUser();
  const teamId = await getCurrentTeamId();

  if (!teamId) {
    const teams = await getMyTeams();
    return <NoTeamSelected teams={teams} />;
  }

  const admin = createAdminClient();

  const [{ data: members }, { data: events }, { data: posts }] = await Promise.all([
    admin
      .from('team_members')
      .select('user_id, role, jersey_number, position, profiles!inner(name, photo_url)')
      .eq('team_id', teamId)
      .eq('active', true),
    admin.from('events').select('id, title, type, date').eq('team_id', teamId).order('date', { ascending: false }),
    admin.from('posts').select('id, type').eq('team_id', teamId),
  ]);
  const eventIds = (events ?? []).map((e) => e.id);
  const postIds = (posts ?? []).map((p) => p.id);

  const [{ data: attendanceRows }, { count: totalViews }] = await Promise.all([
    eventIds.length
      ? admin.from('event_attendance').select('user_id, event_id, status').in('event_id', eventIds)
      : Promise.resolve({ data: [] as { user_id: string; event_id: number; status: string }[] }),
    postIds.length
      ? admin.from('post_views').select('id', { count: 'exact', head: true }).in('post_id', postIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const players: PlayerRow[] = (members ?? []).map((m) => {
    const profile = m.profiles as unknown as { name: string; photo_url: string | null };
    return {
      userId: m.user_id,
      name: profile.name,
      photoUrl: profile.photo_url,
      role: m.role,
      jerseyNumber: m.jersey_number,
      position: m.position,
    };
  });

  const attendance: AttendanceRow[] = players
    .filter((p) => p.role === 'player')
    .map((p) => {
      const rows = (attendanceRows ?? []).filter((a) => a.user_id === p.userId);
      const present = rows.filter((a) => a.status === 'present' || a.status === 'late').length;
      const details = (events ?? []).map((e) => {
        const row = rows.find((a) => a.event_id === e.id);
        return {
          eventId: e.id,
          title: e.title,
          date: e.date,
          type: e.type,
          status: (row?.status as AttendanceStatus) ?? null,
        };
      });
      return {
        userId: p.userId,
        name: p.name,
        photoUrl: p.photoUrl,
        role: p.role,
        present,
        total: rows.length,
        details,
      };
    });

  const byType: Record<string, number> = {};
  for (const p of posts ?? []) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
  }
  const content: ContentStats = {
    totalPosts: (posts ?? []).length,
    totalViews: totalViews ?? 0,
    byType,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Тайлан</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <ReportsTabs attendance={attendance} players={players} content={content} />
      </div>
    </div>
  );
}

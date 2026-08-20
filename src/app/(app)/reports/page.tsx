import { requireUser, getCurrentTeamId, getMyTeams } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';
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

  const { data: members } = await admin
    .from('team_members')
    .select('user_id, role, jersey_number, position, profiles!inner(name)')
    .eq('team_id', teamId)
    .eq('active', true);

  const { data: events } = await admin.from('events').select('id').eq('team_id', teamId);
  const eventIds = (events ?? []).map((e) => e.id);

  const { data: attendanceRows } = eventIds.length
    ? await admin.from('event_attendance').select('user_id, status').in('event_id', eventIds)
    : { data: [] as { user_id: string; status: string }[] };

  const players: PlayerRow[] = (members ?? []).map((m) => {
    const profile = m.profiles as unknown as { name: string };
    return {
      userId: m.user_id,
      name: profile.name,
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
      return { userId: p.userId, name: p.name, role: p.role, present, total: rows.length };
    });

  const { data: posts } = await admin.from('posts').select('id, type').eq('team_id', teamId);
  const postIds = (posts ?? []).map((p) => p.id);
  const { count: totalViews } = postIds.length
    ? await admin
        .from('post_views')
        .select('id', { count: 'exact', head: true })
        .in('post_id', postIds)
    : { count: 0 };

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

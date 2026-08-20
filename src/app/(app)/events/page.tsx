import { requireUser, getCurrentTeamId, getMyTeams, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';
import Link from 'next/link';

const TYPE_LABEL: Record<string, string> = {
  practice: 'Бэлтгэл',
  meeting: 'Уулзалт',
  game: 'Тоглолт',
  other: 'Бусад',
};

const TYPE_COLOR: Record<string, string> = {
  practice: 'bg-orange-100 text-orange-700',
  meeting: 'bg-blue-100 text-blue-700',
  game: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

interface EventRow {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string | null;
  location: string | null;
}

export default async function EventsPage() {
  await requireUser();
  const teamId = await getCurrentTeamId();

  if (!teamId) {
    const teams = await getMyTeams();
    return <NoTeamSelected teams={teams} />;
  }

  const canManage = await canManageTeam(teamId);
  const admin = createAdminClient();
  const { data: events } = await admin
    .from('events')
    .select('id, title, type, date, time, location')
    .eq('team_id', teamId)
    .order('date', { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const rows = (events ?? []) as EventRow[];
  const upcoming = rows.filter((e) => e.date >= today);
  const past = rows.filter((e) => e.date < today).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Хуваарь</h1>
        {canManage && <span className="text-xs text-gray-400">Эвент нэмэх — тун удахгүй</span>}
      </div>

      <Section title="Ирэх эвентүүд" rows={upcoming} empty="Ирэх эвент алга" />
      <Section title="Өнгөрсөн" rows={past} empty="Өнгөрсөн эвент алга" />
    </div>
  );
}

function Section({ title, rows, empty }: { title: string; rows: EventRow[]; empty: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">{empty}</p>
      ) : (
        <div className="space-y-1">
          {rows.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                  {e.title}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {e.date}
                  {e.time ? ` · ${e.time.slice(0, 5)}` : ''}
                  {e.location ? ` · ${e.location}` : ''}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}
              >
                {TYPE_LABEL[e.type] ?? e.type}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

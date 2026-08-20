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
  practice: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  game: 'bg-orange-100 text-orange-700',
  other: 'bg-slate-100 text-slate-600',
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Хуваарь</h1>
        {canManage && (
          <span className="text-xs text-slate-400">Эвент нэмэх — тун удахгүй</span>
        )}
      </div>

      <Section title="Ирэх эвентүүд" rows={upcoming} empty="Ирэх эвент алга" />
      <Section title="Өнгөрсөн" rows={past} empty="Өнгөрсөн эвент алга" />
    </div>
  );
}

function Section({ title, rows, empty }: { title: string; rows: EventRow[]; empty: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {rows.map((e) => (
            <li key={e.id}>
              <Link
                href={`/events/${e.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">{e.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {e.date}
                    {e.time ? ` · ${e.time.slice(0, 5)}` : ''}
                    {e.location ? ` · ${e.location}` : ''}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}
                >
                  {TYPE_LABEL[e.type] ?? e.type}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

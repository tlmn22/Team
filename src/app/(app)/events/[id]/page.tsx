import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser, canViewTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const TYPE_LABEL: Record<string, string> = {
  practice: 'Бэлтгэл',
  meeting: 'Уулзалт',
  game: 'Тоглолт',
  other: 'Бусад',
};

const STATUS_LABEL: Record<string, string> = {
  present: 'Ирсэн',
  absent: 'Тасалсан',
  late: 'Хоцорсон',
  excused: 'Чөлөөтэй',
};

const STATUS_COLOR: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-gray-100 text-gray-600',
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) notFound();

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, team_id, title, type, date, time, location, description')
    .eq('id', eventId)
    .maybeSingle();

  if (!event || !(await canViewTeam(event.team_id))) notFound();

  const { data: members } = await admin
    .from('team_members')
    .select('user_id, profiles!inner(id, name)')
    .eq('team_id', event.team_id)
    .eq('active', true);

  const { data: attendance } = await admin
    .from('event_attendance')
    .select('user_id, status, notes')
    .eq('event_id', eventId);

  const attendanceMap = new Map((attendance ?? []).map((a) => [a.user_id, a]));

  const { data: notes } = await admin
    .from('event_notes')
    .select('id, content, created_at, profiles(name)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/events" className="text-sm text-gray-400 hover:text-orange-600">
        ← Хуваарь
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
        <div className="text-sm text-gray-500 mt-1">
          {TYPE_LABEL[event.type] ?? event.type} · {event.date}
          {event.time ? ` · ${event.time.slice(0, 5)}` : ''}
          {event.location ? ` · ${event.location}` : ''}
        </div>
        {event.description && <p className="text-sm text-gray-600 mt-3">{event.description}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Ирц</h2>
        <div className="space-y-1">
          {(members ?? []).map((m) => {
            const profile = m.profiles as unknown as { id: string; name: string };
            const a = attendanceMap.get(m.user_id);
            return (
              <div key={m.user_id} className="flex items-center justify-between px-1 py-2">
                <span className="text-sm text-gray-800">{profile.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a ? STATUS_COLOR[a.status] : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {a ? STATUS_LABEL[a.status] : 'Тэмдэглээгүй'}
                </span>
              </div>
            );
          })}
          {(members ?? []).length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Багийн гишүүн алга</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Тэмдэглэл</h2>
        <div className="space-y-2">
          {(notes ?? []).map((n) => {
            const author = n.profiles as unknown as { name: string } | null;
            return (
              <div key={n.id} className="bg-gray-50 rounded-lg px-4 py-2.5">
                <p className="text-sm text-gray-700">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{author?.name ?? '—'}</p>
              </div>
            );
          })}
          {(notes ?? []).length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Тэмдэглэл алга</p>
          )}
        </div>
      </div>
    </div>
  );
}

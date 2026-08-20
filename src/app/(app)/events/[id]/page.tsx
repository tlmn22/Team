import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser, canViewTeam, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import AttendanceForm, { type AttendanceMember } from '@/components/events/AttendanceForm';
import type { AttendanceStatus } from '@/lib/actions/attendance';
import EventNotesForm, { type EventNote } from '@/components/events/EventNotesForm';
import EventDetailActions from '@/components/events/EventDetailActions';

const TYPE_LABEL: Record<string, string> = {
  practice: 'Бэлтгэл',
  meeting: 'Уулзалт',
  game: 'Тоглолт',
  other: 'Бусад',
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
  const canManage = await canManageTeam(event.team_id);

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

  const attendanceMembers: AttendanceMember[] = (members ?? []).map((m) => {
    const profile = m.profiles as unknown as { id: string; name: string };
    const a = attendanceMap.get(m.user_id);
    return {
      userId: m.user_id,
      name: profile.name,
      status: (a?.status as AttendanceStatus) ?? null,
      notes: a?.notes ?? null,
    };
  });

  const { data: notes } = await admin
    .from('event_notes')
    .select('id, content, created_at, profiles(name)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  const eventNotes: EventNote[] = (notes ?? []).map((n) => {
    const author = n.profiles as unknown as { name: string } | null;
    return { id: n.id, content: n.content, authorName: author?.name ?? null };
  });

  return (
    <div className="space-y-6">
      <Link href="/events" className="text-sm text-gray-400 hover:text-orange-600">
        ← Хуваарь
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
          {canManage && <EventDetailActions event={event} teamId={event.team_id} />}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {TYPE_LABEL[event.type] ?? event.type} · {event.date}
          {event.time ? ` · ${event.time.slice(0, 5)}` : ''}
          {event.location ? ` · ${event.location}` : ''}
        </div>
        {event.description && <p className="text-sm text-gray-600 mt-3">{event.description}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Ирц</h2>
        <AttendanceForm
          eventId={event.id}
          teamId={event.team_id}
          members={attendanceMembers}
          canManage={canManage}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Тэмдэглэл</h2>
        <EventNotesForm
          eventId={event.id}
          teamId={event.team_id}
          notes={eventNotes}
          canManage={canManage}
        />
      </div>
    </div>
  );
}

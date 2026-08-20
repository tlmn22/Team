import { requireUser, getCurrentTeamId, getMyTeams, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';
import EventsManager from '@/components/events/EventsManager';
import type { EventFormValues } from '@/components/events/EventFormModal';

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
    .select('id, title, type, date, time, location, description')
    .eq('team_id', teamId)
    .order('date', { ascending: true });

  return <EventsManager teamId={teamId} canManage={canManage} events={(events ?? []) as EventFormValues[]} />;
}

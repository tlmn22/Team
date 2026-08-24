import { requireUser, getCurrentTeamId, getMyTeams, canManageTeam } from '@/lib/auth';
import { listTeamMembers } from '@/lib/actions/members';
import NoTeamSelected from '@/components/NoTeamSelected';
import MembersManager from '@/components/members/MembersManager';

export default async function MembersPage() {
  await requireUser();
  const teamId = await getCurrentTeamId();

  if (!teamId) {
    const teams = await getMyTeams();
    return <NoTeamSelected teams={teams} />;
  }

  const [canManage, members] = await Promise.all([canManageTeam(teamId), listTeamMembers(teamId)]);

  return <MembersManager teamId={teamId} members={members} canManage={canManage} />;
}

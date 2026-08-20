import { redirect } from 'next/navigation';
import { requireUser, getPrimaryRole } from '@/lib/auth';
import { getManageableClubs, listTeamsForClub } from '@/lib/actions/teams';
import TeamsManager from '@/components/teams/TeamsManager';

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ club_id?: string }>;
}) {
  await requireUser();
  const role = await getPrimaryRole();
  if (role !== 'superadmin' && role !== 'manager') redirect('/dashboard');

  const clubs = await getManageableClubs();
  const { club_id } = await searchParams;
  const currentClubId = club_id ? Number(club_id) : (clubs[0]?.id ?? 0);

  const teams = currentClubId ? await listTeamsForClub(currentClubId) : [];

  return <TeamsManager clubs={clubs} currentClubId={currentClubId} teams={teams} />;
}

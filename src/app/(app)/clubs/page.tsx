import { redirect } from 'next/navigation';
import { requireUser, isSuperAdmin } from '@/lib/auth';
import { listClubs } from '@/lib/actions/clubs';
import ClubsManager from '@/components/clubs/ClubsManager';

export default async function ClubsPage() {
  await requireUser();
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const clubs = await listClubs();
  return <ClubsManager clubs={clubs} />;
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, canViewTeam, setCurrentTeamId } from '@/lib/auth';

/** includes/footer.php: switchTeam() -> api/auth.php?action=set_context-ийн орлого */
export async function switchTeam(teamId: number): Promise<void> {
  await requireUser();
  if (!(await canViewTeam(teamId))) return;
  await setCurrentTeamId(teamId);
  revalidatePath('/', 'layout');
}

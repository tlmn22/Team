import { redirect } from 'next/navigation';
import { requireUser, isSuperAdmin } from '@/lib/auth';
import { listUsers } from '@/lib/actions/users';
import UsersManager from '@/components/users/UsersManager';

export default async function UsersPage() {
  await requireUser();
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const users = await listUsers();
  return <UsersManager users={users} />;
}

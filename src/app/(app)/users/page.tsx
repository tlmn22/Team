import { requireUser } from '@/lib/auth';
import ComingSoon from '@/components/ComingSoon';

export default async function UsersPage() {
  await requireUser();
  return <ComingSoon title="Хэрэглэгчид" />;
}

import { requireUser } from '@/lib/auth';
import ComingSoon from '@/components/ComingSoon';

export default async function MembersPage() {
  await requireUser();
  return <ComingSoon title="Гишүүд" />;
}

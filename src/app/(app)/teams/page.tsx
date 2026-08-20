import { requireUser } from '@/lib/auth';
import ComingSoon from '@/components/ComingSoon';

export default async function TeamsPage() {
  await requireUser();
  return <ComingSoon title="Багууд" />;
}

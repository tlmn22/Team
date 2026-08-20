import { requireUser } from '@/lib/auth';
import ComingSoon from '@/components/ComingSoon';

export default async function ClubsPage() {
  await requireUser();
  return <ComingSoon title="Клубууд" />;
}

import { getTranslations } from 'next-intl/server';
import type { MyTeam } from '@/lib/auth';
import { switchTeam } from '@/lib/actions/team-context';

/** members.php/events.php/posts.php/reports.php-ийн "баг сонгоогүй" төлөвийн орлого */
export default async function NoTeamSelected({ teams }: { teams: MyTeam[] }) {
  const t = await getTranslations('noTeam');
  return (
    <div className="max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('title')}</h2>
      <p className="text-sm text-gray-500 mb-4">{t('subtitle')}</p>
      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <form key={team.id} action={switchTeam.bind(null, team.id)}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors border border-gray-100"
              >
                {team.club_name} / {team.name}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

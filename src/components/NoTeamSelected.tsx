import type { MyTeam } from '@/lib/auth';
import { switchTeam } from '@/lib/actions/team-context';

/** members.php/events.php/posts.php/reports.php-ийн "баг сонгоогүй" төлөвийн орлого */
export default function NoTeamSelected({ teams }: { teams: MyTeam[] }) {
  return (
    <div className="max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Баг сонгоогүй байна</h2>
      <p className="text-sm text-gray-500 mb-4">Үргэлжлүүлэхийн тулд багаа сонгоно уу.</p>
      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">Танд харьяалагдах баг алга.</p>
      ) : (
        <div className="space-y-2">
          {teams.map((t) => (
            <form key={t.id} action={switchTeam.bind(null, t.id)}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors border border-gray-100"
              >
                {t.club_name} / {t.name}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

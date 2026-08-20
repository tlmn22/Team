import type { MyTeam } from '@/lib/auth';
import { switchTeam } from '@/lib/actions/team-context';

/** members.php/events.php/posts.php/reports.php-ийн "баг сонгоогүй" төлөвийн орлого */
export default function NoTeamSelected({ teams }: { teams: MyTeam[] }) {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Баг сонгоогүй байна</h2>
      <p className="text-sm text-slate-500 mb-4">Үргэлжлүүлэхийн тулд багаа сонгоно уу.</p>
      {teams.length === 0 ? (
        <p className="text-sm text-slate-400">Танд харьяалагдах баг алга.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map((t) => (
            <li key={t.id}>
              <form action={switchTeam.bind(null, t.id)}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:border-orange-400 hover:bg-orange-50"
                >
                  {t.club_name} / {t.name}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

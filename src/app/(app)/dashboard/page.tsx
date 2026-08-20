import { requireUser, getPrimaryRole, getMyClubs, getMyTeams } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await requireUser();
  const role = await getPrimaryRole();
  const myClubs = await getMyClubs();
  const myTeams = await getMyTeams();

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">Сайн байна уу, {user.name}</h1>
      <p className="text-slate-500 text-sm mb-6">Таны эрх: {role}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-500">Клуб</div>
          <div className="text-2xl font-bold text-slate-900">{myClubs.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-500">Баг</div>
          <div className="text-2xl font-bold text-slate-900">{myTeams.length}</div>
        </div>
      </div>

      {myClubs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Клубууд</h2>
          <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl">
            {myClubs.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-400">{c.my_role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

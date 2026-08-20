'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import { switchTeam } from '@/lib/actions/team-context';
import { deleteTeam, type ManageableClub, type TeamWithCounts } from '@/lib/actions/teams';
import TeamFormModal from './TeamFormModal';

export default function TeamsManager({
  clubs,
  currentClubId,
  teams,
}: {
  clubs: ManageableClub[];
  currentClubId: number;
  teams: TeamWithCounts[];
}) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<TeamWithCounts | 'new' | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleDelete(team: TeamWithCounts) {
    if (!confirm(`"${team.name}" багийг устгах уу?`)) return;
    startTransition(async () => {
      const res = await deleteTeam(team.id, currentClubId);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Баг устгагдлаа');
        refresh();
      }
    });
  }

  function handleViewMembers(team: TeamWithCounts) {
    startTransition(async () => {
      await switchTeam(team.id);
      router.push('/members');
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Багууд</h1>
        {currentClubId > 0 && (
          <button
            onClick={() => setFormTarget('new')}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Баг нэмэх
          </button>
        )}
      </div>

      {clubs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clubs.map((c) => (
            <Link
              key={c.id}
              href={`/teams?club_id=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                c.id === currentClubId
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {clubs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-gray-400 text-sm text-center py-8">
            Танд удирдах клуб алга.
          </p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-gray-400 text-sm text-center py-8">Баг алга</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 overflow-hidden flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    team.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{team.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {team.coach_count} дасгалжуулагч · {team.player_count} тоглогч
                  </p>
                </div>
              </div>
              {team.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{team.description}</p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleViewMembers(team)}
                  disabled={pending}
                  className="flex-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 transition disabled:opacity-50"
                >
                  Гишүүд
                </button>
                <button
                  onClick={() => setFormTarget(team)}
                  className="flex-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg py-1.5 transition"
                >
                  Засах
                </button>
                <button
                  onClick={() => handleDelete(team)}
                  disabled={pending}
                  className="flex-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition disabled:opacity-50"
                >
                  Устгах
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <TeamFormModal
          clubId={currentClubId}
          team={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

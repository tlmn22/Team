'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { switchTeam } from '@/lib/actions/team-context';
import type { MyTeam } from '@/lib/auth';

export default function TeamSwitcher({
  teams,
  currentTeamId,
  dark = false,
}: {
  teams: MyTeam[];
  currentTeamId: number | null;
  dark?: boolean;
}) {
  const t = useTranslations('sidebar');
  const [pending, startTransition] = useTransition();

  if (teams.length < 2) return null;

  return (
    <select
      className={`w-full text-sm rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 ${
        dark ? 'bg-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-800'
      }`}
      value={currentTeamId ?? ''}
      disabled={pending}
      onChange={(e) => {
        const id = Number(e.target.value);
        startTransition(() => {
          switchTeam(id);
        });
      }}
    >
      <option value="" disabled>
        {t('noTeamChosen')}
      </option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name} {team.club_name ? `(${team.club_name})` : ''}
        </option>
      ))}
    </select>
  );
}

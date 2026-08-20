'use client';

import { useTransition } from 'react';
import { switchTeam } from '@/lib/actions/team-context';
import type { MyTeam } from '@/lib/auth';

export default function TeamSwitcher({
  teams,
  currentTeamId,
}: {
  teams: MyTeam[];
  currentTeamId: number | null;
}) {
  const [pending, startTransition] = useTransition();

  if (teams.length < 2) return null;

  return (
    <select
      className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 mt-2 bg-white disabled:opacity-50"
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
        Баг сонгох...
      </option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.club_name} / {t.name}
        </option>
      ))}
    </select>
  );
}

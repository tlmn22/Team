'use client';

import { useTransition } from 'react';
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
        — Баг сонгох —
      </option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} {t.club_name ? `(${t.club_name})` : ''}
        </option>
      ))}
    </select>
  );
}

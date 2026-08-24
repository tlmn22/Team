'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import { removeMember, type TeamMember } from '@/lib/actions/members';
import MemberFormModal from './MemberFormModal';

export default function MembersManager({
  teamId,
  members,
  canManage,
}: {
  teamId: number;
  members: TeamMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<TeamMember | 'new' | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleRemove(member: TeamMember) {
    if (!confirm(`"${member.name}"-г багаас хасах уу?`)) return;
    startTransition(async () => {
      const res = await removeMember(teamId, member.userId);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Гишүүн хасагдлаа');
        refresh();
      }
    });
  }

  const coaches = members.filter((m) => m.role === 'coach');
  const players = members.filter((m) => m.role === 'player');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Гишүүд</h1>
        {canManage && (
          <button
            onClick={() => setFormTarget('new')}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Гишүүн нэмэх
          </button>
        )}
      </div>

      <MemberSection
        title="Дасгалжуулагч"
        members={coaches}
        canManage={canManage}
        pending={pending}
        onEdit={setFormTarget}
        onRemove={handleRemove}
      />
      <MemberSection
        title="Тоглогчид"
        members={players}
        canManage={canManage}
        pending={pending}
        onEdit={setFormTarget}
        onRemove={handleRemove}
      />

      {formTarget && (
        <MemberFormModal
          teamId={teamId}
          member={formTarget === 'new' ? null : formTarget}
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

function MemberSection({
  title,
  members,
  canManage,
  pending,
  onEdit,
  onRemove,
}: {
  title: string;
  members: TeamMember[];
  canManage: boolean;
  pending: boolean;
  onEdit: (m: TeamMember) => void;
  onRemove: (m: TeamMember) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      {members.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Гишүүн алга</p>
      ) : (
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between px-1 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    m.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  {(m.position || m.phone) && (
                    <p className="text-xs text-gray-400">
                      {m.position ?? ''}
                      {m.position && m.phone ? ' · ' : ''}
                      {m.phone ?? ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.jerseyNumber != null && (
                  <span className="text-xs font-semibold text-gray-500">#{m.jerseyNumber}</span>
                )}
                {canManage && (
                  <>
                    <button
                      onClick={() => onEdit(m)}
                      className="text-xs text-gray-500 hover:text-orange-600"
                    >
                      Засах
                    </button>
                    <button
                      onClick={() => onRemove(m)}
                      disabled={pending}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Хасах
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/Toast';
import { deleteClub, type ClubWithCounts } from '@/lib/actions/clubs';
import ClubFormModal from './ClubFormModal';
import ManagersModal from './ManagersModal';

export default function ClubsManager({ clubs }: { clubs: ClubWithCounts[] }) {
  const t = useTranslations('clubs');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<ClubWithCounts | 'new' | null>(null);
  const [managersTarget, setManagersTarget] = useState<ClubWithCounts | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleDelete(club: ClubWithCounts) {
    if (!confirm(t('confirmDelete', { name: club.name }))) return;
    startTransition(async () => {
      const res = await deleteClub(club.id);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(t('deleted'));
        refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <button
          onClick={() => setFormTarget('new')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {t('add')}
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-gray-400 text-sm text-center py-8">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {club.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{club.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {t('teamsAndManagers', { teams: club.team_count, managers: club.member_count })}
                  </p>
                </div>
              </div>
              {club.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{club.description}</p>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setManagersTarget(club)}
                  className="flex-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 transition"
                >
                  {t('managersBtn')}
                </button>
                <button
                  onClick={() => setFormTarget(club)}
                  className="flex-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg py-1.5 transition"
                >
                  {tCommon('edit')}
                </button>
                <button
                  onClick={() => handleDelete(club)}
                  disabled={pending}
                  className="flex-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition disabled:opacity-50"
                >
                  {tCommon('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <ClubFormModal
          club={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            refresh();
          }}
        />
      )}

      {managersTarget && (
        <ManagersModal
          club={managersTarget}
          onClose={() => setManagersTarget(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

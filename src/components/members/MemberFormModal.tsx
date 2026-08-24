'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { addMember, updateMember, type TeamMember } from '@/lib/actions/members';

export default function MemberFormModal({
  teamId,
  member,
  onClose,
  onSaved,
}: {
  teamId: number;
  member: TeamMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('members');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const [role, setRole] = useState<'coach' | 'player'>(member?.role ?? 'player');
  const [preview, setPreview] = useState<string | null>(member?.photoUrl ?? null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = member
        ? await updateMember(teamId, member.userId, formData)
        : await addMember(teamId, formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(member ? t('updated') : t('created'));
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={member ? t('editTitle') : t('createTitle')}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('photo')}</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs">{t('photoPlaceholder')}</span>
              )}
            </div>
            <input
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
          </div>
        </div>

        {!member && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone', { optional: tCommon('optional') })}
              </label>
              <input
                name="phone"
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </>
        )}

        {member && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
            {member.name}
            {member.phone && <span className="text-gray-400 ml-2">{member.phone}</span>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'coach' | 'player')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="player">{tRoles('player')}</option>
            <option value="coach">{tRoles('coach')}</option>
          </select>
        </div>

        {role === 'player' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('jerseyNumber')}</label>
              <input
                name="jersey_number"
                type="number"
                min={0}
                max={99}
                defaultValue={member?.jerseyNumber ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('position')}</label>
              <input
                name="position"
                type="text"
                placeholder="PG, SG, SF..."
                defaultValue={member?.position ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
        >
          {pending ? tCommon('saving') : tCommon('save')}
        </button>
      </form>
    </Modal>
  );
}

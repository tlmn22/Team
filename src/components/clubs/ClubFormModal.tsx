'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { createClub, updateClub, type ClubWithCounts } from '@/lib/actions/clubs';

export default function ClubFormModal({
  club,
  onClose,
  onSaved,
}: {
  club: ClubWithCounts | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('clubs');
  const tCommon = useTranslations('common');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = club ? await updateClub(club.id, formData) : await createClub(formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(club ? t('updated') : t('created'));
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={club ? t('editTitle') : t('createTitle')}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={club?.name}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={club?.description ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
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

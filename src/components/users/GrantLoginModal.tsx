'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { grantLogin, type UserRow } from '@/lib/actions/users';

export default function GrantLoginModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await grantLogin(user.id, formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(t('grantedLogin'));
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={t('grantLoginTitle', { name: user.name })}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">{t('grantLoginHint')}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
        >
          {pending ? tCommon('saving') : t('grantLoginSubmit')}
        </button>
      </form>
    </Modal>
  );
}

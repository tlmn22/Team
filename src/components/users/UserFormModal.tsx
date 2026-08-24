'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { createUser, updateUser, type UserRow } from '@/lib/actions/users';

export default function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('users');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = user ? await updateUser(user.id, formData) : await createUser(formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(user ? t('updated') : t('created'));
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={user ? t('editTitle') : t('createTitle')}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={user?.name}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('phone', { optional: tCommon('optional') })}
          </label>
          <input
            name="phone"
            type="text"
            defaultValue={user?.phone ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {user ? t('newPasswordOptional') : t('password')}
          </label>
          <input
            name="password"
            type="password"
            required={!user}
            minLength={6}
            disabled={!!user && !user.hasLogin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          {user && !user.hasLogin && (
            <p className="text-xs text-gray-400 mt-1">{t('noLoginHint')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('systemRole')}</label>
          <select
            name="system_role"
            defaultValue={user?.system_role ?? 'user'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="user">{tRoles('user')}</option>
            <option value="superadmin">{tRoles('superadmin')}</option>
          </select>
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

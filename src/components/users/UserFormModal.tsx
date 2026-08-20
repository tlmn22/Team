'use client';

import { useTransition } from 'react';
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
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = user ? await updateUser(user.id, formData) : await createUser(formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(user ? 'Хэрэглэгч шинэчлэгдлээ' : 'Хэрэглэгч үүслээ');
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={user ? 'Хэрэглэгч засах' : 'Хэрэглэгч нэмэх'}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Нэр</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">И-мэйл</label>
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
            Утас (сонголттой)
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
            {user ? 'Шинэ нууц үг (хоосон бол өөрчлөхгүй)' : 'Нууц үг'}
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
            <p className="text-xs text-gray-400 mt-1">Энэ хэрэглэгч нэвтрэх эрхгүй профайл.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Системийн эрх</label>
          <select
            name="system_role"
            defaultValue={user?.system_role ?? 'user'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="user">Хэрэглэгч</option>
            <option value="superadmin">Ерөнхий админ</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
        >
          {pending ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </form>
    </Modal>
  );
}

'use client';

import { useTransition } from 'react';
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
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await grantLogin(user.id, formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Login эрх олгогдлоо');
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={`${user.name} — Login олгох`}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Энэ хэрэглэгч одоогоор зөвхөн профайл бөгөөд системд нэвтэрч чадахгүй. И-мэйл болон
          нууц үг тохируулж login эрх олгоно.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">И-мэйл</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Нууц үг</label>
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
          {pending ? 'Хадгалж байна...' : 'Login олгох'}
        </button>
      </form>
    </Modal>
  );
}

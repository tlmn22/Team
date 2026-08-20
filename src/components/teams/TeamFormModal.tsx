'use client';

import { useState, useTransition } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { createTeam, updateTeam, type TeamWithCounts } from '@/lib/actions/teams';

export default function TeamFormModal({
  clubId,
  team,
  onClose,
  onSaved,
}: {
  clubId: number;
  team: TeamWithCounts | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(team?.logo_url ?? null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = team
        ? await updateTeam(team.id, clubId, formData)
        : await createTeam(clubId, formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(team ? 'Баг шинэчлэгдлээ' : 'Баг үүслээ');
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={team ? 'Баг засах' : 'Баг нэмэх'}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Лого</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs">Лого</span>
              )}
            </div>
            <input
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Нэр</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={team?.name}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тайлбар</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={team?.description ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
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

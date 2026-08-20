'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import { deleteUser, type UserRow } from '@/lib/actions/users';
import UserFormModal from './UserFormModal';

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  user: 'bg-gray-100 text-gray-700',
};
const ROLE_LABEL: Record<string, string> = { superadmin: 'Ерөнхий админ', user: 'Хэрэглэгч' };

export default function UsersManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'user'>('all');
  const [formTarget, setFormTarget] = useState<UserRow | 'new' | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.phone ?? '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.system_role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  function refresh() {
    router.refresh();
  }

  function handleDelete(user: UserRow) {
    if (!confirm(`"${user.name}"-г устгах уу?`)) return;
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Хэрэглэгч устгагдлаа');
        refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Хэрэглэгчид</h1>
        <button
          onClick={() => setFormTarget('new')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Хэрэглэгч нэмэх
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Нэр, и-мэйл, утасаар хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | 'superadmin' | 'user')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Бүх эрх</option>
          <option value="superadmin">Ерөнхий админ</option>
          <option value="user">Хэрэглэгч</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">Хэрэглэгч олдсонгүй</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      {!u.hasLogin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 flex-shrink-0">
                          Login эрхгүй
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {u.email ?? ''}
                      {u.email && u.phone ? ' · ' : ''}
                      {u.phone ?? ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[u.system_role]}`}>
                    {ROLE_LABEL[u.system_role]}
                  </span>
                  <button
                    onClick={() => setFormTarget(u)}
                    className="text-xs text-gray-500 hover:text-orange-600"
                  >
                    Засах
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={pending}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Устгах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formTarget && (
        <UserFormModal
          user={formTarget === 'new' ? null : formTarget}
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

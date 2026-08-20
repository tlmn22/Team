'use client';

import { useEffect, useState, useTransition } from 'react';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import {
  getClubManagers,
  searchUsers,
  addExistingManager,
  createManagerUser,
  removeManager,
  type ClubManager,
  type ClubWithCounts,
  type UserSearchResult,
} from '@/lib/actions/clubs';

const ROLE_BADGE: Record<string, string> = {
  manager: 'bg-blue-100 text-blue-700',
  owner: 'bg-purple-100 text-purple-700',
};
const ROLE_LABEL: Record<string, string> = { manager: 'Менежер', owner: 'Эзэн' };

export default function ManagersModal({
  club,
  onClose,
  onChanged,
}: {
  club: ClubWithCounts;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [managers, setManagers] = useState<ClubManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [role, setRole] = useState<'manager' | 'owner'>('manager');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [pending, startTransition] = useTransition();

  const refresh = () => {
    getClubManagers(club.id).then((data) => {
      setManagers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(q).then(setResults);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleAddExisting(userId: string) {
    startTransition(async () => {
      const res = await addExistingManager(club.id, userId, role);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Менежер нэмэгдлээ');
        setQuery('');
        setResults([]);
        refresh();
        onChanged();
      }
    });
  }

  function handleCreateNew() {
    if (!newName.trim()) {
      toast('Нэр оруулна уу', 'error');
      return;
    }
    startTransition(async () => {
      const res = await createManagerUser(club.id, newName, newPhone, role);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Менежер үүслээ');
        setNewName('');
        setNewPhone('');
        refresh();
        onChanged();
      }
    });
  }

  function handleRemove(userId: string) {
    if (!confirm('Энэ менежерийг хасах уу?')) return;
    startTransition(async () => {
      const res = await removeManager(club.id, userId);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast('Хасагдлаа');
        refresh();
        onChanged();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={`${club.name} — Менежерүүд`} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Одоогийн менежерүүд
          </h3>
          {loading ? (
            <p className="text-sm text-gray-400">Ачаалж байна...</p>
          ) : managers.length === 0 ? (
            <p className="text-sm text-gray-400">Менежер алга</p>
          ) : (
            <div className="space-y-1">
              {managers.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-800">{m.name}</span>
                    {m.phone && <span className="text-xs text-gray-400 ml-2">{m.phone}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role]}`}>
                      {ROLE_LABEL[m.role]}
                    </span>
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={pending}
                      className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                    >
                      Хасах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Шинэ менежер нэмэх
          </h3>

          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs text-gray-500">Эрх:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'manager' | 'owner')}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="manager">Менежер</option>
              <option value="owner">Эзэн</option>
            </select>
          </div>

          <div className="flex gap-1 border-b border-gray-100 mb-3">
            {(['search', 'create'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition ${
                  tab === t
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'search' ? 'Байгаа хэрэглэгчээс' : 'Шинээр үүсгэх'}
              </button>
            ))}
          </div>

          {tab === 'search' ? (
            <div>
              <input
                type="text"
                placeholder="Нэр, утас, и-мэйлээр хайх..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddExisting(u.id)}
                      disabled={pending}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
                    >
                      <span className="text-sm text-gray-800">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.phone || u.email || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Нэр"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Утас (сонголттой)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleCreateNew}
                disabled={pending}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
              >
                Үүсгэж нэмэх
              </button>
              <p className="text-xs text-gray-400">
                Шинээр үүсгэсэн хэрэглэгч зөвхөн профайл байх бөгөөд одоогоор нэвтрэх эрхгүй.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

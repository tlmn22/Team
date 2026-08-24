'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/Toast';
import { saveAttendance, type AttendanceStatus } from '@/lib/actions/attendance';
import { STATUS_COLOR } from '@/lib/attendance-status';

const STATUSES: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];

export interface AttendanceMember {
  userId: string;
  name: string;
  photoUrl: string | null;
  status: AttendanceStatus | null;
  notes: string | null;
}

function MemberCell({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </div>
      <span className="text-sm text-gray-800 truncate">{name}</span>
    </div>
  );
}

export default function AttendanceForm({
  eventId,
  teamId,
  members,
  canManage,
}: {
  eventId: number;
  teamId: number;
  members: AttendanceMember[];
  canManage: boolean;
}) {
  const t = useTranslations('events');
  const tStatus = useTranslations('events.status');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [rows, setRows] = useState(
    members.map((m) => ({ userId: m.userId, status: m.status ?? 'present', notes: m.notes ?? '' }))
  );
  const [pending, startTransition] = useTransition();

  function setRow(userId: string, patch: Partial<{ status: AttendanceStatus; notes: string }>) {
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveAttendance(
        eventId,
        teamId,
        rows.map((r) => ({ userId: r.userId, status: r.status, notes: r.notes.trim() || null }))
      );
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(t('attendanceSaved'));
        router.refresh();
      }
    });
  }

  if (members.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">{t('noMembers')}</p>;
  }

  if (!canManage) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 pr-3 text-xs font-medium text-gray-400">{t('member')}</th>
              <th className="py-2 text-xs font-medium text-gray-400">{t('statusLabel')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3">
                  <MemberCell name={m.name} photoUrl={m.photoUrl} />
                </td>
                <td className="py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status ? STATUS_COLOR[m.status] : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {m.status ? tStatus(m.status) : t('notMarked')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 pr-3 text-xs font-medium text-gray-400">{t('member')}</th>
              <th className="py-2 pr-3 text-xs font-medium text-gray-400">{t('statusLabel')}</th>
              <th className="py-2 text-xs font-medium text-gray-400">{t('notesTitle')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const row = rows.find((r) => r.userId === m.userId)!;
              return (
                <tr key={m.userId} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-3 min-w-[140px]">
                    <MemberCell name={m.name} photoUrl={m.photoUrl} />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={row.status}
                      onChange={(e) => setRow(m.userId, { status: e.target.value as AttendanceStatus })}
                      className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {tStatus(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => setRow(m.userId, { notes: e.target.value })}
                      placeholder={t('notesTitle')}
                      className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 w-full min-w-[360px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
      >
        {pending ? tCommon('saving') : t('saveAttendance')}
      </button>
    </div>
  );
}

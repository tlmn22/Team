'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import { saveAttendance, type AttendanceStatus } from '@/lib/actions/attendance';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Ирсэн',
  absent: 'Тасалсан',
  late: 'Хоцорсон',
  excused: 'Чөлөөтэй',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-gray-100 text-gray-600',
};

export interface AttendanceMember {
  userId: string;
  name: string;
  status: AttendanceStatus | null;
  notes: string | null;
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
        toast('Ирц хадгалагдлаа');
        router.refresh();
      }
    });
  }

  if (members.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">Багийн гишүүн алга</p>;
  }

  if (!canManage) {
    return (
      <div className="space-y-1">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center justify-between px-1 py-2">
            <span className="text-sm text-gray-800">{m.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                m.status ? STATUS_COLOR[m.status] : 'bg-gray-100 text-gray-400'
              }`}
            >
              {m.status ? STATUS_LABEL[m.status] : 'Тэмдэглээгүй'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((m) => {
        const row = rows.find((r) => r.userId === m.userId)!;
        return (
          <div key={m.userId} className="flex items-center gap-2 px-1 py-1">
            <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{m.name}</span>
            <select
              value={row.status}
              onChange={(e) => setRow(m.userId, { status: e.target.value as AttendanceStatus })}
              className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={row.notes}
              onChange={(e) => setRow(m.userId, { notes: e.target.value })}
              placeholder="Тэмдэглэл"
              className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        );
      })}
      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition mt-2"
      >
        {pending ? 'Хадгалж байна...' : 'Ирц хадгалах'}
      </button>
    </div>
  );
}

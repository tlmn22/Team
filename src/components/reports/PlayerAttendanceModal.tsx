'use client';

import Modal from '@/components/Modal';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/attendance-status';
import type { AttendanceRow } from './ReportsTabs';

const TYPE_LABEL: Record<string, string> = {
  practice: 'Бэлтгэл',
  meeting: 'Уулзалт',
  game: 'Тоглолт',
  other: 'Бусад',
};

export default function PlayerAttendanceModal({
  player,
  onClose,
}: {
  player: AttendanceRow;
  onClose: () => void;
}) {
  const pct = player.total > 0 ? Math.round((player.present / player.total) * 100) : 0;

  return (
    <Modal open onClose={onClose} title={player.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              player.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500">
              {player.present}/{player.total} ирсэн ({pct}%)
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {player.details.map((d) => (
            <div
              key={d.eventId}
              className="flex items-center justify-between px-1 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-800 truncate">{d.title}</p>
                <p className="text-xs text-gray-400">
                  {TYPE_LABEL[d.type] ?? d.type} · {d.date}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  d.status ? STATUS_COLOR[d.status] : 'bg-gray-100 text-gray-400'
                }`}
              >
                {d.status ? STATUS_LABEL[d.status] : 'Тэмдэглээгүй'}
              </span>
            </div>
          ))}
          {player.details.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-6">Эвент алга</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

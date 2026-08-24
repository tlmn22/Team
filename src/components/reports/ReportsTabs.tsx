'use client';

import { useState } from 'react';
import type { AttendanceStatus } from '@/lib/actions/attendance';
import PlayerAttendanceModal from './PlayerAttendanceModal';

export interface PlayerAttendanceDetail {
  eventId: number;
  title: string;
  date: string;
  type: string;
  status: AttendanceStatus | null;
}

export interface AttendanceRow {
  userId: string;
  name: string;
  photoUrl: string | null;
  role: string;
  present: number;
  total: number;
  details: PlayerAttendanceDetail[];
}

export interface PlayerRow {
  userId: string;
  name: string;
  photoUrl: string | null;
  role: string;
  jerseyNumber: number | null;
  position: string | null;
}

export interface ContentStats {
  totalPosts: number;
  totalViews: number;
  byType: Record<string, number>;
}

const TABS = ['attendance', 'players', 'content'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  attendance: 'Ирц',
  players: 'Тоглогчид',
  content: 'Контент',
};

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

export default function ReportsTabs({
  attendance,
  players,
  content,
}: {
  attendance: AttendanceRow[];
  players: PlayerRow[];
  content: ContentStats;
}) {
  const [tab, setTab] = useState<Tab>('attendance');
  const [selectedPlayer, setSelectedPlayer] = useState<AttendanceRow | null>(null);

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <div className="space-y-2">
          {attendance.map((a) => {
            const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
            return (
              <button
                key={a.userId}
                onClick={() => setSelectedPlayer(a)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition-colors text-left"
              >
                <Avatar name={a.name} photoUrl={a.photoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{a.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {a.present}/{a.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
          {attendance.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Өгөгдөл алга</p>
          )}
        </div>
      )}

      {tab === 'players' && (
        <div className="space-y-1">
          {players.map((p) => (
            <div key={p.userId} className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} photoUrl={p.photoUrl} />
                <div>
                  <span className="text-sm text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {p.role === 'coach' ? 'Дасгалжуулагч' : (p.position ?? '')}
                  </span>
                </div>
              </div>
              {p.jerseyNumber != null && (
                <span className="text-xs font-semibold text-gray-500">#{p.jerseyNumber}</span>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Гишүүн алга</p>
          )}
        </div>
      )}

      {tab === 'content' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Нийт пост</div>
            <div className="text-2xl font-bold text-gray-900">{content.totalPosts}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Нийт үзэлт</div>
            <div className="text-2xl font-bold text-gray-900">{content.totalViews}</div>
          </div>
          <div className="col-span-2 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">Төрлөөр</div>
            <div className="text-sm text-gray-700 space-y-1">
              {Object.entries(content.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerAttendanceModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}

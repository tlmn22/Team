'use client';

import { useState } from 'react';

export interface AttendanceRow {
  userId: string;
  name: string;
  role: string;
  present: number;
  total: number;
}

export interface PlayerRow {
  userId: string;
  name: string;
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

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {attendance.map((a) => {
            const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
            return (
              <li key={a.userId} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-800">{a.name}</span>
                  <span className="text-xs text-slate-500">
                    {a.present}/{a.total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
          {attendance.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">Өгөгдөл алга</li>
          )}
        </ul>
      )}

      {tab === 'players' && (
        <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {players.map((p) => (
            <li key={p.userId} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm text-slate-800">{p.name}</span>
                <span className="text-xs text-slate-400 ml-2">
                  {p.role === 'coach' ? 'Дасгалжуулагч' : p.position ?? ''}
                </span>
              </div>
              {p.jerseyNumber != null && (
                <span className="text-xs font-semibold text-slate-500">#{p.jerseyNumber}</span>
              )}
            </li>
          ))}
          {players.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">Гишүүн алга</li>
          )}
        </ul>
      )}

      {tab === 'content' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm text-slate-500">Нийт пост</div>
            <div className="text-2xl font-bold text-slate-900">{content.totalPosts}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm text-slate-500">Нийт үзэлт</div>
            <div className="text-2xl font-bold text-slate-900">{content.totalViews}</div>
          </div>
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm text-slate-500 mb-2">Төрлөөр</div>
            <ul className="text-sm text-slate-700 space-y-1">
              {Object.entries(content.byType).map(([type, count]) => (
                <li key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span className="text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

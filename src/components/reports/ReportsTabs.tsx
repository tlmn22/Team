'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AttendanceReport, {
  type ReportPlayer,
  type ReportEvent,
  type ReportAttendanceRow,
  type ReportEventNote,
} from './AttendanceReport';

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
  teamName,
  reportPlayers,
  events,
  attendance,
  eventNotes,
  players,
  content,
}: {
  teamName: string;
  reportPlayers: ReportPlayer[];
  events: ReportEvent[];
  attendance: ReportAttendanceRow[];
  eventNotes: ReportEventNote[];
  players: PlayerRow[];
  content: ContentStats;
}) {
  const t = useTranslations('reports');
  const tRoles = useTranslations('roles');
  const TAB_LABEL: Record<Tab, string> = {
    attendance: t('tabAttendance'),
    players: t('tabPlayers'),
    content: t('tabContent'),
  };
  const [tab, setTab] = useState<Tab>('attendance');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === tabKey
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABEL[tabKey]}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <AttendanceReport
          teamName={teamName}
          players={reportPlayers}
          events={events}
          attendance={attendance}
          eventNotes={eventNotes}
        />
      )}

      {tab === 'players' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-1">
          {players.map((p) => (
            <div key={p.userId} className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} photoUrl={p.photoUrl} />
                <div>
                  <span className="text-sm text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {p.role === 'coach' ? tRoles('coach') : (p.position ?? '')}
                  </span>
                </div>
              </div>
              {p.jerseyNumber != null && (
                <span className="text-xs font-semibold text-gray-500">#{p.jerseyNumber}</span>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">{t('noMembers')}</p>
          )}
        </div>
      )}

      {tab === 'content' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">{t('totalPosts')}</div>
            <div className="text-2xl font-bold text-gray-900">{content.totalPosts}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">{t('totalViews')}</div>
            <div className="text-2xl font-bold text-gray-900">{content.totalViews}</div>
          </div>
          <div className="col-span-2 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">{t('byType')}</div>
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
    </div>
  );
}

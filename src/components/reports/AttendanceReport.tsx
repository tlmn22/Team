'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/Toast';
import type { AttendanceStatus } from '@/lib/actions/attendance';

export interface ReportPlayer {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface ReportEvent {
  id: number;
  title: string;
  type: string;
  date: string;
}

export interface ReportAttendanceRow {
  userId: string;
  eventId: number;
  status: AttendanceStatus;
}

const RISK_THRESHOLD = 75;

type PeriodId = '7' | '30' | 'season';
type Sort = 'risk' | 'pct' | 'name';

interface Cell {
  event: ReportEvent;
  status: AttendanceStatus | null;
}

interface Stats {
  cells: Cell[];
  present: number;
  late: number;
  excused: number;
  absent: number;
  marked: number;
  pct: number;
  streak: number;
}

function cutoffDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name.slice(0, 1).toUpperCase();
}

function computeStats(playerId: string, evs: ReportEvent[], attMap: Map<string, AttendanceStatus>): Stats {
  let present = 0;
  let late = 0;
  let excused = 0;
  let absent = 0;
  let marked = 0;
  const cells: Cell[] = evs.map((e) => {
    const status = attMap.get(`${playerId}:${e.id}`) ?? null;
    if (status) {
      marked++;
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
      else if (status === 'absent') absent++;
    }
    return { event: e, status };
  });
  const pct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0;
  let streak = 0;
  for (let k = cells.length - 1; k >= 0; k--) {
    if (cells[k].status === 'absent') streak++;
    else break;
  }
  return { cells, present, late, excused, absent, marked, pct, streak };
}

function riskScore(s: Stats): number {
  return s.streak * 12 - s.pct;
}
function isAtRisk(s: Stats): boolean {
  return s.marked > 0 && (s.pct < RISK_THRESHOLD || s.streak >= 3);
}

function cellClass(status: AttendanceStatus | null): string {
  if (status === 'present') return 'bg-orange-500';
  if (status === 'late') return 'bg-orange-100 ring-1 ring-inset ring-orange-500';
  if (status === 'excused') return 'bg-gray-200';
  if (status === 'absent') return 'bg-transparent ring-1 ring-inset ring-gray-200';
  return 'bg-gray-50';
}

function Avatar({ name, photoUrl, size = 26 }: { name: string; photoUrl: string | null; size?: number }) {
  return (
    <div
      className="rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export default function AttendanceReport({
  teamName,
  players,
  events,
  attendance,
}: {
  teamName: string;
  players: ReportPlayer[];
  events: ReportEvent[];
  attendance: ReportAttendanceRow[];
}) {
  const t = useTranslations('reports');
  const tEventTypes = useTranslations('eventTypes');
  const tCommon = useTranslations('common');
  const [periodId, setPeriodId] = useState<PeriodId>('30');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('risk');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null);

  const eventTypeLabel = (type: string) => (tEventTypes.has(type) ? tEventTypes(type) : type);
  const statusTitle = (status: AttendanceStatus) => t(status);

  const PERIODS: { id: PeriodId; label: string; title: string; days: number | null }[] = [
    { id: '7', label: t('period7'), title: t('period7Title'), days: 7 },
    { id: '30', label: t('period30'), title: t('period30Title'), days: 30 },
    { id: 'season', label: t('periodSeason'), title: t('periodSeasonTitle'), days: null },
  ];

  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1];

  const attMap = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    for (const a of attendance) m.set(`${a.userId}:${a.eventId}`, a.status);
    return m;
  }, [attendance]);

  const rangeEvents = useMemo(() => {
    if (period.days == null) return events;
    const cutoff = cutoffDateStr(period.days);
    return events.filter((e) => e.date >= cutoff);
  }, [events, period]);

  const prevRangeEvents = useMemo(() => {
    if (period.days == null) return [];
    const cutoff = cutoffDateStr(period.days);
    const prevCutoff = cutoffDateStr(period.days * 2);
    return events.filter((e) => e.date >= prevCutoff && e.date < cutoff);
  }, [events, period]);

  const playerStats = useMemo(
    () => players.map((p) => ({ player: p, stats: computeStats(p.id, rangeEvents, attMap) })),
    [players, rangeEvents, attMap]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? playerStats.filter((r) => r.player.name.toLowerCase().includes(q)) : playerStats.slice();
    const hasData = (r: (typeof list)[number]) => (r.stats.marked > 0 ? 1 : 0);
    const cmp: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      name: (a, b) => a.player.name.localeCompare(b.player.name),
      pct: (a, b) => hasData(b) - hasData(a) || b.stats.pct - a.stats.pct,
      risk: (a, b) => hasData(b) - hasData(a) || riskScore(b.stats) - riskScore(a.stats),
    };
    list = list.slice().sort(cmp[sort]);
    return list;
  }, [playerStats, query, sort]);

  const teamStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let marked = 0;
    for (const { stats } of playerStats) {
      present += stats.present;
      late += stats.late;
      marked += stats.marked;
    }
    return { pct: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0, late, marked };
  }, [playerStats]);

  const prevTeamPct = useMemo(() => {
    if (period.days == null || prevRangeEvents.length === 0) return null;
    let present = 0;
    let late = 0;
    let marked = 0;
    for (const p of players) {
      const s = computeStats(p.id, prevRangeEvents, attMap);
      present += s.present;
      late += s.late;
      marked += s.marked;
    }
    return marked > 0 ? Math.round(((present + late) / marked) * 100) : null;
  }, [period, prevRangeEvents, players, attMap]);

  const riskPlayers = useMemo(
    () =>
      playerStats
        .filter((r) => isAtRisk(r.stats))
        .sort((a, b) => a.stats.pct - b.stats.pct),
    [playerStats]
  );

  const eventStats = useMemo(
    () =>
      rangeEvents.map((e) => {
        let n = 0;
        let marked = 0;
        for (const p of players) {
          const st = attMap.get(`${p.id}:${e.id}`);
          if (st) {
            marked++;
            if (st === 'present' || st === 'late') n++;
          }
        }
        return { event: e, n, marked, pct: marked > 0 ? Math.round((n / marked) * 100) : 0 };
      }),
    [rangeEvents, players, attMap]
  );

  const worstEvent = useMemo(() => {
    const marked = eventStats.filter((s) => s.marked > 0);
    if (marked.length === 0) return null;
    return marked.slice().sort((a, b) => a.pct - b.pct)[0];
  }, [eventStats]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const found = playerStats.find((r) => r.player.id === selectedId);
    if (!found) return null;
    const prevStats = computeStats(selectedId, prevRangeEvents, attMap);
    return { ...found, prevStats };
  }, [selectedId, playerStats, prevRangeEvents, attMap]);

  function handleExport() {
    const header = [
      t('csvHeaderName'),
      t('csvHeaderPct'),
      t('csvHeaderPresent'),
      t('csvHeaderLate'),
      t('csvHeaderExcused'),
      t('csvHeaderAbsent'),
    ];
    const lines = [header.join(',')];
    for (const { player, stats } of rows) {
      lines.push(
        [player.name, stats.marked > 0 ? stats.pct : '', stats.present, stats.late, stats.excused, stats.absent]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${period.id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t('exported'));
  }

  const muted = 'text-gray-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-gray-400">
          {teamName} · {period.title} · {t('practicesCount', { count: rangeEvents.length })}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-0.5 gap-0.5 rounded-lg bg-gray-100">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPeriodId(p.id);
                  setSelectedId(null);
                  setHighlightedEventId(null);
                }}
                title={p.title}
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  p.id === periodId ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlayer')}
            className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-1.5 w-40 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleExport}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition"
          >
            {t('exportReport')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label={t('teamAttendance')}
          value={`${teamStats.pct}%`}
          hint={t('practicesAverage', { count: rangeEvents.length })}
          delta={prevTeamPct != null ? teamStats.pct - prevTeamPct : null}
        />
        <KpiCard
          label={t('watchOut')}
          value={String(riskPlayers.length)}
          unit={t('athletes')}
          hint={t('watchOutHint', { threshold: RISK_THRESHOLD })}
        />
        <KpiCard label={t('lateness')} value={String(teamStats.late)} unit={t('incidents')} hint={t('cameLateAnyway')} />
        <KpiCard
          label={t('worstPractice')}
          value={worstEvent ? `${worstEvent.pct}%` : '—'}
          hint={worstEvent ? `${fmtDate(worstEvent.event.date)} · ${eventTypeLabel(worstEvent.event.type)}` : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {rangeEvents.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm font-semibold text-gray-900">{t('practiceAttendance')}</div>
                <div className={`text-xs ${muted}`}>{t('clickColumnHint')}</div>
              </div>
              <div className="flex items-end gap-1 h-24 overflow-hidden">
                {eventStats.map((s) => {
                  const active = highlightedEventId === s.event.id;
                  return (
                    <button
                      key={s.event.id}
                      onClick={() => setHighlightedEventId(active ? null : s.event.id)}
                      title={`${fmtDate(s.event.date)} · ${eventTypeLabel(s.event.type)} · ${s.n}/${players.length}`}
                      className={`flex-1 min-w-0 flex flex-col justify-end items-center gap-1 h-full rounded-t-md ${
                        active ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div
                        className={`w-full rounded-t ${active ? 'bg-orange-500' : s.pct < 70 ? 'bg-orange-300' : 'bg-orange-400'}`}
                        style={{ height: Math.max(4, Math.round(s.pct * 0.62)) }}
                      />
                      <div className={`text-[9px] whitespace-nowrap pb-1 ${active ? 'text-orange-600' : muted}`}>
                        {fmtDate(s.event.date)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">{t('athletesXPractices')}</div>
                <div className={`text-xs mt-0.5 ${muted}`}>{t('shownAndClickHint', { count: rows.length })}</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  <Legend color="bg-orange-500" label={t('present')} />
                  <Legend color="bg-orange-100 ring-1 ring-inset ring-orange-500" label={t('late')} />
                  <Legend color="bg-gray-200" label={t('excused')} />
                  <Legend color="bg-transparent ring-1 ring-inset ring-gray-300" label={t('absent')} />
                  <Legend color="bg-gray-50 ring-1 ring-inset ring-gray-100" label={t('noAttendanceData')} />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none"
                >
                  <option value="risk">{t('sortByRisk')}</option>
                  <option value="pct">{t('sortByPct')}</option>
                  <option value="name">{t('sortByName')}</option>
                </select>
              </div>
            </div>

            {rangeEvents.length === 0 || rows.length === 0 ? (
              <p className={`text-sm text-center py-8 ${muted}`}>{t('noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block">
                  <div className="flex items-end gap-0 px-4 pb-2 border-b border-gray-100">
                    <div className="w-40 flex-shrink-0 text-[10px] uppercase tracking-wide text-gray-400 sticky left-0 bg-white">
                      {t('athleteColumn')}
                    </div>
                    <div className="flex gap-1">
                      {rangeEvents.map((e) => (
                        <div
                          key={e.id}
                          title={`${fmtDate(e.date)} · ${eventTypeLabel(e.type)}`}
                          className={`w-6 text-center text-[9px] ${
                            highlightedEventId === e.id ? 'text-orange-600' : 'text-gray-400'
                          }`}
                        >
                          <div>{fmtDate(e.date)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="w-32 flex-shrink-0 text-right text-[10px] uppercase tracking-wide text-gray-400">
                      {t('irtsColumn')}
                    </div>
                  </div>

                  {rows.map(({ player, stats }) => {
                    const isSelected = selectedId === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => setSelectedId(isSelected ? null : player.id)}
                        className={`w-full flex items-center px-4 h-10 border-b border-gray-50 last:border-0 transition-colors hover:bg-orange-50/50 ${
                          isSelected ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div
                          className={`w-40 flex-shrink-0 flex items-center gap-2 min-w-0 sticky left-0 ${
                            isSelected ? 'bg-orange-50' : 'bg-white'
                          }`}
                        >
                          <Avatar name={player.name} photoUrl={player.photoUrl} />
                          <div className="min-w-0 text-left">
                            <div className="text-xs text-gray-900 truncate">{player.name}</div>
                            {stats.streak >= 3 && (
                              <div className="text-[10px] text-gray-400 truncate">{t('inARow', { count: stats.streak })}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {stats.cells.map((c, j) => {
                            const dimmed = highlightedEventId != null && highlightedEventId !== c.event.id;
                            return (
                              <div
                                key={j}
                                title={`${fmtDate(c.event.date)} · ${c.status ? statusTitle(c.status) : t('noAttendanceData')}`}
                                className={`w-6 h-5 rounded ${cellClass(c.status)} ${dimmed ? 'opacity-30' : ''}`}
                              />
                            );
                          })}
                        </div>
                        <div className="w-32 flex-shrink-0 flex items-center justify-end gap-2">
                          <div className="w-14 h-1 rounded-full bg-gray-100 overflow-hidden">
                            {stats.marked > 0 && (
                              <div
                                className={`h-full rounded-full ${stats.pct < RISK_THRESHOLD ? 'bg-orange-300' : 'bg-orange-500'}`}
                                style={{ width: `${stats.pct}%` }}
                              />
                            )}
                          </div>
                          <div
                            className={`text-xs tabular-nums min-w-[32px] text-right ${
                              stats.marked === 0 ? 'text-gray-300' : stats.pct < RISK_THRESHOLD ? 'text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            {stats.marked > 0 ? `${stats.pct}%` : '—'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {selected && (
            <section className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
              <div className="flex items-start gap-2.5 p-4 border-b border-gray-100">
                <Avatar name={selected.player.name} photoUrl={selected.player.photoUrl} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{selected.player.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {selected.stats.marked === 0
                      ? t('noAttendanceData')
                      : selected.stats.streak >= 2
                        ? t('streakAbsent', { count: selected.stats.streak })
                        : selected.stats.pct < RISK_THRESHOLD
                          ? t('belowThreshold', { count: selected.stats.absent })
                          : t('stable')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm px-1"
                  aria-label={tCommon('close')}
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-semibold text-gray-900">
                    {selected.stats.marked > 0 ? `${selected.stats.pct}%` : '—'}
                  </div>
                  {selected.prevStats.marked > 0 && (
                    <div className={`text-[11px] ${selected.stats.pct - selected.prevStats.pct >= 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {selected.stats.pct - selected.prevStats.pct >= 0 ? '▲ ' : '▼ '}
                      {t('vsPrevPeriod', {
                        delta:
                          (selected.stats.pct - selected.prevStats.pct >= 0 ? '+' : '') +
                          (selected.stats.pct - selected.prevStats.pct),
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { n: selected.stats.present, label: t('present') },
                    { n: selected.stats.late, label: t('late') },
                    { n: selected.stats.excused, label: t('excused') },
                    { n: selected.stats.absent, label: t('absent') },
                  ].map((b) => (
                    <div key={b.label} className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-2">
                      <div className="text-sm font-semibold text-gray-900">{b.n}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{b.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-gray-400 mt-4 mb-2">
                  {t('last10Practices')}
                </div>
                <div className="flex flex-col gap-1">
                  {selected.stats.cells
                    .slice(-10)
                    .reverse()
                    .map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <div className={`w-2 h-2 rounded-sm ${cellClass(c.status)}`} />
                        <div className="text-gray-500 w-11">{fmtDate(c.event.date)}</div>
                        <div className="flex-1 text-gray-500 truncate">{eventTypeLabel(c.event.type)}</div>
                        <div className={c.status === 'absent' ? 'text-orange-600' : 'text-gray-500'}>
                          {c.status ? statusTitle(c.status) : t('noAttendanceData')}
                        </div>
                      </div>
                    ))}
                  {selected.stats.cells.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">{t('noPractices')}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-semibold text-gray-900">{t('watchOutAthletes')}</div>
              <div className="text-xs text-orange-600">{riskPlayers.length}</div>
            </div>
            {riskPlayers.slice(0, 5).map(({ player, stats }) => (
              <button
                key={player.id}
                onClick={() => setSelectedId(player.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 border-t border-gray-50 hover:bg-orange-50/50 transition-colors text-left"
              >
                <Avatar name={player.name} photoUrl={player.photoUrl} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-900 truncate">{player.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {stats.streak >= 3 ? t('streakAbsent', { count: stats.streak }) : t('belowThreshold', { count: stats.absent })}
                  </div>
                </div>
                <div className="text-xs tabular-nums text-orange-600">{stats.pct}%</div>
              </button>
            ))}
            {riskPlayers.length === 0 && (
              <p className="px-4 py-4 text-xs text-gray-400 border-t border-gray-100">
                {t('noRiskAthletes', { threshold: RISK_THRESHOLD })}
              </p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2.5">{t('perPractice')}</div>
            {eventStats
              .slice(-5)
              .reverse()
              .map((s) => (
                <div key={s.event.id} className="flex items-center gap-2.5 py-1.5 text-[11.5px]">
                  <div className="w-12 text-gray-500">{fmtDate(s.event.date)}</div>
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-gray-500">
                    {s.n}/{players.length} · {s.pct}%
                  </div>
                </div>
              ))}
            {eventStats.length === 0 && <p className="text-xs text-gray-400 text-center py-2">{t('noPractices')}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  hint,
  delta,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
  delta?: number | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
        {delta != null && (
          <div className={`text-[11px] ${delta >= 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {delta >= 0 ? '+' : ''}
            {delta}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mt-2">
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {unit && <div className="text-xs text-gray-400">{unit}</div>}
      </div>
      <div className="text-[11px] text-gray-400 mt-1">{hint}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

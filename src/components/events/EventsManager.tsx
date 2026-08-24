'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import EventFormModal, { type EventFormValues } from './EventFormModal';

const TYPE_DOT: Record<string, string> = {
  practice: 'bg-orange-500',
  meeting: 'bg-blue-500',
  game: 'bg-purple-500',
  other: 'bg-gray-400',
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

export default function EventsManager({
  teamId,
  canManage,
  events,
}: {
  teamId: number;
  canManage: boolean;
  events: EventFormValues[];
}) {
  const t = useTranslations('events');
  const tEventTypes = useTranslations('eventTypes');
  const tCommon = useTranslations('common');
  const MONTH_LABEL = tCommon.raw('months') as string[];
  const WEEKDAYS = tCommon.raw('weekdaysShort') as string[];
  const router = useRouter();
  const today = todayStr();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [formTarget, setFormTarget] = useState<EventFormValues | 'new' | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>(undefined);

  function refresh() {
    router.refresh();
  }

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventFormValues[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((firstDow + daysInMonth) / 7) * 7;

    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - firstDow + 1;
      const date = new Date(year, month, dayNum);
      return { date, inMonth: dayNum >= 1 && dayNum <= daysInMonth };
    });
  }, [cursor]);

  function openCreate(date?: string) {
    setFormDefaultDate(date);
    setFormTarget('new');
  }

  const selectedEvents = (eventsByDate.get(selectedDate) ?? [])
    .slice()
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        {canManage && (
          <button
            onClick={() => openCreate(selectedDate)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {t('add')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1 rounded-lg hover:bg-gray-50 text-gray-500 text-sm"
            aria-label={t('prevMonth')}
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {MONTH_LABEL[cursor.getMonth()]} · {cursor.getFullYear()}
            </span>
            <button
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelectedDate(today);
              }}
              className="text-[11px] text-orange-600 hover:underline"
            >
              {t('today')}
            </button>
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1 rounded-lg hover:bg-gray-50 text-gray-500 text-sm"
            aria-label={t('nextMonth')}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-gray-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-0.5">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(({ date, inMonth }) => {
            const dateStr = toDateStr(date);
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-9 rounded-md flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isSelected
                    ? 'bg-orange-50 ring-1 ring-orange-500'
                    : inMonth
                      ? 'hover:bg-gray-50'
                      : 'opacity-40 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-orange-500 text-white font-semibold' : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="flex gap-0.5 justify-center h-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`w-1 h-1 rounded-full ${TYPE_DOT[e.type] ?? TYPE_DOT.other}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">{selectedDate}</h2>
          {canManage && (
            <button
              onClick={() => openCreate(selectedDate)}
              className="text-xs text-orange-600 hover:underline font-medium"
            >
              {t('addToDay')}
            </button>
          )}
        </div>
        {selectedEvents.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">{t('empty')}</p>
        ) : (
          <div className="space-y-1">
            {selectedEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[e.type] ?? TYPE_DOT.other}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600 truncate">
                      {e.title}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {tEventTypes.has(e.type) ? tEventTypes(e.type) : e.type}
                      {e.time ? ` · ${e.time.slice(0, 5)}` : ''}
                      {e.location ? ` · ${e.location}` : ''}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {formTarget && (
        <EventFormModal
          teamId={teamId}
          event={formTarget === 'new' ? null : formTarget}
          defaultDate={formTarget === 'new' ? formDefaultDate : undefined}
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

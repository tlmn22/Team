'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { toast } from '@/components/Toast';
import { createEvent, updateEvent } from '@/lib/actions/events';

export interface EventFormValues {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string | null;
  location: string | null;
  description: string | null;
}

const TYPE_VALUES = ['practice', 'meeting', 'game', 'other'];

export default function EventFormModal({
  teamId,
  event,
  defaultDate,
  onClose,
  onSaved,
}: {
  teamId: number;
  event: EventFormValues | null;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('events');
  const tEventTypes = useTranslations('eventTypes');
  const tCommon = useTranslations('common');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = event
        ? await updateEvent(event.id, teamId, formData)
        : await createEvent(teamId, formData);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(event ? t('updated') : t('created'));
        onSaved();
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={event ? t('editTitle') : t('createTitle')}>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('eventTitle')}</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={event?.title}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
          <select
            name="type"
            defaultValue={event?.type ?? 'practice'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {tEventTypes(v)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={event?.date ?? defaultDate}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('time', { optional: tCommon('optional') })}
            </label>
            <input
              name="time"
              type="time"
              defaultValue={event?.time ?? ''}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('location', { optional: tCommon('optional') })}
          </label>
          <input
            name="location"
            type="text"
            defaultValue={event?.location ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description', { optional: tCommon('optional') })}
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={event?.description ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
        >
          {pending ? tCommon('saving') : tCommon('save')}
        </button>
      </form>
    </Modal>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/Toast';
import { deleteEvent } from '@/lib/actions/events';
import EventFormModal, { type EventFormValues } from './EventFormModal';

export default function EventDetailActions({
  event,
  teamId,
}: {
  event: EventFormValues;
  teamId: number;
}) {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(t('confirmDelete', { title: event.title }))) return;
    startTransition(async () => {
      const res = await deleteEvent(event.id, teamId);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        toast(t('deleted'));
        router.push('/events');
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-gray-500 hover:text-orange-600"
        >
          {tCommon('edit')}
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {tCommon('delete')}
        </button>
      </div>

      {editing && (
        <EventFormModal
          teamId={teamId}
          event={event}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

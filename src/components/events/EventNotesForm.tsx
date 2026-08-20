'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import RichTextEditor from '@/components/RichTextEditor';
import { addEventNote, deleteEventNote } from '@/lib/actions/event-notes';

export interface EventNote {
  id: number;
  content: string;
  authorName: string | null;
}

export default function EventNotesForm({
  eventId,
  teamId,
  notes,
  canManage,
}: {
  eventId: number;
  teamId: number;
  notes: EventNote[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await addEventNote(eventId, teamId, content);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        setContent('');
        setEditorKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  function handleDelete(noteId: number) {
    if (!confirm('Энэ тэмдэглэлийг устгах уу?')) return;
    startTransition(async () => {
      const res = await deleteEventNote(noteId, eventId, teamId);
      if (res.error) {
        toast(res.error, 'error');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="space-y-2">
          <RichTextEditor
            key={editorKey}
            data={content}
            onChange={setContent}
            placeholder="Бэлтгэлийн тэмдэглэл бичих..."
          />
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Нэмэх
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div
                className="rich-text-content text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: n.content }}
              />
              <p className="text-xs text-gray-400 mt-1">{n.authorName ?? '—'}</p>
            </div>
            {canManage && (
              <button
                onClick={() => handleDelete(n.id)}
                disabled={pending}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 flex-shrink-0"
              >
                Устгах
              </button>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Тэмдэглэл алга</p>
        )}
      </div>
    </div>
  );
}

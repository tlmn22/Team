'use server';

import { revalidatePath } from 'next/cache';
import DOMPurify from 'isomorphic-dompurify';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'];

export async function addEventNote(
  eventId: number,
  teamId: number,
  content: string
): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!(await canManageTeam(teamId))) return { error: 'Энэ багийг удирдах эрхгүй байна' };

  const clean = DOMPurify.sanitize(content, { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'target', 'rel'] });
  const isEmpty = clean.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;
  if (isEmpty) return { error: 'Тэмдэглэл оруулна уу' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('event_notes')
    .insert({ event_id: eventId, content: clean, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return {};
}

export async function deleteEventNote(
  noteId: number,
  eventId: number,
  teamId: number
): Promise<{ error?: string }> {
  await requireUser();
  if (!(await canManageTeam(teamId))) return { error: 'Энэ багийг удирдах эрхгүй байна' };

  const admin = createAdminClient();
  const { error } = await admin.from('event_notes').delete().eq('id', noteId).eq('event_id', eventId);
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return {};
}

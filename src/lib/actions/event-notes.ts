'use server';

import { revalidatePath } from 'next/cache';
import sanitizeHtml from 'sanitize-html';
import { getTranslations } from 'next-intl/server';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTRIBUTES = { a: ['href', 'target', 'rel'] };

export async function addEventNote(
  eventId: number,
  teamId: number,
  content: string
): Promise<{ error?: string }> {
  const user = await requireUser();
  const t = await getTranslations('events');
  if (!(await canManageTeam(teamId))) return { error: t('cannotManageTeam') };

  const clean = sanitizeHtml(content, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
  const isEmpty = clean.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;
  if (isEmpty) return { error: t('noteRequired') };

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
  const t = await getTranslations('events');
  if (!(await canManageTeam(teamId))) return { error: t('cannotManageTeam') };

  const admin = createAdminClient();
  const { error } = await admin.from('event_notes').delete().eq('id', noteId).eq('event_id', eventId);
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return {};
}

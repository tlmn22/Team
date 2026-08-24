'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const EVENT_TYPES = ['practice', 'meeting', 'game', 'other'] as const;

async function assertCanManageTeam(teamId: number) {
  await requireUser();
  if (!(await canManageTeam(teamId))) {
    const t = await getTranslations('events');
    throw new Error(t('cannotManageTeam'));
  }
}

async function parseEventFields(formData: FormData) {
  const t = await getTranslations('events');
  const title = String(formData.get('title') ?? '').trim();
  const type = String(formData.get('type') ?? 'practice');
  const date = String(formData.get('date') ?? '').trim();
  const time = String(formData.get('time') ?? '').trim() || null;
  const location = String(formData.get('location') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!title) return { error: t('titleRequired') } as const;
  if (!date) return { error: t('dateRequired') } as const;
  if (!EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    return { error: t('invalidType') } as const;
  }

  return { title, type, date, time, location, description } as const;
}

export async function createEvent(
  teamId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const fields = await parseEventFields(formData);
  if ('error' in fields) return { error: fields.error };

  const user = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from('events').insert({ team_id: teamId, created_by: user.id, ...fields });
  if (error) return { error: error.message };

  revalidatePath('/events');
  return {};
}

export async function updateEvent(
  eventId: number,
  teamId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const fields = await parseEventFields(formData);
  if ('error' in fields) return { error: fields.error };

  const admin = createAdminClient();
  const { error } = await admin.from('events').update(fields).eq('id', eventId).eq('team_id', teamId);
  if (error) return { error: error.message };

  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  return {};
}

export async function deleteEvent(eventId: number, teamId: number): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const admin = createAdminClient();
  const { error } = await admin.from('events').delete().eq('id', eventId).eq('team_id', teamId);
  if (error) return { error: error.message };

  revalidatePath('/events');
  return {};
}

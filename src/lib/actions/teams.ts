'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { requireUser, isSuperAdmin, canManageClub, getMyClubs } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImageIfProvided } from '@/lib/actions/upload-image';

export interface ManageableClub {
  id: number;
  name: string;
}

export interface TeamWithCounts {
  id: number;
  club_id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  coach_count: number;
  player_count: number;
}

const LOGO_BUCKET = 'team-logos';

async function assertCanManageClub(clubId: number) {
  await requireUser();
  if (!(await canManageClub(clubId))) {
    const t = await getTranslations('teams');
    throw new Error(t('cannotManageClub'));
  }
}

/** teams.php: superadmin -> бүх клуб; manager -> удирддаг клубууд */
export async function getManageableClubs(): Promise<ManageableClub[]> {
  await requireUser();
  const admin = createAdminClient();

  if (await isSuperAdmin()) {
    const { data } = await admin
      .from('clubs')
      .select('id, name')
      .eq('active', true)
      .order('name');
    return data ?? [];
  }

  const myClubs = await getMyClubs();
  return myClubs.filter((c) => c.my_role === 'manager').map((c) => ({ id: c.id, name: c.name }));
}

export async function listTeamsForClub(clubId: number): Promise<TeamWithCounts[]> {
  await requireUser();
  if (!(await canManageClub(clubId))) return [];

  const admin = createAdminClient();
  const { data: teams } = await admin
    .from('teams')
    .select('id, club_id, name, description, logo_url, active')
    .eq('club_id', clubId)
    .eq('active', true)
    .order('name');
  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id);
  const { data: members } = await admin
    .from('team_members')
    .select('team_id, role')
    .in('team_id', teamIds)
    .eq('active', true);

  return teams.map((t) => ({
    ...t,
    coach_count: (members ?? []).filter((m) => m.team_id === t.id && m.role === 'coach').length,
    player_count: (members ?? []).filter((m) => m.team_id === t.id && m.role === 'player').length,
  }));
}

export async function createTeam(
  clubId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageClub(clubId);
  const t = await getTranslations('teams');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) return { error: t('nameRequired') };

  const user = await requireUser();
  const admin = createAdminClient();
  const { data: team, error } = await admin
    .from('teams')
    .insert({ club_id: clubId, name, description, created_by: user.id })
    .select('id')
    .single();
  if (error || !team) return { error: error?.message ?? t('createFailed') };

  const logo = await uploadImageIfProvided(admin, formData, 'logo', LOGO_BUCKET, `team-${team.id}`);
  if (logo.error) return { error: logo.error };
  if (logo.url) {
    await admin.from('teams').update({ logo_url: logo.url }).eq('id', team.id);
  }

  revalidatePath('/teams');
  return {};
}

export async function updateTeam(
  teamId: number,
  clubId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageClub(clubId);
  const t = await getTranslations('teams');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) return { error: t('nameRequired') };

  const admin = createAdminClient();

  const logo = await uploadImageIfProvided(admin, formData, 'logo', LOGO_BUCKET, `team-${teamId}`);
  if (logo.error) return { error: logo.error };

  const { error } = await admin
    .from('teams')
    .update({ name, description, ...(logo.url ? { logo_url: logo.url } : {}) })
    .eq('id', teamId);
  if (error) return { error: error.message };

  revalidatePath('/teams');
  return {};
}

export async function deleteTeam(teamId: number, clubId: number): Promise<{ error?: string }> {
  await assertCanManageClub(clubId);
  const admin = createAdminClient();
  const { error } = await admin.from('teams').update({ active: false }).eq('id', teamId);
  if (error) return { error: error.message };

  revalidatePath('/teams');
  return {};
}

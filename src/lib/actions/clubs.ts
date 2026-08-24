'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { requireUser, isSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ClubWithCounts {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  team_count: number;
  member_count: number;
}

export interface ClubManager {
  user_id: string;
  name: string;
  phone: string | null;
  role: 'manager' | 'owner';
}

export interface UserSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

async function assertSuperAdmin() {
  await requireUser();
  if (!(await isSuperAdmin())) {
    const t = await getTranslations('common');
    throw new Error(t('forbidden'));
  }
}

export async function listClubs(): Promise<ClubWithCounts[]> {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: clubs } = await admin
    .from('clubs')
    .select('id, name, description, active')
    .eq('active', true)
    .order('name');
  if (!clubs || clubs.length === 0) return [];

  const clubIds = clubs.map((c) => c.id);
  const { data: teams } = await admin.from('teams').select('id, club_id').in('club_id', clubIds);
  const { data: members } = await admin
    .from('club_members')
    .select('club_id')
    .in('club_id', clubIds);

  return clubs.map((c) => ({
    ...c,
    team_count: (teams ?? []).filter((t) => t.club_id === c.id).length,
    member_count: (members ?? []).filter((m) => m.club_id === c.id).length,
  }));
}

export async function createClub(formData: FormData): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('clubs');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) return { error: t('nameRequired') };

  const user = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from('clubs').insert({ name, description, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

export async function updateClub(
  clubId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('clubs');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) return { error: t('nameRequired') };

  const admin = createAdminClient();
  const { error } = await admin.from('clubs').update({ name, description }).eq('id', clubId);
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

export async function deleteClub(clubId: number): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('clubs').update({ active: false }).eq('id', clubId);
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

export async function getClubManagers(clubId: number): Promise<ClubManager[]> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('club_members')
    .select('user_id, role, profiles!inner(name, phone)')
    .eq('club_id', clubId);

  return (data ?? []).map((row) => {
    const p = row.profiles as unknown as { name: string; phone: string | null };
    return { user_id: row.user_id, name: p.name, phone: p.phone, role: row.role as 'manager' | 'owner' };
  });
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  await assertSuperAdmin();
  const q = query.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, name, phone, email')
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(10);

  return data ?? [];
}

export async function addExistingManager(
  clubId: number,
  userId: string,
  role: 'manager' | 'owner'
): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('club_members')
    .upsert({ club_id: clubId, user_id: userId, role }, { onConflict: 'club_id,user_id' });
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

export async function createManagerUser(
  clubId: number,
  name: string,
  phone: string,
  role: 'manager' | 'owner'
): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('common');
  const trimmedName = name.trim();
  if (!trimmedName) return { error: t('nameRequired') };

  const admin = createAdminClient();
  const { error } = await admin.rpc('create_club_manager', {
    p_club_id: clubId,
    p_name: trimmedName,
    p_phone: phone.trim(),
    p_role: role,
  });
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

export async function removeManager(clubId: number, userId: string): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { error: error.message };

  revalidatePath('/clubs');
  return {};
}

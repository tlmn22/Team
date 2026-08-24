'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImageIfProvided } from '@/lib/actions/upload-image';

const PHOTO_BUCKET = 'member-photos';

export interface TeamMember {
  userId: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  role: 'coach' | 'player';
  jerseyNumber: number | null;
  position: string | null;
}

async function assertCanManageTeam(teamId: number) {
  await requireUser();
  if (!(await canManageTeam(teamId))) {
    const t = await getTranslations('members');
    throw new Error(t('cannotManageTeam'));
  }
}

export async function listTeamMembers(teamId: number): Promise<TeamMember[]> {
  await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from('team_members')
    .select('user_id, role, jersey_number, position, profiles!inner(name, phone, photo_url)')
    .eq('team_id', teamId)
    .eq('active', true)
    .order('role');

  return (data ?? []).map((row) => {
    const p = row.profiles as unknown as { name: string; phone: string | null; photo_url: string | null };
    return {
      userId: row.user_id,
      name: p.name,
      phone: p.phone,
      photoUrl: p.photo_url,
      role: row.role as 'coach' | 'player',
      jerseyNumber: row.jersey_number,
      position: row.position,
    };
  });
}

export async function addMember(
  teamId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const t = await getTranslations('members');
  const tCommon = await getTranslations('common');
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const role = String(formData.get('role') ?? 'player');
  const jerseyRaw = String(formData.get('jersey_number') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim() || null;

  if (!name) return { error: tCommon('nameRequired') };
  if (role !== 'coach' && role !== 'player') return { error: t('invalidRole') };

  const admin = createAdminClient();
  const { data: newUserId, error } = await admin.rpc('create_team_member', {
    p_team_id: teamId,
    p_name: name,
    p_phone: phone,
    p_role: role,
    p_jersey_number: role === 'player' && jerseyRaw ? Number(jerseyRaw) : null,
    p_position: role === 'player' ? position : null,
  });
  if (error) return { error: error.message };

  const photo = await uploadImageIfProvided(admin, formData, 'photo', PHOTO_BUCKET, `member-${newUserId}`);
  if (photo.error) return { error: photo.error };
  if (photo.url) {
    await admin.from('profiles').update({ photo_url: photo.url }).eq('id', newUserId);
  }

  revalidatePath('/members');
  return {};
}

export async function updateMember(
  teamId: number,
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const t = await getTranslations('members');
  const role = String(formData.get('role') ?? 'player');
  const jerseyRaw = String(formData.get('jersey_number') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim() || null;

  if (role !== 'coach' && role !== 'player') return { error: t('invalidRole') };

  const admin = createAdminClient();

  const photo = await uploadImageIfProvided(admin, formData, 'photo', PHOTO_BUCKET, `member-${userId}`);
  if (photo.error) return { error: photo.error };
  if (photo.url) {
    await admin.from('profiles').update({ photo_url: photo.url }).eq('id', userId);
  }

  const { error } = await admin
    .from('team_members')
    .update({
      role,
      jersey_number: role === 'player' && jerseyRaw ? Number(jerseyRaw) : null,
      position: role === 'player' ? position : null,
    })
    .eq('team_id', teamId)
    .eq('user_id', userId);
  if (error) return { error: error.message };

  revalidatePath('/members');
  return {};
}

export async function removeMember(
  teamId: number,
  userId: string
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const admin = createAdminClient();
  const { error } = await admin
    .from('team_members')
    .update({ active: false })
    .eq('team_id', teamId)
    .eq('user_id', userId);
  if (error) return { error: error.message };

  revalidatePath('/members');
  return {};
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TeamMember {
  userId: string;
  name: string;
  phone: string | null;
  role: 'coach' | 'player';
  jerseyNumber: number | null;
  position: string | null;
}

async function assertCanManageTeam(teamId: number) {
  await requireUser();
  if (!(await canManageTeam(teamId))) {
    throw new Error('Энэ багийг удирдах эрхгүй байна');
  }
}

export async function listTeamMembers(teamId: number): Promise<TeamMember[]> {
  await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from('team_members')
    .select('user_id, role, jersey_number, position, profiles!inner(name, phone)')
    .eq('team_id', teamId)
    .eq('active', true)
    .order('role');

  return (data ?? []).map((row) => {
    const p = row.profiles as unknown as { name: string; phone: string | null };
    return {
      userId: row.user_id,
      name: p.name,
      phone: p.phone,
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
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const role = String(formData.get('role') ?? 'player');
  const jerseyRaw = String(formData.get('jersey_number') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim() || null;

  if (!name) return { error: 'Нэр оруулна уу' };
  if (role !== 'coach' && role !== 'player') return { error: 'Буруу эрх' };

  const admin = createAdminClient();
  const { error } = await admin.rpc('create_team_member', {
    p_team_id: teamId,
    p_name: name,
    p_phone: phone,
    p_role: role,
    p_jersey_number: role === 'player' && jerseyRaw ? Number(jerseyRaw) : null,
    p_position: role === 'player' ? position : null,
  });
  if (error) return { error: error.message };

  revalidatePath('/members');
  return {};
}

export async function updateMember(
  teamId: number,
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertCanManageTeam(teamId);
  const role = String(formData.get('role') ?? 'player');
  const jerseyRaw = String(formData.get('jersey_number') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim() || null;

  if (role !== 'coach' && role !== 'player') return { error: 'Буруу эрх' };

  const admin = createAdminClient();
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

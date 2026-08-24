'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { requireUser, isSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface UserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  system_role: 'superadmin' | 'user';
  active: boolean;
  hasLogin: boolean;
}

async function assertSuperAdmin() {
  await requireUser();
  if (!(await isSuperAdmin())) {
    const t = await getTranslations('users');
    throw new Error(t('forbidden'));
  }
}

export async function listUsers(): Promise<UserRow[]> {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, name, email, phone, system_role, active, auth_user_id')
    .eq('active', true)
    .order('name');

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    system_role: u.system_role,
    active: u.active,
    hasLogin: u.auth_user_id !== null,
  }));
}

export async function createUser(formData: FormData): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('users');
  const tCommon = await getTranslations('common');
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const systemRole = String(formData.get('system_role') ?? 'user');

  if (!name) return { error: tCommon('nameRequired') };
  if (!email) return { error: t('emailRequired') };
  if (password.length < 6) return { error: t('passwordTooShort') };
  if (systemRole !== 'superadmin' && systemRole !== 'user') return { error: t('invalidRole') };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return { error: t('emailTaken') };

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) return { error: authError?.message ?? t('accountCreateFailed') };

  const { error: profileError } = await admin.from('profiles').insert({
    auth_user_id: authUser.user.id,
    name,
    email,
    phone,
    system_role: systemRole,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/users');
  return {};
}

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('users');
  const tCommon = await getTranslations('common');
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const systemRole = String(formData.get('system_role') ?? 'user');
  const newPassword = String(formData.get('password') ?? '');

  if (!name) return { error: tCommon('nameRequired') };
  if (systemRole !== 'superadmin' && systemRole !== 'user') return { error: t('invalidRole') };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('auth_user_id')
    .eq('id', userId)
    .maybeSingle();

  if (newPassword) {
    if (newPassword.length < 6) return { error: t('passwordTooShort') };
    if (!profile?.auth_user_id) return { error: t('cannotSetPasswordNoLogin') };
    const { error: pwError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      password: newPassword,
    });
    if (pwError) return { error: pwError.message };
  }

  const { error } = await admin
    .from('profiles')
    .update({ name, phone, system_role: systemRole })
    .eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/users');
  return {};
}

export async function grantLogin(
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await assertSuperAdmin();
  const t = await getTranslations('users');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email) return { error: t('emailRequired') };
  if (password.length < 6) return { error: t('passwordTooShort') };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, auth_user_id')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return { error: t('userNotFound') };
  if (profile.auth_user_id) return { error: t('alreadyHasLogin') };

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .neq('id', userId)
    .maybeSingle();
  if (existing) return { error: t('emailTaken') };

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) return { error: authError?.message ?? t('accountCreateFailed') };

  const { error: profileError } = await admin
    .from('profiles')
    .update({ auth_user_id: authUser.user.id, email })
    .eq('id', userId);
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/users');
  return {};
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const me = await requireUser();
  const t = await getTranslations('users');
  if (!(await isSuperAdmin())) return { error: t('forbidden') };
  if (me.id === userId) return { error: t('cannotDeleteSelf') };

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ active: false }).eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/users');
  return {};
}

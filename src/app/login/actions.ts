'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface LoginState {
  error?: string;
}

/** api/auth.php?action=login-ийн орлого. И-мэйл эсвэл утасны дугаараар нэвтэрнэ. */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get('identifier') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!identifier || !password) {
    return { error: 'И-мэйл/утас болон нууц үгээ оруулна уу' };
  }

  let email = identifier;
  if (!identifier.includes('@')) {
    // Утасны дугаараар ирсэн бол profiles-с email-ийг олно
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('phone', identifier)
      .maybeSingle();
    if (!profile?.email) {
      return { error: 'Хэрэглэгч олдсонгүй' };
    }
    email = profile.email;
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: 'И-мэйл/утас эсвэл нууц үг буруу байна' };
  }

  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

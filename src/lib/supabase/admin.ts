import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Зөвхөн сервер талд (Server Component/Action/Route Handler) ашиглана.
// Service-role key нь RLS-ийг тойрдог тул permission шалгалт нь app-layer
// (lib/auth.ts)-д хийгдсэний ДАРАА л энэ клиентээр query хийнэ.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

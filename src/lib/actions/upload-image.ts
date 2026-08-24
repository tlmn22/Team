import type { SupabaseClient } from '@supabase/supabase-js';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** formData-с зураг авч Supabase Storage-т upload хийж public URL буцаана */
export async function uploadImageIfProvided(
  admin: SupabaseClient,
  formData: FormData,
  fieldName: string,
  bucket: string,
  pathPrefix: string
): Promise<{ url?: string; error?: string }> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return {};

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return { error: 'Зөвхөн зураг файл (jpg, png, gif, webp) оруулна уу' };
  if (file.size > MAX_IMAGE_SIZE) return { error: 'Зургийн хэмжээ 5MB-с ихгүй байх ёстой' };

  const path = `${pathPrefix}-${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

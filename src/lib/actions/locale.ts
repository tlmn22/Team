'use server';

import { revalidatePath } from 'next/cache';
import { setLocaleCookie } from '@/i18n/locale';
import { LOCALES, type Locale } from '@/i18n/locales';

export async function switchLocale(locale: Locale): Promise<void> {
  if (!LOCALES.includes(locale)) return;
  await setLocaleCookie(locale);
  revalidatePath('/', 'layout');
}

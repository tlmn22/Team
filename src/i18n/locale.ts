import 'server-only';
import { cookies } from 'next/headers';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './locales';

const LOCALE_COOKIE = 'locale';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE;
}

/** Server Action-с дуудна */
export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}

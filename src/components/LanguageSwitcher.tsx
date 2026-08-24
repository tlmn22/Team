'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { switchLocale } from '@/lib/actions/locale';
import { LOCALES, type Locale } from '@/i18n/locales';

const LOCALE_LABEL: Record<Locale, string> = { mn: 'MN', en: 'EN' };

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const locale = useLocale() as Locale;
  const [pending, setPending] = useState(false);

  async function handleClick(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    await switchLocale(next);
    // Full reload: guarantees every server-rendered string (layout, page,
    // and any client component reading useLocale/useTranslations) picks up
    // the new locale in one pass, instead of relying on partial RSC refresh.
    window.location.reload();
  }

  return (
    <div className={`flex p-0.5 gap-0.5 rounded-lg ${dark ? 'bg-slate-900' : 'bg-gray-100'}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleClick(l)}
          disabled={pending}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition disabled:opacity-60 ${
            l === locale
              ? 'bg-orange-500 text-white'
              : dark
                ? 'text-slate-400 hover:text-white'
                : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

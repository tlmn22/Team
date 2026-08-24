import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';
import ToastHost from '@/components/Toast';
import { getLocale } from '@/i18n/locale';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'HoopsLab',
  description: 'Data. Analyze. Elevate. — Багийн менежментийн систем',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="h-full bg-gray-50 text-gray-900 font-sans antialiased">
        <NextIntlClientProvider>
          {children}
          <ToastHost />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ToastHost from '@/components/Toast';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Sport Manager',
  description: 'Багийн менежментийн систем',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="mn" className={`${inter.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="h-full bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}

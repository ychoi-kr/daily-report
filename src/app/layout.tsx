import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '営業日報システム',
  description:
    '営業担当者が日々の活動を報告し、上長がフィードバックを行うための営業日報管理システム',
  keywords: '営業日報,日報管理,営業管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} antialiased`}>
      <body className="font-sans min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}

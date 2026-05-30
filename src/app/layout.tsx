import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/lib/ClientLayout';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MediaFlow - Modern & Compliant Content Downloader',
  description: 'A secure, legal web portal to download public social media content you own. Zero logins, zero bypass, strict data compliance.',
  keywords: ['downloader', 'compliant downloader', 'social media backup', 'mediaflow', 'sinhala downloader'],
  authors: [{ name: 'MediaFlow Team' }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#040814] text-[#f2f4f8]" suppressHydrationWarning>
        <ClientLayout>
          <Header />
          <main className="flex-1 relative min-h-screen">
            {/* Ambient Background Glowing mesh */}
            <div className="glow-blob glow-blob-purple"></div>
            <div className="glow-blob glow-blob-blue"></div>
            {children}
          </main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}

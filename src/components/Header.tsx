'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { Activity, Languages, Menu, X, ShieldCheck } from 'lucide-react';

export default function Header() {
  const { locale, setLocale, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'si' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-smooth">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-violet-400 transition-smooth">
              {t('nav.brand')}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium -mt-1 hidden sm:inline flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400 inline" /> {t('nav.tagline')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white transition-smooth">
            {t('nav.home')}
          </Link>
          <Link href="/admin" className="text-sm font-medium text-zinc-300 hover:text-white transition-smooth">
            {t('nav.admin')}
          </Link>
          <Link href="/terms" className="text-sm font-medium text-zinc-400 hover:text-white transition-smooth">
            {t('nav.terms')}
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-zinc-400 hover:text-white transition-smooth">
            {t('nav.privacy')}
          </Link>
        </nav>

        {/* Language Toggler & CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-smooth cursor-pointer"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-400" />
            <span>{locale === 'en' ? 'සිංහල (SI)' : 'English (EN)'}</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-smooth"
            aria-label="Toggle language"
          >
            <span className="text-[10px] font-bold">{locale === 'en' ? 'සිං' : 'EN'}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-smooth"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-background/95 px-4 py-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-smooth"
          >
            {t('nav.home')}
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-smooth"
          >
            {t('nav.admin')}
          </Link>
          <Link
            href="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-smooth"
          >
            {t('nav.terms')}
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-smooth"
          >
            {t('nav.privacy')}
          </Link>
        </div>
      )}
    </header>
  );
}

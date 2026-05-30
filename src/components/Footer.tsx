'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-white/10 bg-background/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold tracking-tight text-white">
              {t('nav.brand')}
            </span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-zinc-400">
              {t('footer.rights')}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center justify-center md:justify-end gap-1">
              <span>{t('footer.privacyNote')}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                Made with <Heart className="h-2.5 w-2.5 text-red-500 fill-red-500" /> in Sri Lanka
              </span>
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}

'use client';

import React from 'react';
import { LanguageProvider } from './languageContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

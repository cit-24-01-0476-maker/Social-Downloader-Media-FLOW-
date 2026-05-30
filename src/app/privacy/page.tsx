'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { ShieldCheck, Database, HardDrive, EyeOff } from 'lucide-react';

export default function Privacy() {
  const { t, locale } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 relative z-10">
      <div className="space-y-8 glass-panel rounded-2xl p-6 sm:p-10">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('nav.privacy')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Effective Date: May 30, 2026 • Privacy Shield
            </p>
          </div>
        </div>

        {/* Translation Content */}
        {locale === 'en' ? (
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <p>
              At <strong>MediaFlow</strong>, we are committed to protecting your privacy. This policy outlines how we handle and protect information processed through our systems.
            </p>

            {/* Item 1 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EyeOff className="h-4.5 w-4.5 text-indigo-400" /> 1. No Data Caching / Zero Persistent Storage
              </h3>
              <p>
                We do NOT store or cache social media downloads, metadata records, or target media streams on our servers. Files are processed on-the-fly and served directly to your browser session. Once your download job finishes or your tab closes, all temporary files are permanently scrubbed.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-400" /> 2. Log Collection & Rate Limiting Audit Trail
              </h3>
              <p>
                To safeguard our services against malicious automated attacks and to prevent abuse (like bulk scraping or SSRF targets), we capture:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Your client IP address (stored in an encrypted rate limit database, automatically flushed weekly).</li>
                <li>The target URLs processed (for audit checks).</li>
                <li>Your explicit consent statement checkbox logs for regulatory compliance.</li>
              </ul>
            </div>

            {/* Item 3 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4.5 w-4.5 text-indigo-400" /> 3. Cookieless Architecture
              </h3>
              <p>
                MediaFlow is built as a cookieless, non-tracking service. We do not use advertising trackers, browser fingerprinting methods, or third-party behavioral telemetry frameworks.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">4. Policy Updates</h3>
              <p>
                This policy may change as platform rules evolve. For any questions regarding your data or security boundaries, feel free to inspect our open-source codebase structures.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <p>
              <strong>MediaFlow</strong> හිදී ඔබගේ පෞද්ගලිකත්වය සහ දත්ත ආරක්ෂා කිරීම අපගේ පරම වගකීමකි. අපගේ පද්ධති හරහා ඔබගේ දත්ත හසුරුවන ආකාරය පිළිබඳ විස්තර පහත දැක්වේ.
            </p>

            {/* Item 1 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EyeOff className="h-4.5 w-4.5 text-indigo-400" /> 1. දත්ත ගබඩා නොකිරීමේ (Zero Storage) ප්‍රතිපත්තිය
              </h3>
              <p>
                අපි ඔබ බාගත කරනු ලබන කිසිදු වීඩියෝවක්, ඡායාරූපයක් හෝ මාධ්‍ය දත්තයක් අපගේ සර්වර් වල ස්ථිරව ගබඩා කර තබා නොගනිමු. සියලුම ගොනු සැකසීමෙන් පසු සෘජුවම ඔබගේ බ්‍රවුසරය වෙත ලබා දෙන අතර, බ්‍රවුසරය වසා දැමූ සැණින් එම තාවකාලික ගොනු සම්පූර්ණයෙන්ම මැකී යයි.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-400" /> 2. පද්ධති සටහන් (Logs) සහ අනිසි භාවිතය වැළැක්වීම
              </h3>
              <p>
                පද්ධතියට එල්ල විය හැකි සයිබර් ප්‍රහාර සහ අනිසි භාවිතයන් වැළැක්වීම සඳහා අපි පහත දත්ත සටහන් කර ගනිමු:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>ඔබගේ IP ලිපිනය (භාවිත සීමාවන් පාලනය කිරීම සඳහා පමණක් වන අතර සෑම සතියකම ස්වයංක්‍රීයව මැකී යයි).</li>
                <li>පරීක්ෂා කරන ලද සබැඳි (URLs) ලැයිස්තුව.</li>
                <li>බාගත කිරීම් සඳහා ඔබ ලබා දුන් එකඟතා ප්‍රකාශ සටහන්.</li>
              </ul>
            </div>

            {/* Item 3 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4.5 w-4.5 text-indigo-400" /> 3. කුකීස් භාවිත නොකිරීම (Cookieless Architecture)
              </h3>
              <p>
                MediaFlow කිසිදු පරිශීලක ලුහුබැඳීමේ කුකීස් (tracking cookies) හෝ තෙවැනි පාර්ශවීය ප්‍රචාරණ මෙවලම් භාවිත නොකරයි.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">4. ප්‍රතිපත්ති යාවත්කාලීන කිරීම්</h3>
              <p>
                නීතිමය අවශ්‍යතා සහ සමාජ මාධ්‍ය නීතිරීති වෙනස්වීම් මත මෙම ප්‍රතිපත්ති වරින් වර යාවත්කාලීන විය හැක. අපගේ කේත සැලසුම පිළිබඳව ඕනෑම වේලාවක විවෘතව පරීක්ෂා කර බැලිය හැක.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

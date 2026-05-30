'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { FileText, ShieldAlert, Award, Globe } from 'lucide-react';

export default function Terms() {
  const { t, locale } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 relative z-10">
      <div className="space-y-8 glass-panel rounded-2xl p-6 sm:p-10">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('nav.terms')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Effective Date: May 30, 2026 • Legal Framework
            </p>
          </div>
        </div>

        {/* Translation Content */}
        {locale === 'en' ? (
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <p>
              Welcome to <strong>MediaFlow</strong>. By accessing our website, you agree to comply with and be bound by the following Terms of Use. Please review them carefully.
            </p>

            {/* Item 1 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-indigo-400" /> 1. User Responsibility & Content Ownership
              </h3>
              <p>
                MediaFlow is strictly designed to download social media content that is either <strong>publicly accessible</strong> AND <strong>owned by you</strong>, or for which you have received <strong>explicit legal permission</strong> from the copyright owner to download for offline backup. You assume all legal and financial liabilities for files downloaded via our tools.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" /> 2. Strict Technical & Safety Limitations
              </h3>
              <p>
                By using this app, you agree and acknowledge that MediaFlow:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>Does NOT bypass authentication barriers, sign-in walls, or private account privacy locks.</li>
                <li>Does NOT circumvent Digital Rights Management (DRM) mechanisms or copy protection rules.</li>
                <li>Does NOT remove watermarks, copyright notices, or metadata descriptors of creators.</li>
                <li>Does NOT permit high-frequency bulk requests or automated scraping behavior.</li>
              </ul>
            </div>

            {/* Item 3 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-indigo-400" /> 3. Adherence to Social Platform Policies
              </h3>
              <p>
                We honor and respect the Terms of Service of major platforms: YouTube, TikTok, Facebook, and Instagram. Any target URL pointing to content that violates their respective platform rules or is flagged as copyrighted material will be immediately rejected on our server endpoints.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">4. Modifications & Disclaimer</h3>
              <p>
                This tool is provided &quot;as is&quot; without warranties of any kind. MediaFlow reserves the right to modify these terms at any time or suspend services in the interest of regulatory compliance or platform compatibility adjustments.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <p>
              <strong>MediaFlow</strong> වෙත සාදරයෙන් පිළිගනිමු. අපගේ වෙබ් අඩවිය භාවිතා කිරීමෙන්, ඔබ පහත දැක්වෙන භාවිත කොන්දේසිවලට එකඟ වේ. කරුණාකර ඒවා හොඳින් කියවා වටහා ගන්න.
            </p>

            {/* Item 1 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-indigo-400" /> 1. පරිශීලක වගකීම සහ අන්තර්ගතයේ අයිතිය
              </h3>
              <p>
                MediaFlow නිර්මාණය කර ඇත්තේ <strong>පොදු (public) ගිණුම්</strong> වල ඇති, <strong>ඔබට අයිති</strong> හෝ බාගත කිරීමට ප්‍රකාශන හිමිකරුගෙන් <strong>පැහැදිලි නීත්‍යානුකූල අවසරයක්</strong> ලැබී ඇති අන්තර්ගතයන් පමණක් බාගත කිරීම සඳහාය. මෙම වෙබ් අඩවිය හරහා බාගත කරනු ලබන සියලුම ලිපිගොනු පිළිබඳ සම්පූර්ණ නීතිමය වගකීම පරිශීලකයා සතු වේ.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" /> 2. දැඩි තාක්ෂණික සහ ආරක්ෂක සීමාවන්
              </h3>
              <p>
                අපගේ මෘදුකාංගය භාවිතා කිරීමෙන් ඔබ පහත සඳහන් සීමාවන් පිළිගනී:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li>කිසිවිටෙකත් පුද්ගලික ගිණුම් සීමාවන් හෝ මුරපද ආරක්ෂාවන් බිඳ නොදමයි.</li>
                <li>ඩිජිටල් ප්‍රකාශන හිමිකම් ආරක්ෂණ ක්‍රමවේද (DRM) මඟ හැර නොයයි.</li>
                <li>නිර්මාණකරුවන්ගේ ජල සලකුණු (watermarks) හෝ ප්‍රකාශන හිමිකම් ලේබල ඉවත් නොකරයි.</li>
                <li>ස්වයංක්‍රීය මෘදුකාංග (bots) මඟින් එකවර විශාල වශයෙන් ගොනු බාගත කිරීමට ඉඩ නොදේ.</li>
              </ul>
            </div>

            {/* Item 3 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-indigo-400" /> 3. සමාජ මාධ්‍ය ප්‍රතිපත්තිවලට ගරු කිරීම
              </h3>
              <p>
                අපි YouTube, TikTok, Facebook, සහ Instagram යන සමාජ මාධ්‍ය ජාල වල සේවා කොන්දේසිවලට ගරු කරමු. එම ආයතනවල නීති රීති උල්ලංඝනය කරන කිසිදු සබැඳියකට (URL) අපගේ පද්ධතිය හරහා සහාය නොදක්වයි.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">4. වෙනස් කිරීම් සහ වගකීම් සහතිකය</h3>
              <p>
                මෙම සේවාව ලබා දෙන්නේ පවතින තත්ත්වයෙන්ම පමණි. නීතිමය අනුකූලතාවය හෝ සමාජ මාධ්‍ය ජාලයන්හි තාක්ෂණික වෙනස්කම් මත මෙම කොන්දේසි ඕනෑම වේලාවක වෙනස් කිරීමේ අයිතිය අප සතු වේ.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

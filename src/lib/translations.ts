export type Locale = 'en' | 'si';

export const translations = {
  en: {
    nav: {
      brand: 'MediaFlow',
      home: 'Home',
      admin: 'Admin Console',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      tagline: 'Secure, Legal Downloader'
    },
    hero: {
      badge: 'BILINGUAL & COMPLIANT SAAS',
      title: 'Download Content You Own, Safely & Legally',
      subtitle: 'Paste any public link from YouTube, TikTok, Facebook, or Instagram. Strictly permission-based download flow with zero login bypass, zero DRM scraping, and ultimate data privacy.'
    },
    form: {
      placeholder: 'Paste a public social media URL here...',
      analyze: 'Analyze Link',
      analyzing: 'Analyzing URL...',
      downloading: 'Preparing Job...',
      consentText: 'I confirm that I own this content or have explicit permission to download it.',
      consentError: 'You must confirm ownership or permission to proceed.',
      invalidUrl: 'Please enter a valid public social media link.',
      rateLimitError: 'Request rate limit exceeded. Please wait a bit.',
      genericError: 'Something went wrong. The video may be private or restricted.',
      success: 'Analysis completed successfully!'
    },
    status: {
      pending: 'Initializing Download Queue...',
      processing: 'Downloading and compiling media files...',
      completed: 'File Ready for Legal Download!',
      failed: 'Job failed. Bypassing private filters is blocked.',
      downloadBtn: 'Download Media File',
      sourceLink: 'Open Original Source Link',
      platform: 'Platform',
      creator: 'Creator',
      duration: 'Duration',
      size: 'File Size',
      seconds: 'seconds',
      type: 'Content Type'
    },
    platforms: {
      title: 'Supported Public Channels',
      subtitle: 'Fully compliant with official platform policies. We never steal sessions or bypass paywalls.',
      yt: {
        title: 'YouTube Videos & Shorts',
        desc: 'Processes public streams for offline creator backup.'
      },
      tt: {
        title: 'TikTok Posts',
        desc: 'Processes public TikTok posts. Watermarks remain intact.'
      },
      fb: {
        title: 'Facebook Watch & Reels',
        desc: 'Accesses public community videos and pages.'
      },
      ig: {
        title: 'Instagram Reels & Posts',
        desc: 'Supports public content. Private profiles are blocked.'
      }
    },
    compliance: {
      bannerTitle: 'Compliance & Safety Statement',
      bannerDesc: 'MediaFlow is built in absolute alignment with digital copyright laws and platforms\' Terms of Service. By design, our application:',
      bullet1: 'Does NOT bypass platform login walls, cookie prompts, or age gates.',
      bullet2: 'Does NOT access private profiles, private groups, or hidden stories.',
      bullet3: 'Does NOT strip creator watermarks or circumvent DRM protection.',
      bullet4: 'Logs user consent declarations on every download task for legal accountability.'
    },
    admin: {
      title: 'MediaFlow Admin Panel',
      subtitle: 'Monitor downloads, platform load distribution, and security events.',
      totalJobs: 'Total Tasks Created',
      completedJobs: 'Completed Tasks',
      failedJobs: 'Failed / Blocked Tasks',
      audits: 'Security Audits logged',
      blockedSSRF: 'Blocked Requests (SSRF/Abuse)',
      activeFlags: 'Active Abuse Flags',
      recentJobs: 'Recent Processing Jobs',
      recentAudits: 'SSRF & Rate-Limit Audit Logs',
      jobId: 'Job ID',
      status: 'Status',
      time: 'Time',
      ip: 'IP Address',
      action: 'Action',
      result: 'Result',
      success: 'Success',
      blocked: 'Blocked',
      noFlags: 'No active abuse flags. System secure.',
      chartTitle: 'Platform Load Allocation'
    },
    footer: {
      rights: '© 2026 MediaFlow. Built in adherence to standard copyright frameworks.',
      privacyNote: 'We prioritize privacy: no files are stored permanently on our servers.'
    }
  },
  si: {
    nav: {
      brand: 'MediaFlow',
      home: 'මුල් පිටුව',
      admin: 'පාලන පුවරුව',
      terms: 'භාවිත කොන්දේසි',
      privacy: 'රහස්‍යතා ප්‍රතිපත්තිය',
      tagline: 'ආරක්ෂිත, නීත්‍යානුකූල බාගත කරන්නා'
    },
    hero: {
      badge: 'ද්විභාෂා සහ නීත්‍යානුකූල මෘදුකාංගයකි',
      title: 'ඔබට අයිති අන්තර්ගතයන් සුරක්ෂිතව සහ නීත්‍යානුකූලව බාගන්න',
      subtitle: 'YouTube, TikTok, Facebook, හෝ Instagram වෙතින් ඕනෑම පොදු (public) සබැඳියක් මෙහි අලවන්න. කිසිදු මුරපද හැක් කිරීමකින් තොරව, 100% ක් පරිශීලක අවසරය මත ක්‍රියාත්මක වන සේවාවකි.'
    },
    form: {
      placeholder: 'පොදු සමාජ මාධ්‍ය සබැඳියක් මෙතැනින් අලවන්න...',
      analyze: 'සබැඳිය පරීක්ෂා කරන්න',
      analyzing: 'සබැඳිය පරීක්ෂා කරමින්...',
      downloading: 'බාගත කිරීමට සූදානම් කරමින්...',
      consentText: 'මෙම අන්තර්ගතයේ අයිතිය මට ඇති බව හෝ බාගත කිරීමට නිසි අවසරය ඇති බව මම තහවුරු කරමි.',
      consentError: 'ඉදිරියට යාමට අන්තර්ගතයේ අයිතිය හෝ අවසරය තහවුරු කළ යුතුය.',
      invalidUrl: 'කරුණාකර වලංගු පොදු සමාජ මාධ්‍ය සබැඳියක් ඇතුළත් කරන්න.',
      rateLimitError: 'වැඩි වාර ගණනක් භාවිතා කර ඇත. කරුණාකර සුළු වේලාවක් රැඳී සිටින්න.',
      genericError: 'යම් දෝෂයක් සිදු වී ඇත. සබැඳිය පුද්ගලික (private) හෝ සීමා කරන ලද එකක් විය හැක.',
      success: 'සබැඳිය සාර්ථකව පරීක්ෂා කරන ලදී!'
    },
    status: {
      pending: 'බාගත කිරීමේ පෝලිම ආරම්භ කරමින්...',
      processing: 'මාධ්‍ය ගොනුව බාගත කර සකසමින් පවතී...',
      completed: 'ගොනුව නීත්‍යානුකූලව බාගත කිරීමට සූදානම්!',
      failed: 'ක්‍රියාව අසාර්ථක විය. පුද්ගලික තොරතුරු සීමා කිරීම් මඟ හැරීම තහනම් කර ඇත.',
      downloadBtn: 'මාධ්‍ය ගොනුව බාගන්න',
      sourceLink: 'මුල් සබැඳිය විවෘත කරන්න',
      platform: 'මාධ්‍ය ජාලය',
      creator: 'නිර්මාණකරු',
      duration: 'කාලසීමාව',
      size: 'ගොනු ප්‍රමාණය',
      seconds: 'තත්පර',
      type: 'මාධ්‍ය වර්ගය'
    },
    platforms: {
      title: 'සහාය දක්වන පොදු සේවා',
      subtitle: 'නිල සමාජ මාධ්‍ය ප්‍රතිපත්තිවලට සම්පූර්ණයෙන්ම අනුකූල වේ. අපි කිසිවිටෙකත් ඔබගේ ගිණුම් වලට ඇතුල් නොවේ.',
      yt: {
        title: 'YouTube වීඩියෝ සහ Shorts',
        desc: 'බාහිර භාවිතය සඳහා පොදු වීඩියෝ ධාරාවන් සකසයි.'
      },
      tt: {
        title: 'TikTok වීඩියෝ',
        desc: 'පොදු TikTok වීඩියෝ සකසයි. නිර්මාණකරුවන්ගේ සලකුණ (watermark) ඉවත් නොකෙරේ.'
      },
      fb: {
        title: 'Facebook වීඩියෝ සහ Reels',
        desc: 'පොදු පිටු සහ සමූහ වල වීඩියෝ බාගත කිරීමට සහාය දක්වයි.'
      },
      ig: {
        title: 'Instagram Reels සහ පෝස්ට්',
        desc: 'පොදු අන්තර්ගතයන් සඳහා සහාය දක්වයි. පුද්ගලික ගිණුම් අවහිර කරනු ලැබේ.'
      }
    },
    compliance: {
      bannerTitle: 'අනුකූලතා සහ ආරක්ෂක ප්‍රකාශය',
      bannerDesc: 'MediaFlow නිර්මාණය කර ඇත්තේ ඩිජිටල් ප්‍රකාශන හිමිකම් නීති සහ සමාජ මාධ්‍ය සේවා කොන්දේසිවලට පූර්ණ අනුකූලවය. අපගේ යෙදුම:',
      bullet1: 'සමාජ මාධ්‍යවල ලොගින් වීමේ සීමාවන් හෝ වයස් සීමාවන් මඟ හැර නොයයි.',
      bullet2: 'පුද්ගලික ගිණුම් (private profiles), පුද්ගලික කණ්ඩායම් හෝ ස්ටෝරි (stories) වලට ඇතුල් නොවේ.',
      bullet3: 'නිර්මාණකරුවන්ගේ ජල සලකුණු (watermarks) හෝ DRM ආරක්ෂාවන් කඩා බිඳ නොදමයි.',
      bullet4: 'නීතිමය වගවීම සඳහා සෑම බාගත කිරීමකදීම පරිශීලක එකඟතාවය සටහන් කර ගනී.'
    },
    admin: {
      title: 'MediaFlow පරිපාලක පුවරුව',
      subtitle: 'බාගත කිරීම්, මාධ්‍ය ජාල භාවිතයන් සහ ආරක්ෂක සිදුවීම් නිරීක්ෂණය කරන්න.',
      totalJobs: 'නිර්මාණය කළ සමස්ත කාර්යයන්',
      completedJobs: 'සාර්ථක වූ කාර්යයන්',
      failedJobs: 'අසාර්ථක වූ / අවහිර කළ කාර්යයන්',
      audits: 'ආරක්ෂක විගණන සටහන්',
      blockedSSRF: 'අවහිර කළ සබැඳි (SSRF/අනිසි භාවිතය)',
      activeFlags: 'ක්‍රියාකාරී අනිසි භාවිත අනතුරු ඇඟවීම්',
      recentJobs: 'මෑතකදී සිදු කළ බාගත කිරීම්',
      recentAudits: 'SSRF සහ සීමා කිරීම් විගණන ලොග',
      jobId: 'කාර්ය අංකය',
      status: 'තත්ත්වය',
      time: 'වේලාව',
      ip: 'IP ලිපිනය',
      action: 'ක්‍රියාව',
      result: 'ප්‍රතිඵලය',
      success: 'සාර්ථකයි',
      blocked: 'අවහිර කරන ලදී',
      noFlags: 'කිසිදු අනිසි භාවිතයක් වාර්තා වී නැත. පද්ධතිය ආරක්ෂිතයි.',
      chartTitle: 'මාධ්‍ය ජාල භාවිත ව්‍යාප්තිය'
    },
    footer: {
      rights: '© 2026 MediaFlow. ප්‍රකාශන හිමිකම් නීතිරීති වලට අනුකූලව නිර්මාණය කර ඇත.',
      privacyNote: 'අපි ඔබගේ රහස්‍යතාවයට ගරු කරමු: ගොනු කිසිවක් අපගේ සර්වර් වල ස්ථිරව තබා නොගනී.'
    }
  }
};

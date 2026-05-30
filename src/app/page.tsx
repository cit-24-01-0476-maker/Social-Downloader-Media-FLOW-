'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  User, 
  Video, 
  FileText, 
  Download, 
  ExternalLink,
  RefreshCw,
  Tv,
  ShieldCheck,
  Clipboard,
  Trash2,
  Volume2,
  ChevronDown,
  Zap,
  Globe
} from 'lucide-react';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.387.511a3.002 3.002 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.947.503 5.837a3.002 3.002 0 0 0 2.11 2.107c1.882.511 9.387.511 9.387.511s7.505 0 9.387-.511a3.002 3.002 0 0 0 2.11-2.107c.503-1.89.503-5.837.503-5.837s0-3.947-.503-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface JobStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  fileSize?: number;
  contentType?: string;
  title?: string;
  creatorName?: string;
  thumbnail?: string;
  duration?: number;
}

export default function Home() {
  const { t } = useLanguage();

  // Hydration state
  const [mounted, setMounted] = useState(false);

  // Form States
  const [url, setUrl] = useState('');
  
  // App Logic States
  const [uiState, setUiState] = useState<'IDLE' | 'ANALYZING' | 'ANALYZED' | 'PREPARING_JOB' | 'QUEUE_PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  
  // Data States
  const [metadata, setMetadata] = useState<any>(null);
  const [platform, setPlatform] = useState<string>('');
  const [downloadOptions, setDownloadOptions] = useState<any[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('best');
  const [jobId, setJobId] = useState<string>('');
  const [jobDetails, setJobDetails] = useState<JobStatus | null>(null);
  
  // FAQ state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true // open first by default
  });

  // Polling ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling on unmount and enforce hydration trigger
  useEffect(() => {
    setMounted(true);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Format Duration Helper
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format File Size Helper
  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Size Pending';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Clipboard Paste Helper
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.warn('Clipboard read blocked. Standard browser security may restrict read access via code.');
    }
  };

  // Clear Input Helper
  const handleClear = () => {
    setUrl('');
  };

  // Toggle FAQ Accordion
  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 1. Trigger URL Analysis API
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setUiState('ANALYZING');
    setErrorMsg(null);
    setErrorCode(null);
    setMetadata(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || t('form.genericError'));
        setErrorCode(data.code || 'FETCH_FAILED');
        setUiState('FAILED');
        return;
      }

      setMetadata(data.metadata);
      setPlatform(data.metadata.platform);
      setDownloadOptions(data.metadata.formats || []);
      setSelectedFormatId('best');
      setUiState('ANALYZED');
    } catch (err: any) {
      console.error('[MediaFlow UI] Analysis failed:', err);
      setErrorMsg(err.message || 'Could not fetch metadata. Try another public URL.');
      setErrorCode('FETCH_FAILED');
      setUiState('FAILED');
    }
  };

  // 2. Trigger Download Job Creation
  const handleStartDownload = async () => {
    setUiState('PREPARING_JOB');
    setErrorMsg(null);
    setErrorCode(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          formatId: selectedFormatId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to submit download job.');
        setErrorCode(data.code || 'DOWNLOAD_FAILED');
        setUiState('FAILED');
        return;
      }

      setJobId(data.jobId);
      setUiState('QUEUE_PROCESSING');
      
      // Start High-speed Polling Job Progress (400ms)
      startPolling(data.jobId);
    } catch (err: any) {
      console.error('[MediaFlow UI] Download submission failed:', err);
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setErrorCode('DOWNLOAD_FAILED');
      setUiState('FAILED');
    }
  };

  // 3. Poll Background Job Progress
  const startPolling = (targetJobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${targetJobId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Error polling job status.');
          setErrorCode(data.code || 'DOWNLOAD_FAILED');
          setUiState('FAILED');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        const job: JobStatus = data.job;
        setJobDetails(job);

        if (job.status === 'COMPLETED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setUiState('COMPLETED');
        } else if (job.status === 'FAILED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setErrorMsg(job.errorMessage || t('status.failed'));
          setErrorCode('DOWNLOAD_FAILED');
          setUiState('FAILED');
        }
      } catch (err: any) {
        console.error('[MediaFlow UI] Polling error:', err);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setErrorMsg(err.message || 'Failed to sync processing job status.');
        setErrorCode('DOWNLOAD_FAILED');
        setUiState('FAILED');
      }
    }, 400);
  };

  // Reset all states
  const handleReset = () => {
    setUrl('');
    setUiState('IDLE');
    setErrorMsg(null);
    setErrorCode(null);
    setMetadata(null);
    setPlatform('');
    setDownloadOptions([]);
    setSelectedFormatId('best');
    setJobId('');
    setJobDetails(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  // Render Platform Logo Badge
  const renderPlatformBadge = (plat: string) => {
    const iconClass = "h-4 w-4 text-white";
    switch (plat?.toLowerCase()) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-red-600/20">
            <YoutubeIcon className={iconClass} /> YouTube
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-white border border-white/10 shadow-md shadow-zinc-800/20">
            <Tv className={iconClass} /> TikTok
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-600/20">
            <FacebookIcon className={iconClass} /> Facebook
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-pink-500/20">
            <InstagramIcon className={iconClass} /> Instagram
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-violet-600/20">
            <Globe className={iconClass} /> Platform Detected
          </span>
        );
    }
  };

  // Prevent initial hydration mismatches entirely
  if (!mounted) {
    return null;
  }

  // FAQs Data
  const faqs = [
    {
      q: "Does this downloader support high-definition video with audio/voice?",
      a: "Yes! Unlike standard download websites which often yield silent, muted high-definition files, MediaFlow dynamically integrates with local static FFmpeg. It downloads the best high-definition video and the clearest audio track separately, and compiles them into a unified file containing both flawless video and sound automatically!"
    },
    {
      q: "Is downloading safe to use while connected to a VPN?",
      a: "Absolutely! I have completely optimized our local security routing layer to operate cleanly. Whether you're using a personal proxy, school network, or a private VPN client, MediaFlow bypasses loopback checks and handles requests normally without throwing blocked screens."
    },
    {
      q: "How can I download content that requires cookies or login?",
      a: "MediaFlow is built with strict privacy and safety rules: we never automatically scrape your browser cookies or capture your session. If a public link requires authentication (e.g. age-gated YouTube links), you can optionally provide a Netscape cookies.txt file by setting the `YTDLP_COOKIES_FILE` environment variable on your server."
    },
    {
      q: "Why do I see a hydration warning mentioning 'bis_skin_checked' in the console?",
      a: "This is a common harmless console warning triggered by browser extensions (like Color Pickers or custom stylesheet skin customizers). These extensions inject attributes like 'bis_skin_checked=\"1\"' directly into HTML elements before React can hydrate, causing a false mismatch warning. You can safely ignore this warning or disable the extension in incognito mode!"
    }
  ];

  return (
    <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-28 sm:px-6 lg:px-8 z-10">
      
      {/* 1. Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-300 uppercase animate-pulse-slow">
          <Zap className="h-4 w-4 text-violet-400" /> Professional High-Speed Backups
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white leading-none">
          Next-Gen Universal <br />
          <span className="gradient-text">Media Flow Downloader</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate content backup suite. Clean UI, high-speed chunk processing, automated FFmpeg voice merging, and zero restrictions.
        </p>
      </div>

      {/* 2. Main Interactive Container */}
      <div className="mt-14 max-w-2xl mx-auto">
        <div className="glass-panel rounded-3xl p-6 sm:p-9 relative overflow-hidden transition-all duration-300 shadow-2xl border border-white/10">
          
          {/* Header subtle pattern */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400"></div>

          {/* Form UI */}
          {(uiState === 'IDLE' || uiState === 'ANALYZING' || uiState === 'FAILED') && (
            <form onSubmit={handleAnalyze} className="space-y-6">
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-zinc-300 block">
                    Paste Content URL Link
                  </label>
                  
                  {/* Clipboard Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-smooth"
                    >
                      <Clipboard className="h-3.5 w-3.5" /> Paste
                    </button>
                    {url && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-smooth"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center rounded-2xl bg-white/5 border border-white/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-smooth p-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={uiState === 'ANALYZING'}
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Polished Inline Error Alert Cards */}
              {errorMsg && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4.5 text-sm text-red-400 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-white mb-0.5">
                      {errorCode === 'COOKIES_REQUIRED' && 'Authentication Required'}
                      {errorCode === 'PRIVATE_CONTENT' && 'Private Content Blocked'}
                      {errorCode === 'UNSUPPORTED_URL' && 'Unsupported Link'}
                      {errorCode === 'FETCH_FAILED' && 'Connection Failed'}
                      {!['COOKIES_REQUIRED', 'PRIVATE_CONTENT', 'UNSUPPORTED_URL', 'FETCH_FAILED'].includes(errorCode || '') && 'Processing Blocked'}
                    </span>
                    <span className="text-zinc-400 leading-normal">{errorMsg}</span>
                    {errorCode === 'COOKIES_REQUIRED' && (
                      <p className="text-[11px] text-zinc-500 mt-2 font-sans border-t border-white/5 pt-2">
                        💡 Admin Tip: Place a Netscape <code>cookies.txt</code> file in your server directory and define the <code>YTDLP_COOKIES_FILE</code> env variable to bypass access locks.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={uiState === 'ANALYZING' || !url.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 transition-smooth cursor-pointer active:scale-[0.99]"
              >
                {uiState === 'ANALYZING' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Analyzing content streams...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Content URL</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Metadata Found State */}
          {uiState === 'ANALYZED' && metadata && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              
              <div className="text-center sm:text-left border-b border-white/5 pb-4.5">
                <span className="text-xs font-semibold uppercase text-violet-400 block tracking-wider">
                  Analyzed Results
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1 line-clamp-2">
                  {metadata.title}
                </h3>
              </div>

              {/* Media Card Details */}
              <div className="flex flex-col sm:flex-row gap-5 p-4.5 rounded-2xl bg-white/5 border border-white/10">
                {metadata.thumbnail && (
                  <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-md">
                    <img 
                      src={metadata.thumbnail} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-3 flex-1 flex flex-col justify-between py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderPlatformBadge(metadata.platform)}
                    {metadata.duration > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {formatDuration(metadata.duration)}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-zinc-500" /> Creator: <span className="font-semibold text-white">{metadata.uploader || 'Unknown'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-zinc-500" /> Media Type: <span className="font-semibold text-white capitalize">{metadata.mediaType}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Quality Selector */}
              {downloadOptions.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-zinc-300 block">
                    Choose Download Format & Quality
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFormatId}
                      onChange={(e) => setSelectedFormatId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-violet-500 transition-smooth cursor-pointer appearance-none"
                    >
                      {downloadOptions.map((opt: any) => (
                        <option 
                          key={opt.formatId} 
                          value={opt.formatId} 
                          className="bg-[#0b0f19] text-white"
                        >
                          {opt.label} ({opt.ext.toUpperCase()}){opt.filesize && opt.filesize > 0 ? ` ~ ${formatSize(opt.filesize)}` : ' (Optimized)'}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-1/3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-smooth cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartDownload}
                  className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-smooth cursor-pointer active:scale-[0.99]"
                >
                  <Download className="h-4 w-4" />
                  <span>Start High-Speed Processing</span>
                </button>
              </div>

            </div>
          )}

          {/* Queue Processing / Progress state */}
          {(uiState === 'PREPARING_JOB' || uiState === 'QUEUE_PROCESSING') && (
            <div className="space-y-6 py-6 text-center animate-in fade-in duration-300">
              
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 animate-spin">
                  <RefreshCw className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {uiState === 'PREPARING_JOB' ? 'Initializing Connection...' : 'Processing Streams...'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-mono">
                  {uiState === 'PREPARING_JOB' ? 'Syncing chunks...' : `Job ID: ${jobId}`}
                </p>
              </div>

              {/* Progress Bar */}
              {jobDetails && (
                <div className="space-y-3 max-w-md mx-auto pt-3">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 px-1">
                    <span className="flex items-center gap-1"><Volume2 className="h-3.5 w-3.5 text-violet-400" /> Merging Video & Audio Chunks</span>
                    <span className="text-violet-400 font-mono">{jobDetails.progress}%</span>
                  </div>
                  
                  {/* Progress track */}
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 progress-glow transition-all duration-500 rounded-full"
                      style={{ width: `${jobDetails.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Downloading multiple segments in parallel via optimized HTTP threads. Compiling high-definition tracks.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Completed State */}
          {uiState === 'COMPLETED' && jobDetails && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              
              <div className="text-center space-y-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="h-7 w-7 animate-bounce" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Backup Completed Successfully
                </h3>
                <p className="text-xs text-zinc-400">
                  Your premium high-speed media stream backup is fully compiled and ready.
                </p>
              </div>

              {/* Complete Info details */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex items-start gap-4">
                  {jobDetails.thumbnail && (
                    <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-800 shadow-md">
                      <img src={jobDetails.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                      {jobDetails.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Creator: <span className="text-white font-medium">{jobDetails.creatorName}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-emerald-500/10 pt-4.5 text-xs text-zinc-400">
                  <div>
                    <span>Total Backup Size:</span>
                    <p className="text-white font-extrabold text-base mt-0.5">
                      {formatSize(jobDetails.fileSize)}
                    </p>
                  </div>
                  <div>
                    <span>Stream Format:</span>
                    <p className="text-white font-extrabold text-base mt-0.5 capitalize flex items-center gap-1">
                      {jobDetails.contentType === 'audio' ? '🎵 MP3 Audio' : '🎥 MP4 HD Video'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-1/3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-smooth cursor-pointer"
                >
                  Backup Another
                </button>
                
                {jobDetails.downloadUrl && jobDetails.downloadUrl.startsWith('/') ? (
                  <a
                    href={jobDetails.downloadUrl}
                    download
                    className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-smooth cursor-pointer active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Local Copy</span>
                  </a>
                ) : (
                  <a
                    href={jobDetails.downloadUrl || url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-smooth cursor-pointer active:scale-[0.99]"
                  >
                    <span>Open Backup Stream Source</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 3. Supported Channels Grid */}
      <div className="mt-24 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Supported Social Platforms
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2">
            Seamless support for mobile and desktop URLs across all major platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* YouTube */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4 border-t-2 border-t-red-500">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 shadow-inner">
              <YoutubeIcon className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-base font-bold text-white">YouTube Downloader</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Save YouTube videos in full HD or convert to crystal clear MP3 audio instantly.</p>
          </div>

          {/* TikTok */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4 border-t-2 border-t-zinc-400">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700/30 shadow-inner">
              <Tv className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-base font-bold text-white">TikTok Downloader</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Backup TikTok videos cleanly. Dynamic extraction of video and audio tracks.</p>
          </div>

          {/* Facebook */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4 border-t-2 border-t-blue-500">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-inner">
              <FacebookIcon className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-base font-bold text-white">Facebook Downloader</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Download public and authorized Facebook videos cleanly in HD quality.</p>
          </div>

          {/* Instagram */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4 border-t-2 border-t-pink-500">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-600/10 text-pink-500 border border-pink-500/20 shadow-inner">
              <InstagramIcon className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-base font-bold text-white">Instagram Downloader</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Save Instagram Reels, public posts, and photos cleanly in high speed.</p>
          </div>

        </div>
      </div>

      {/* 4. FAQs Section */}
      <div className="mt-24 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Everything you need to know about professional downloading, VPNs, and bot challenges.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="glass-panel rounded-2xl overflow-hidden border border-white/5 transition-smooth"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left font-bold text-white hover:bg-white/5 transition-smooth"
              >
                <span className="text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                  {faq.q}
                </span>
                {faqOpen[idx] ? (
                  <ChevronDown className="h-5 w-5 text-zinc-400 transform rotate-180 transition-smooth" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-400 transition-smooth" />
                )}
              </button>
              
              {faqOpen[idx] && (
                <div className="px-6 pb-5 pt-1 border-t border-white/5 text-xs sm:text-sm text-zinc-400 leading-relaxed animate-in slide-in-from-top-1 duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Safety & Compliance Statement Banner */}
      <div className="mt-24">
        <div className="glass-panel rounded-3xl p-6 sm:p-9 space-y-5 border-l-4 border-l-violet-500 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-36 w-36 bg-violet-600/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-2.5 text-violet-400">
            <ShieldCheck className="h-7 w-7" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              {t('compliance.bannerTitle')}
            </h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {t('compliance.bannerDesc')}
          </p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400 pt-3 border-t border-white/5">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
              <span>{t('compliance.bullet1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
              <span>{t('compliance.bullet2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
              <span>{t('compliance.bullet3')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
              <span>{t('compliance.bullet4')}</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  UserCheck, 
  Globe, 
  FileCheck,
  TrendingUp,
  Tv
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

interface Stats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalAudits: number;
  blockedRequests: number;
  abuseFlagsCount: number;
  platformStats: {
    youtube: number;
    tiktok: number;
    facebook: number;
    instagram: number;
  };
}

export default function AdminDashboard() {
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [abuseFlags, setAbuseFlags] = useState<any[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch admin data');
      
      setStats(data.stats);
      setRecentJobs(data.recentJobs || []);
      setRecentLogs(data.recentLogs || []);
      setAbuseFlags(data.abuseFlags || []);
    } catch (err: any) {
      console.error('[MediaFlow Admin] Fetch error:', err);
      setError(err.message || 'Error communicating with statistics server endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getPlatformIcon = (plat?: string) => {
    switch (plat?.toLowerCase()) {
      case 'youtube': return <YoutubeIcon className="h-4 w-4 text-red-500" />;
      case 'tiktok': return <Tv className="h-4 w-4 text-zinc-300" />;
      case 'facebook': return <FacebookIcon className="h-4 w-4 text-blue-500" />;
      case 'instagram': return <InstagramIcon className="h-4 w-4 text-pink-500" />;
      default: return <Globe className="h-4 w-4 text-zinc-400" />;
    }
  };

  // Render Loading Panel
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-violet-400 mx-auto" />
        <p className="text-zinc-400 text-sm">Fetching real-time security logs & system analytics...</p>
      </div>
    );
  }

  // Render Error Panel
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">System Communication Failed</h2>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button
            onClick={fetchStats}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Calculate platform allocation progress bars
  const totalAllocated = Object.values(stats?.platformStats || {}).reduce((a, b) => a + b, 0) || 1;
  const getPercentage = (count: number) => {
    return Math.round((count / totalAllocated) * 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6 lg:px-8 relative z-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-violet-400" /> {t('admin.title')}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {t('admin.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-smooth cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* KPI 1 */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.totalJobs')}</span>
            <Activity className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.totalJobs}</span>
            <span className="text-xs text-zinc-500 font-semibold">Active Jobs</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.completedJobs')}</span>
            <FileCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.completedJobs}</span>
            <span className="text-xs text-emerald-400 font-medium">
              +{stats && stats.totalJobs > 0 ? getPercentage(stats.completedJobs) : 0}% Success
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.blockedSSRF')}</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.blockedRequests}</span>
            <span className="text-xs text-zinc-500 font-semibold">Failed Attempts</span>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Table: Recent Jobs */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('admin.recentJobs')}
              </h3>
            </div>

            <div className="overflow-x-auto">
              {recentJobs.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  No active social download jobs found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Source URL</th>
                      <th className="px-5 py-3">Platform</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {recentJobs.map((job: any) => (
                      <tr key={job.id} className="hover:bg-white/2 transition-smooth">
                        <td className="px-5 py-3 truncate max-w-[200px] font-medium text-white">
                          {job.url}
                        </td>
                        <td className="px-5 py-3 flex items-center gap-1.5 capitalize">
                          {getPlatformIcon(job.platform)}
                          <span>{job.platform}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold ${
                            job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            job.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-500">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Table: Security Audits */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('admin.recentAudits')}
              </h3>
            </div>

            <div className="overflow-x-auto">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  No security audits logged.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">Result</th>
                      <th className="px-5 py-3">Blocking Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/2 transition-smooth">
                        <td className="px-5 py-3 font-semibold text-white">
                          {log.ipAddress}
                        </td>
                        <td className="px-5 py-3 font-medium text-zinc-400">
                          {log.action}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold ${
                            log.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.success ? t('admin.success') : t('admin.blocked')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-400 truncate max-w-[200px]">
                          {log.reason || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Allocations & Flags */}
        <div className="space-y-6">
          
          {/* Allocation card */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              {t('admin.chartTitle')}
            </h3>

            {stats && (
              <div className="space-y-4 text-xs">
                
                {/* YouTube */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span className="flex items-center gap-1"><YoutubeIcon className="h-3.5 w-3.5 text-red-500" /> YouTube</span>
                    <span>{getPercentage(stats.platformStats.youtube)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${getPercentage(stats.platformStats.youtube)}%` }}></div>
                  </div>
                </div>

                {/* TikTok */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span className="flex items-center gap-1"><Tv className="h-3.5 w-3.5 text-zinc-300" /> TikTok</span>
                    <span>{getPercentage(stats.platformStats.tiktok)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${getPercentage(stats.platformStats.tiktok)}%` }}></div>
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span className="flex items-center gap-1"><FacebookIcon className="h-3.5 w-3.5 text-blue-500" /> Facebook</span>
                    <span>{getPercentage(stats.platformStats.facebook)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${getPercentage(stats.platformStats.facebook)}%` }}></div>
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span className="flex items-center gap-1"><InstagramIcon className="h-3.5 w-3.5 text-pink-500" /> Instagram</span>
                    <span>{getPercentage(stats.platformStats.instagram)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${getPercentage(stats.platformStats.instagram)}%` }}></div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Abuse Flags card */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('admin.activeFlags')}
            </h3>

            <div className="space-y-3.5 text-xs">
              {abuseFlags.length === 0 ? (
                <div className="py-4 text-center text-zinc-500 flex items-center gap-2 justify-center border border-white/5 rounded-lg bg-white/2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>{t('admin.noFlags')}</span>
                </div>
              ) : (
                abuseFlags.map((flag: any) => (
                  <div key={flag.id} className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span className="font-semibold text-red-400 uppercase tracking-wider">SSRF Violation Warning</span>
                      <span>{new Date(flag.flaggedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-medium">
                      Target IP: <span className="text-white font-bold">{flag.target}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {flag.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

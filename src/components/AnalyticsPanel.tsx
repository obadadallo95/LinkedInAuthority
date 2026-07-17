import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

type Language = 'ar' | 'en' | 'de';

interface AnalyticsPanelProps {
  lang: Language;
  posts?: any[];
  settings?: {
    linkedinToken?: string;
    [key: string]: any;
  };
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ lang, posts = [], settings = {} as Record<string, any> }) => {
  const isAr = lang === 'ar';
  
  const [linkedinStats, setLinkedinStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // Content Strings
  const content = {
    ar: {
      title: 'التحليلات ومؤشرات الأداء',
      subtitle: 'تتبع أداء محتواك ونموه على LinkedIn',
      totalPosts: 'إجمالي المنشورات',
      publishedPosts: 'تم النشر بنجاح',
      totalLikes: 'إجمالي الإعجابات',
      totalComments: 'إجمالي التعليقات',
      chartTitle: 'نشاط إنشاء المحتوى (آخر 7 أيام)',
      postsLabel: 'منشورات',
      topPosts: 'أفضل المنشورات أداءً',
      noData: 'لا توجد منشورات كافية لعرضها بعد',
      linkedinConnected: 'متصل بـ LinkedIn - يتم جلب البيانات المباشرة',
      linkedinDisconnected: 'قم بربط حساب LinkedIn لجلب التفاعلات الحقيقية',
      linkedinError: 'حسابك الشخصي لا يملك صلاحيات المطور لجلب الإحصائيات عبر API. يتم عرض التفاعلات المتاحة فقط.',
      refreshing: 'جاري تحديث البيانات...',
      status: 'الحالة',
      date: 'التاريخ'
    },
    en: {
      title: 'Analytics & Performance',
      subtitle: 'Track your content performance and growth on LinkedIn',
      totalPosts: 'Total Generated',
      publishedPosts: 'Published Posts',
      totalLikes: 'Total Likes',
      totalComments: 'Total Comments',
      chartTitle: 'Content Generation Activity (Last 7 Days)',
      postsLabel: 'Posts',
      topPosts: 'Top Performing Posts',
      noData: 'Not enough posts to display yet',
      linkedinConnected: 'LinkedIn Connected - Fetching Live Data',
      linkedinDisconnected: 'Connect LinkedIn account to fetch real interactions',
      linkedinError: 'Personal accounts lack API scopes to fetch full metrics. Showing available data.',
      refreshing: 'Refreshing data...',
      status: 'Status',
      date: 'Date'
    },
    de: {
      title: 'Analyse & Leistung',
      subtitle: 'Verfolgen Sie Ihre Inhaltsleistung und Ihr Wachstum auf LinkedIn',
      totalPosts: 'Insgesamt Generiert',
      publishedPosts: 'Veröffentlichte Beiträge',
      totalLikes: 'Gefällt mir',
      totalComments: 'Kommentare',
      chartTitle: 'Inhaltserstellung (Letzte 7 Tage)',
      postsLabel: 'Beiträge',
      topPosts: 'Leistungsstärkste Beiträge',
      noData: 'Noch nicht genug Beiträge',
      linkedinConnected: 'Mit LinkedIn verbunden - Live-Daten abrufen',
      linkedinDisconnected: 'LinkedIn-Konto verbinden für echte Interaktionen',
      linkedinError: 'Persönliche Konten haben keine API-Berechtigungen. Zeige verfügbare Daten.',
      refreshing: 'Daten werden aktualisiert...',
      status: 'Status',
      date: 'Datum'
    }
  };

  const current = content[lang] || content.en;

  // Process Internal Data from Posts array
  const internalMetrics = useMemo(() => {
    const totalGenerated = posts.filter(p => p.status !== 'template').length;
    const published = posts.filter(p => p.status === 'published').length;
    
    // Group by last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map(dateStr => {
      // Find posts generated on this date
      const count = posts.filter(p => {
        if (p.status === 'template') return false;
        const postDate = new Date(p.createdAt || Date.now()).toISOString().split('T')[0];
        return postDate === dateStr;
      }).length;
      
      const shortDate = new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return {
        name: shortDate,
        posts: count,
        rawDate: dateStr
      };
    });

    return { totalGenerated, published, chartData };
  }, [posts, isAr]);

  // Fetch Live Data from LinkedIn if connected
  useEffect(() => {
    const fetchLinkedInStats = async () => {
      const publishedPosts = posts.filter(p => p.status === 'published' && p.linkedinPostId);
      if (publishedPosts.length === 0 || !settings?.linkedinToken) return;

      setLoadingStats(true);
      setErrorStats(null);
      try {
        const postIds = publishedPosts.map(p => p.linkedinPostId);
        const res = await fetch('/api/linkedin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: settings.linkedinToken,
            postIds
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setLinkedinStats(result.data);
            // Check if all failed with error, which usually indicates scope limitations
            const anySuccess = Object.values(result.data).some((d: any) => d.success);
            if (!anySuccess && Object.keys(result.data).length > 0) {
              setErrorStats(current.linkedinError);
            }
          }
        }
      } catch (err: any) {
        console.error("Stats Error:", err);
        setErrorStats(current.linkedinError);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchLinkedInStats();
  }, [posts, settings?.linkedinToken, current.linkedinError]);

  // Compute Aggregated LinkedIn Stats
  const { totalLikes, totalComments, topPosts } = useMemo(() => {
    let likes = 0;
    let comments = 0;
    
    const postsWithStats = posts.filter(p => p.status !== 'template').map(p => {
      const stats = p.linkedinPostId && linkedinStats[p.linkedinPostId] ? linkedinStats[p.linkedinPostId] : { likes: 0, comments: 0 };
      likes += stats.likes || 0;
      comments += stats.comments || 0;
      
      return {
        ...p,
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        totalInteractions: (stats.likes || 0) + (stats.comments || 0)
      };
    });

    // Sort by most interactions, then by newest
    const sorted = [...postsWithStats].sort((a, b) => {
      if (b.totalInteractions !== a.totalInteractions) {
        return b.totalInteractions - a.totalInteractions;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }).slice(0, 5);

    return { totalLikes: likes, totalComments: comments, topPosts: sorted };
  }, [posts, linkedinStats]);

  const kpis = [
    { label: current.totalPosts, value: internalMetrics.totalGenerated, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: current.publishedPosts, value: internalMetrics.published, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: current.totalLikes, value: totalLikes, icon: ThumbsUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: current.totalComments, value: totalComments, icon: MessageSquare, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-400" />
          {current.title}
        </h1>
        <p className="text-gray-400 mt-2 text-lg">{current.subtitle}</p>
        
        {/* Status Indicator */}
        <div className="mt-4 flex items-center gap-2">
          {settings?.linkedinToken ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {current.linkedinConnected}
              {loadingStats && <RefreshCw className="w-3 h-3 animate-spin ml-2" />}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {current.linkedinDisconnected}
            </div>
          )}
        </div>

        {errorStats && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs max-w-2xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="leading-relaxed">{errorStats}</span>
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 mb-8 shadow-xl"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          {current.chartTitle}
        </h3>
        <div className="h-[400px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={internalMetrics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="posts" 
                name={current.postsLabel}
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPosts)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Top Posts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-bold text-white">{current.topPosts}</h3>
        </div>
        
        {topPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {current.noData}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {topPosts.map((post) => (
              <div key={post.id || Math.random()} className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 whitespace-nowrap">
                      {post.repoName || 'Custom Post'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.createdAt || Date.now()).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                    {post.status === 'published' && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> {isAr ? 'منشور' : 'Published'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {post.text}
                  </p>
                </div>
                
                {/* Stats for this post */}
                <div className="flex items-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-white/5 rtl:sm:pl-0 rtl:sm:pr-4 rtl:sm:border-l-0 rtl:sm:border-r">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-bold">{post.likes}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-bold">{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

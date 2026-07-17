import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2 
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
}

const mockData = [
  { name: '1', views: 4000, engagement: 2400 },
  { name: '2', views: 3000, engagement: 1398 },
  { name: '3', views: 5000, engagement: 3800 },
  { name: '4', views: 2780, engagement: 1908 },
  { name: '5', views: 6890, engagement: 4800 },
  { name: '6', views: 8390, engagement: 3800 },
  { name: '7', views: 10490, engagement: 5300 },
];

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const content = {
    ar: {
      title: 'التحليلات ومؤشرات الأداء',
      subtitle: 'تتبع أداء محتواك ونموه على LinkedIn',
      totalViews: 'إجمالي المشاهدات',
      totalEngagement: 'التفاعلات',
      profileVisits: 'زيارات الملف الشخصي',
      followersGrowth: 'نمو المتابعين',
      chartTitle: 'الأداء خلال آخر 7 أيام',
      views: 'مشاهدات',
      engagement: 'تفاعل',
      topPosts: 'أفضل المنشورات أداءً',
      noData: 'لا توجد بيانات كافية لعرضها بعد'
    },
    en: {
      title: 'Analytics & Performance',
      subtitle: 'Track your content performance and growth on LinkedIn',
      totalViews: 'Total Views',
      totalEngagement: 'Engagements',
      profileVisits: 'Profile Visits',
      followersGrowth: 'Followers Growth',
      chartTitle: 'Performance Over Last 7 Days',
      views: 'Views',
      engagement: 'Engagement',
      topPosts: 'Top Performing Posts',
      noData: 'Not enough data to display yet'
    },
    de: {
      title: 'Analyse & Leistung',
      subtitle: 'Verfolgen Sie Ihre Inhaltsleistung und Ihr Wachstum auf LinkedIn',
      totalViews: 'Gesamtaufrufe',
      totalEngagement: 'Interaktionen',
      profileVisits: 'Profilbesuche',
      followersGrowth: 'Follower-Wachstum',
      chartTitle: 'Leistung der letzten 7 Tage',
      views: 'Aufrufe',
      engagement: 'Interaktion',
      topPosts: 'Leistungsstärkste Beiträge',
      noData: 'Noch nicht genug Daten zum Anzeigen'
    }
  };

  const current = content[lang];

  const kpis = [
    { label: current.totalViews, value: '124.5K', change: '+12.5%', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: current.totalEngagement, value: '8,432', change: '+5.2%', icon: ThumbsUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: current.profileVisits, value: '3,210', change: '+18.4%', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: current.followersGrowth, value: '+450', change: '+2.1%', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' },
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
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
                {kpi.change}
              </span>
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
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 mb-8"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          {current.chartTitle}
        </h3>
        <div className="h-[400px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
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
                dataKey="views" 
                name={current.views}
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
              <Area 
                type="monotone" 
                dataKey="engagement" 
                name={current.engagement}
                stroke="#a78bfa" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEngagement)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Coming Soon Section for Top Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 text-center"
      >
        <h3 className="text-xl font-bold text-white mb-2">{current.topPosts}</h3>
        <p className="text-gray-400">{current.noData}</p>
      </motion.div>
    </div>
  );
};

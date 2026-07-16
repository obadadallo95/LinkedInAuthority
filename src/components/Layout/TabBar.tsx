import React from 'react';
import { t } from '../../constants';

interface TabBarProps {
  lang: 'ar' | 'en' | 'de';
  activeTab: string;
  setActiveTab: (tab: "draft" | "scheduled" | "published" | "analytics") => void;
  counts: { draft: number; scheduled: number; published: number };
}

export const TabBar: React.FC<TabBarProps> = ({ lang, activeTab, setActiveTab, counts }) => (
  <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto">
    <button onClick={() => setActiveTab("draft")} className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "draft" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
      {t[lang].tabDrafts} ({counts.draft})
    </button>
    <button onClick={() => setActiveTab("scheduled")} className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "scheduled" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
      {t[lang].tabScheduled} ({counts.scheduled})
    </button>
    <button onClick={() => setActiveTab("published")} className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "published" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
      {t[lang].tabPublished} ({counts.published})
    </button>
    <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeTab === "analytics" ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
      {t[lang].tabAnalytics}
    </button>
  </div>
);

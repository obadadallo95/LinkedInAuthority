import React, { useState } from 'react';
import { Activity, Plus, Play, Pause, Calendar, Clock } from 'lucide-react';
import { t } from '../constants';
import { CreateAutomationModal } from './CreateAutomationModal';

interface AutomationsDashboardProps {
  lang: 'ar' | 'en' | 'de';
  repos: any[];
}

export const AutomationsDashboard: React.FC<AutomationsDashboardProps> = ({ lang, repos }) => {
  const isAr = lang === 'ar';
  const [automations, setAutomations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveAutomation = async (config: any) => {
    // In a real app, this would save to Firestore
    // For now, we update local state
    setAutomations([config, ...automations]);
  };

  return (
    <div className="flex flex-col w-full h-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            <Activity className="w-6 h-6 text-indigo-400" />
            {(t[lang] as any).automationsTitle || 'Automations'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {(t[lang] as any).automationsDesc || 'Monitor and generate automated posts.'}
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{(t[lang] as any).automationCreateBtn || 'Create Automation'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {automations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-slate-900/30 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <Activity className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{(t[lang] as any).automationEmptyTitle || 'No Automations'}</h3>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-8">
            {(t[lang] as any).automationEmptyDesc || 'Set up weekly insights and content generation for your repositories.'}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-bold border border-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{(t[lang] as any).automationCreateBtn || 'Create New Automation'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((auto, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${auto.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                  <span className="text-sm font-bold text-slate-300 truncate max-w-[150px]">{auto.repo}</span>
                </div>
                <div className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 font-mono">
                  {auto.schedule.day.substring(0,3)} {auto.schedule.time}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{auto.type.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      )}

      <CreateAutomationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
        repos={repos}
        onSave={handleSaveAutomation}
      />
    </div>
  );
};

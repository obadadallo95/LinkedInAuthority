import React, { useState } from 'react';
import { Activity, Plus, Play, Pause, Calendar, Clock } from 'lucide-react';
import { t } from '../constants';
import { CreateAutomationModal } from './CreateAutomationModal';
import { useAuth } from '../application/AuthContext';
import { firestoreService, ProjectData } from '../services/firestoreService';

interface AutomationsDashboardProps {
  lang: 'ar' | 'en' | 'de';
  repos: any[];
}

export const AutomationsDashboard: React.FC<AutomationsDashboardProps> = ({ lang, repos }) => {
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const [automations, setAutomations] = useState<(ProjectData & { id: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const projects = await firestoreService.getUserProjects(user.uid);
      const activeAutomations = projects.filter(p => p.monitoringEnabled);
      setAutomations(activeAutomations);
    } catch (error) {
      console.error("Error fetching automations:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAutomations();
  }, [user]);

  const handleSaveAutomation = async (config: any) => {
    if (!user) return;
    try {
      const { repo, owner, scheduleDay, scheduleTime, intent, targetAudience, monitorCommits, monitorIssues, monitorPullRequests } = config;
      const projectId = `${owner}_${repo}`;
      
      const projectMeta = repos.find(r => r.name === repo);
      
      // Save or ensure project exists
      await firestoreService.saveProject(user.uid, {
        owner: owner,
        repo: repo,
        fullName: `${owner}/${repo}`,
        description: projectMeta?.description || '',
        language: projectMeta?.language || '',
      });

      // Enable monitoring with config
      await firestoreService.updateProject(user.uid, projectId, {
        monitoringEnabled: true,
        monitoringConfig: {
          intent,
          targetAudience,
          monitorCommits,
          monitorIssues,
          monitorPullRequests,
          scheduleDay,
          scheduleTime,
        }
      });
      
      await fetchAutomations();
    } catch (error) {
      console.error("Error saving automation:", error);
      alert("Failed to save automation");
    }
  };

  const toggleAutomation = async (projectId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await firestoreService.updateProject(user.uid, projectId, {
        monitoringEnabled: !currentStatus
      });
      await fetchAutomations();
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
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
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : automations.length === 0 ? (
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
          {automations.map((auto) => (
            <div key={auto.id} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4 relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${auto.monitoringEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                  <span className="text-sm font-bold text-slate-300 truncate max-w-[150px]">{auto.repo}</span>
                </div>
                <div className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 font-mono">
                  {auto.monitoringConfig?.scheduleDay?.substring(0,3) || 'Fri'} {auto.monitoringConfig?.scheduleTime || '09:00'}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{auto.monitoringConfig?.intent || 'Weekly Progress'}</p>
              
              <button 
                onClick={() => toggleAutomation(auto.id, !!auto.monitoringEnabled)}
                className="absolute bottom-4 right-4 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                title={auto.monitoringEnabled ? "Pause Automation" : "Resume Automation"}
              >
                {auto.monitoringEnabled ? <Pause size={16} /> : <Play size={16} />}
              </button>
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

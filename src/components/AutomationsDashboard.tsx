import React, { useState } from 'react';
import { Activity, Plus, Play, Pause, CheckCircle2, AlertCircle, Clock3, Trash2, RefreshCw } from 'lucide-react';
import { t } from '../constants';
import { CreateAutomationModal } from './CreateAutomationModal';
import { useAuth } from '../application/AuthContext';
import { firestoreService, ProjectData } from '../services/firestoreService';
import { isBrowserE2E } from '../utils/e2e';

interface AutomationsDashboardProps {
  lang: 'ar' | 'en' | 'de';
  repos: any[];
}

export const AutomationsDashboard: React.FC<AutomationsDashboardProps> = ({ lang, repos }) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  const { user } = useAuth();
  const [automations, setAutomations] = useState<(ProjectData & { id: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [runHistoryError, setRunHistoryError] = useState(false);
  const [runs, setRuns] = useState<Record<string, any>[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRunHistory = async (projects: (ProjectData & { id: string })[]) => {
    if (!user) return;
    setRunHistoryError(false);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/automation/runs?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to load automation history');
      const payload = await response.json();
      setRuns(Array.isArray(payload.runs) ? payload.runs : []);
    } catch (error) {
      console.error('Error fetching automation history:', error);
      setRuns([]);
      setRunHistoryError(true);
    }
  };

  const fetchAutomations = async () => {
    if (!user) return;
    setLoadError(false);
    setLoading(true);
    try {
      const projects = await firestoreService.getUserProjects(user.uid);
      const safeProjects = Array.isArray(projects) ? projects : [];
      // Keep paused projects visible so the user can resume them. Filtering
      // them out made the visible Pause/Resume control one-way and turned a
      // recoverable state into a misleading empty page.
      setAutomations(safeProjects);
      await fetchRunHistory(safeProjects);
    } catch (error) {
      console.error("Error fetching automations:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const latestRunFor = (projectId: string) => runs.find(run => run.projectId === projectId);
  const runLabel = (status?: string) => ({
    checked: isAr ? 'تم الفحص' : isDe ? 'Geprüft' : 'Checked',
    no_activity: isAr ? 'لا يوجد نشاط' : isDe ? 'Keine Aktivität' : 'No activity',
    not_meaningful: isAr ? 'نشاط غير كافٍ' : isDe ? 'Nicht aussagekräftig' : 'Not meaningful',
    draft_created: isAr ? 'تم إنشاء مسودة' : isDe ? 'Entwurf erstellt' : 'Draft created',
    failed: isAr ? 'فشل' : isDe ? 'Fehlgeschlagen' : 'Failed',
  } as Record<string, string>)[status || ''] || (isAr ? 'لم يعمل بعد' : isDe ? 'Noch nicht ausgeführt' : 'Not run yet');

  React.useEffect(() => {
    fetchAutomations();
  }, [user]);

  const handleSaveAutomation = async (config: any) => {
    if (!user) return;
    setActionError(null);
    try {
      const { repo, owner, fullName, scheduleDay, scheduleTime, intent, targetAudience, contentLanguage, timezone, monitorCommits, monitorIssues, monitorPullRequests } = config;
      const resolvedOwner = owner || (fullName ? fullName.split('/')[0] : '');
      const resolvedRepo = repo || (fullName ? fullName.split('/')[1] : '');
      const resolvedFullName = fullName || (resolvedOwner && resolvedRepo ? `${resolvedOwner}/${resolvedRepo}` : resolvedRepo);

      if (!resolvedOwner || !resolvedRepo) {
        console.error("Cannot save automation without valid owner and repository name:", config);
        setActionError(isAr ? 'بيانات المستودع غير مكتملة' : isDe ? 'Die Repository-Identität ist unvollständig.' : 'Repository identity is incomplete.');
        return;
      }

      const projectId = `${resolvedOwner}_${resolvedRepo}`;
      const projectMeta = repos.find(r => r.full_name === resolvedFullName || (r.name === resolvedRepo && r.owner?.login === resolvedOwner));
      
      if (isBrowserE2E) {
        await firestoreService.saveProject(user.uid, {
          owner: resolvedOwner,
          repo: resolvedRepo,
          fullName: resolvedFullName,
          description: projectMeta?.description || '',
          language: projectMeta?.language || '',
        });
        await firestoreService.updateProject(user.uid, projectId, {
          monitoringEnabled: true,
          monitoringConfig: { intent, targetAudience, contentLanguage: contentLanguage || 'en', timezone: timezone || 'UTC', monitorCommits: monitorCommits ?? true, monitorIssues: monitorIssues ?? false, monitorPullRequests: monitorPullRequests ?? false, scheduleDay, scheduleTime }
        });
      } else {
        const token = await user.getIdToken();
        const response = await fetch('/api/automation/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ owner: resolvedOwner, repo: resolvedRepo, description: projectMeta?.description || '', language: projectMeta?.language || '', intent, targetAudience, contentLanguage: contentLanguage || 'en', timezone: timezone || 'UTC', monitorCommits: monitorCommits ?? true, monitorIssues: monitorIssues ?? false, monitorPullRequests: monitorPullRequests ?? false, scheduleDay, scheduleTime }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Automation project could not be saved');
        }
      }
      
      await fetchAutomations();
    } catch (error) {
      console.error("Error saving automation:", error);
      setActionError(isAr ? 'تعذر حفظ الأتمتة حالياً.' : isDe ? 'Die Automatisierung konnte nicht gespeichert werden.' : 'Failed to save automation');
    }
  };

  const toggleAutomation = async (projectId: string, currentStatus: boolean) => {
    if (!user) return;
    setActionError(null);
    try {
      if (isBrowserE2E) {
        await firestoreService.updateProject(user.uid, projectId, { monitoringEnabled: !currentStatus });
      } else {
        const token = await user.getIdToken();
        const response = await fetch(`/api/automation/projects/${encodeURIComponent(projectId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ monitoringEnabled: !currentStatus }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Automation could not be updated');
        }
      }
      await fetchAutomations();
    } catch (error) {
      console.error("Error toggling automation:", error);
      setActionError(isAr ? 'تعذر تحديث الأتمتة حالياً.' : isDe ? 'Die Automatisierung konnte nicht aktualisiert werden.' : 'Automation could not be updated.');
    }
  };

  const deleteAutomation = async (projectId: string, repoName: string) => {
    if (!user) return;
    setActionError(null);
    const message = isAr
      ? `سيؤدي ذلك إلى حذف مراقبة ${repoName} وسجل تشغيلها. هل تريد المتابعة؟`
      : `This deletes monitoring and run history for ${repoName}. Continue?`;
    if (!window.confirm(message)) return;
    try {
      if (isBrowserE2E) {
        await firestoreService.updateProject(user.uid, projectId, { monitoringEnabled: false });
      } else {
        const token = await user.getIdToken();
        const response = await fetch(`/api/automation/projects/${encodeURIComponent(projectId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Project deletion failed');
      }
      await fetchAutomations();
    } catch (error) {
      console.error('Error deleting automation project:', error);
      setActionError(isAr ? 'تعذر حذف المشروع حالياً.' : isDe ? 'Das Projekt ist vorübergehend nicht verfügbar.' : 'Project deletion is temporarily unavailable.');
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

      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert" aria-live="assertive">
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-300">
            {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {runHistoryError && !loading && !loadError && (
        <div role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          {isAr ? 'تعذر تحميل سجل التشغيل؛ الحالات المعروضة للمشاريع قد لا تكون محدثة.' : isDe ? 'Der Laufverlauf konnte nicht geladen werden; Projektstatus kann veraltet sein.' : 'Run history could not be loaded; project statuses may be stale.'}
        </div>
      )}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : loadError ? (
        <div role="alert" className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-amber-500/20 rounded-3xl bg-amber-500/5 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mb-5" />
          <h3 className="text-xl font-bold text-white mb-2">{isAr ? 'تعذر تحميل الأتمتة' : lang === 'de' ? 'Automatisierungen konnten nicht geladen werden' : 'Automations could not be loaded'}</h3>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">{isAr ? 'تحقق من الاتصال ثم أعد المحاولة. لن يتم إنشاء مسودات حتى يعمل الفحص بنجاح.' : lang === 'de' ? 'Prüfe die Verbindung und versuche es erneut. Es werden keine Entwürfe erstellt, bevor die Prüfung erfolgreich ist.' : 'Check the connection and retry. No drafts are created until the check succeeds.'}</p>
          <button onClick={fetchAutomations} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold">
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'إعادة المحاولة' : lang === 'de' ? 'Erneut versuchen' : 'Retry'}</span>
          </button>
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
                <div className="flex items-center gap-1.5">
                  <span className="bg-indigo-500/15 text-indigo-300 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                    {auto.monitoringConfig?.contentLanguage || 'en'}
                  </span>
                  <div className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 font-mono">
                    {auto.monitoringConfig?.scheduleDay?.substring(0,3) || 'Fri'} {auto.monitoringConfig?.scheduleTime || '09:00'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-300 font-medium">{auto.monitoringConfig?.intent === 'technical_deep_dive' ? (isAr ? 'تحليل تقني عميق' : 'Technical Deep Dive') : (isAr ? 'ملخص التقدم الأسبوعي' : 'Weekly Progress')}</p>
                <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-500">
                  {auto.monitoringConfig?.monitorCommits && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">Commits</span>}
                  {auto.monitoringConfig?.monitorPullRequests && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">PRs</span>}
                  {auto.monitoringConfig?.monitorIssues && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">Issues</span>}
                  {auto.monitoringConfig?.timezone && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/5 font-mono text-[9px] text-slate-400">{auto.monitoringConfig.timezone}</span>}
                </div>
              </div>

              {(() => {
                const run = latestRunFor(auto.id);
                const failed = run?.status === 'failed';
                return (
                  <div className={`rounded-lg border px-2.5 py-2 text-[10px] ${failed ? 'border-red-500/20 bg-red-500/5 text-red-200' : 'border-white/5 bg-slate-950/50 text-slate-400'}`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      {failed ? <AlertCircle size={12} /> : run?.status === 'draft_created' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                      <span>{runLabel(run?.status)}</span>
                      {run?.updatedAt && <span className="ms-auto font-mono opacity-70">{new Date(run.updatedAt).toLocaleDateString()}</span>}
                    </div>
                    {run?.failureReason && <p className="mt-1 opacity-80 line-clamp-2">{run.failureReason}</p>}
                  </div>
                );
              })()}
              
              <button 
                onClick={() => toggleAutomation(auto.id, !!auto.monitoringEnabled)}
                className="absolute bottom-4 right-14 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-all focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                title={auto.monitoringEnabled ? "Pause Automation" : "Resume Automation"}
                aria-label={auto.monitoringEnabled ? (isAr ? 'إيقاف الأتمتة' : 'Pause automation') : (isAr ? 'استئناف الأتمتة' : 'Resume automation')}
              >
                {auto.monitoringEnabled ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => deleteAutomation(auto.id, auto.repo)}
                className="absolute bottom-4 right-4 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-all focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                title={isAr ? 'حذف المشروع وسجل التشغيل' : 'Delete project and run history'}
                aria-label={isAr ? 'حذف المشروع وسجل التشغيل' : 'Delete project and run history'}
              >
                <Trash2 size={16} />
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

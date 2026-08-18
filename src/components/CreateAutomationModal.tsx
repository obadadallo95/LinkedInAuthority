import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, Calendar, FolderGit2, Search, RefreshCw, Zap, Type, Target } from 'lucide-react';
import { t } from '../constants';

interface CreateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en' | 'de';
  repos: any[];
  onSave: (automationConfig: any) => Promise<void>;
  loadingRepos?: boolean;
}

export const CreateAutomationModal: React.FC<CreateAutomationModalProps> = ({
  isOpen,
  onClose,
  lang,
  repos,
  onSave,
  loadingRepos
}) => {
  const isAr = lang === 'ar';
  const [step, setStep] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  const [scheduleDay, setScheduleDay] = useState('Friday');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [postType, setPostType] = useState('weekly_progress');
  const [targetAudience, setTargetAudience] = useState('tech_community');
  const [contentLanguage, setContentLanguage] = useState<'ar' | 'en' | 'de'>('en');
  const [timezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [monitorCommits, setMonitorCommits] = useState(true);
  const [monitorIssues, setMonitorIssues] = useState(false);
  const [monitorPullRequests, setMonitorPullRequests] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const filteredRepos = repos.filter(r => {
    const nameMatch = r.name && r.name.toLowerCase().includes(repoSearch.toLowerCase());
    const fullNameMatch = r.full_name && r.full_name.toLowerCase().includes(repoSearch.toLowerCase());
    return nameMatch || fullNameMatch;
  });

  const handleSave = async () => {
    if (!selectedRepo) return;

    const owner = selectedRepo.owner?.login || 
      (selectedRepo.full_name ? selectedRepo.full_name.split('/')[0] : '') || 
      '';
    const repoName = selectedRepo.name || 
      (selectedRepo.full_name ? selectedRepo.full_name.split('/')[1] : '') || 
      '';
    const fullName = selectedRepo.full_name || 
      (owner && repoName ? `${owner}/${repoName}` : repoName);

    if (!owner || !repoName) {
      console.error("Invalid repository identity for automation:", selectedRepo);
      return;
    }

    setSaving(true);
    await onSave({
      repo: repoName,
      owner,
      fullName,
      scheduleDay,
      scheduleTime,
      intent: postType,
      targetAudience,
      contentLanguage,
      timezone,
      monitorCommits,
      monitorIssues,
      monitorPullRequests,
      active: true,
      createdAt: new Date().toISOString()
    });
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{(t[lang] as any).createAutomationTitle || 'Create Automation'}</h3>
                <p className="text-xs text-slate-400">{(t[lang] as any).createAutomationDesc || 'Set up a weekly automated post.'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Step 1: Select Repository */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">1</span>
                {isAr ? 'اختر المستودع' : 'Select Repository'}
              </div>
              <div className="relative">
                <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
                <input
                  type="text"
                  placeholder={isAr ? 'ابحث عن مستودع...' : 'Search repositories...'}
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className={`w-full bg-slate-950 border border-white/5 text-sm rounded-xl py-3 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors`}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                {loadingRepos ? (
                   <div className="col-span-2 flex justify-center py-6">
                     <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                   </div>
                ) : filteredRepos.length > 0 ? (
                  filteredRepos.map(repo => {
                    const isSelected = selectedRepo && (
                      (selectedRepo.full_name && repo.full_name && selectedRepo.full_name === repo.full_name) ||
                      (selectedRepo.name === repo.name && (selectedRepo.owner?.login || '') === (repo.owner?.login || ''))
                    );
                    return (
                      <button
                        key={repo.full_name || `${repo.owner?.login || ''}_${repo.name}`}
                        onClick={() => setSelectedRepo(repo)}
                        className={`flex items-start gap-3 p-3 text-left rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/20 border-indigo-500/50' 
                            : 'bg-slate-950 border-white/5 hover:border-white/10 hover:bg-slate-900'
                        }`}
                      >
                        <FolderGit2 className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>{repo.full_name || repo.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-1">{repo.description || 'No description'}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-6 text-sm text-slate-500">
                    No repositories found.
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Content Strategy */}
            <div className={`space-y-4 transition-opacity duration-300 ${!selectedRepo ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">2</span>
                {isAr ? 'استراتيجية المحتوى' : 'Content Strategy'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'weekly_progress', label: isAr ? 'ملخص التقدم الأسبوعي' : 'Weekly Progress Summary', icon: Target },
                  { id: 'technical_deep_dive', label: isAr ? 'تحليل تقني عميق' : 'Technical Deep Dive', icon: Type }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setPostType(type.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      postType === type.id 
                        ? 'bg-indigo-500/20 border-indigo-500/50' 
                        : 'bg-slate-950 border-white/5 hover:border-white/10 hover:bg-slate-900'
                    }`}
                  >
                    <type.icon className={`w-5 h-5 ${postType === type.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className={`text-sm font-bold ${postType === type.id ? 'text-indigo-300' : 'text-slate-300'}`}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Audience & Content Language & Tracking */}
            <div className={`space-y-4 transition-opacity duration-300 ${!selectedRepo ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">3</span>
                {isAr ? 'الجمهور المستهدف ولغة المنشور' : 'Audience & Content Language'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {isAr ? 'الجمهور المستهدف' : 'Target Audience'}
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className={`w-full bg-slate-950 border border-white/5 text-sm rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50`}
                  >
                    <option value="tech_community">{isAr ? 'المجتمع التقني' : 'Tech Community'}</option>
                    <option value="recruiters">{isAr ? 'مدراء التوظيف' : 'Recruiters'}</option>
                    <option value="beginners">{isAr ? 'المبتدئين' : 'Beginners'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {isAr ? 'لغة المنشور المولّد' : 'Generated Content Language'}
                  </label>
                  <select
                    value={contentLanguage}
                    onChange={(e) => setContentLanguage(e.target.value as any)}
                    className={`w-full bg-slate-950 border border-white/5 text-sm rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50`}
                  >
                    <option value="en">English (EN)</option>
                    <option value="ar">العربية (AR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  {isAr ? 'مصادر النشاط المراقبة' : 'Monitored Activity Sources'}
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={monitorCommits} onChange={(e) => setMonitorCommits(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500" />
                    {isAr ? 'الالتزامات (Commits)' : 'Commits'}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={monitorIssues} onChange={(e) => setMonitorIssues(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500" />
                    {isAr ? 'المشاكل (Issues)' : 'Issues'}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={monitorPullRequests} onChange={(e) => setMonitorPullRequests(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500" />
                    {isAr ? 'طلبات السحب (PRs)' : 'PRs'}
                  </label>
                </div>
              </div>
            </div>

            {/* Step 4: Schedule */}
            <div className={`space-y-4 transition-opacity duration-300 ${!selectedRepo ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">4</span>
                  {isAr ? 'الجدولة والتوقيت' : 'Schedule & Timing'}
                </div>
                <span className="text-[11px] text-indigo-400/80 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {timezone}
                </span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Calendar className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
                  <select
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(e.target.value)}
                    className={`w-full bg-slate-950 border border-white/5 text-sm rounded-xl py-3.5 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none`}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 relative">
                  <Clock className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className={`w-full bg-slate-950 border border-white/5 text-sm rounded-xl py-3.5 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-slate-200 focus:outline-none focus:border-indigo-500/50`}
                  />
                </div>
              </div>
            </div>
            
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 bg-slate-900/80 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              {(t[lang] as any).cancelBtn || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedRepo || saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{(t[lang] as any).saveBtn || 'Save Automation'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

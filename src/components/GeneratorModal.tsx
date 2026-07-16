import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Search, GitBranch, RefreshCw } from 'lucide-react';
import { t } from '../constants';

type GeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en' | 'de';
  repos: any[];
  loadingRepos: boolean;
  repoSearch: string;
  setRepoSearch: (val: string) => void;
  selectedRepo: string;
  setSelectedRepo: (val: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (val: string) => void;
  handleAnalyzeRepo: (e: React.FormEvent) => void;
  analyzingRepo: boolean;
  settings: any;
};

export const GeneratorModal = ({
  isOpen,
  onClose,
  lang,
  repos,
  loadingRepos,
  repoSearch,
  setRepoSearch,
  selectedRepo,
  setSelectedRepo,
  selectedTemplate,
  setSelectedTemplate,
  handleAnalyzeRepo,
  analyzingRepo,
  settings,
}: GeneratorModalProps) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full md:w-[600px] bg-slate-900 border border-white/10 md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh] md:max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'مولد المحتوى الذكي' : 'AI Content Generator'}</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {!settings?.githubUsername ? (
              <div className="m-auto text-center p-6">
                <p className="text-sm text-slate-400 font-medium mb-3">
                  {isAr ? 'يرجى ربط حساب GitHub أولاً من الإعدادات.' : 'Please connect your GitHub account in Settings first.'}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-xl border border-indigo-500/30 uppercase tracking-widest"
                >
                  {isAr ? 'الذهاب للإعدادات' : 'Go to Settings'}
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                    className={`w-full bg-slate-950 border border-white/5 rounded-xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                      isAr ? 'pr-3 pl-10' : 'pl-10 pr-3'
                    }`}
                  />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[400px] space-y-2 border border-white/5 rounded-2xl p-2 bg-slate-950/50">
                  {loadingRepos ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    repos
                      .filter((r: any) => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
                      .map((repo: any) => (
                        <button
                          key={repo.id}
                          onClick={() => setSelectedRepo(repo.name)}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer ${
                            selectedRepo === repo.name
                              ? 'border-indigo-500 bg-indigo-500/10 text-white'
                              : 'border-transparent hover:bg-slate-900/80 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                selectedRepo === repo.name
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                              }`}
                            >
                              <GitBranch className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs font-bold truncate tracking-tight">
                                {repo.name}
                              </h3>
                              <p className="text-[10px] opacity-60 truncate">
                                {repo.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>

                <div className="mt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    {t[lang].templateLabel}
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 text-slate-300 text-xs rounded-xl py-3 px-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="general">{t[lang].templateEngineering}</option>
                    <option value="technical">{t[lang].templateArchitectural}</option>
                    <option value="executive">{t[lang].templateSummary}</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-white/5 bg-slate-900/80">
            <button
              onClick={(e) => {
                handleAnalyzeRepo(e);
                if (settings?.githubUsername && selectedRepo && !analyzingRepo) {
                  onClose();
                }
              }}
              disabled={!selectedRepo || analyzingRepo || !settings?.githubUsername}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {analyzingRepo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t[lang].scanningDeep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t[lang].scanActionBtn}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

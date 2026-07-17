import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../constants';
import { FileText, Calendar, CheckSquare, Sparkles, Filter, MoreHorizontal, Settings } from 'lucide-react';
import { PostEditor } from './Drafts/PostEditor';
import { SocialShareCard } from './Drafts/SocialShareCard';
import { ExportButtons } from "./shared/ExportButtons";
import { LivePreviewPane } from "./Drafts/LivePreviewPane";
import { Eye, Edit3 } from "lucide-react";

type PostsHubProps = {
  lang: 'ar' | 'en' | 'de';
  posts: any[];
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
  handleUpdatePostText: (text: string) => void;
  handleUpdateCardConfig: (field: string, val: string) => void;
  settings: any;
  showToast: (msg: string) => void;
  handleApplyPresetTime: (preset: 'peak' | 'mid' | 'weekend') => void;
  scheduleDate: string;
  setScheduleDate: (d: string) => void;
  scheduleTime: string;
  setScheduleTime: (t: string) => void;
  handleSchedulePost: (dt: string) => void;
  handleCancelSchedule: () => void;
  handlePublishNow: () => void;
  handleDeletePost: () => void;
  handleSaveAsTemplate?: (post: any) => void;
  handleUseTemplate?: (template: any) => void;
};

export const PostsHub = ({
  lang,
  posts,
  activePostId,
  setActivePostId,
  handleUpdatePostText,
  handleUpdateCardConfig,
  settings,
  showToast,
  handleApplyPresetTime,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  handleSchedulePost,
  handleCancelSchedule,
  handlePublishNow,
  handleDeletePost,
  handleSaveAsTemplate,
  handleUseTemplate
}: PostsHubProps) => {
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [filter, setFilter] = useState<'draft' | 'scheduled' | 'published' | 'templates'>('draft');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const isAr = lang === 'ar';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save (just shows toast since autosave is active)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast(isAr ? 'تم حفظ التغييرات محلياً' : 'Changes saved locally');
      }
      
      // Ctrl+Enter or Cmd+Enter to publish
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activePostId && settings.linkedinToken) {
          handlePublishNow();
        } else if (!settings.linkedinToken) {
          showToast(isAr ? 'يجب ربط حساب لينكدإن أولاً' : 'Must connect LinkedIn first');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePostId, settings.linkedinToken, handlePublishNow, isAr, showToast]);

  
  
  const staticTemplates = useMemo(() => [
    {
      id: 'static-temp-1',
      status: 'template',
      repoName: isAr ? 'إطلاق مشروع جديد' : 'Project Launch Announcement',
      text: isAr 
        ? `يسعدني الإعلان عن إطلاق [اسم المشروع] 🚀!\n\nبعد أشهر من العمل الجاد، أصبح المشروع متاحاً للجميع. يهدف هذا المشروع إلى حل [المشكلة] من خلال [الحل].\n\nأود أن أشكر كل من ساهم في هذا الإنجاز. يمكنكم تجربته من هنا: [الرابط]\n\n#إطلاق_مشروع #تقنية #تطوير_برمجيات` 
        : `I am thrilled to announce the launch of [Project Name] 🚀!\n\nAfter months of hard work, coffee, and late-night coding, we are finally live. This project solves [Problem] by [Solution].\n\nI want to thank everyone who supported this journey. Check it out here: [Link]\n\n#Launch #Tech #Innovation #BuildInPublic`,
      cardConfig: { title: isAr ? 'إطلاق مشروع جديد' : 'New Project Launch', metrics: isAr ? 'الإصدار 1.0' : 'Version 1.0', subtitle: isAr ? 'متاح الآن' : 'Available Now', theme: 'purple' }
    },
    {
      id: 'static-temp-2',
      status: 'template',
      repoName: isAr ? 'مشاركة معرفة تقنية (مقال)' : 'Technical Deep Dive',
      text: isAr 
        ? `🛠️ كيف قمنا بتحسين أداء تطبيقنا بنسبة 50%؟\n\nفي مقالنا الهندسي الجديد، نستعرض بالتفصيل التغييرات المعمارية التي قمنا بها لتوسيع نطاق [اسم المشروع]. إليك أهم النقاط:\n\n1. [النقطة الأولى]\n2. [النقطة الثانية]\n3. [النقطة الثالثة]\n\nلقراءة التفاصيل التقنية كاملة، تفضل بزيارة الرابط: [الرابط]\n\n#هندسة_برمجيات #برمجة #تطوير`
        : `🛠️ How we reduced our latency by 50% using [Technology].\n\nIn our latest engineering blog post, we dive deep into the architecture changes we made to scale [Project Name]. Here are the key takeaways:\n\n1. [Key Point 1]\n2. [Key Point 2]\n3. [Key Point 3]\n\nRead the full post here: [Link]\n\n#Engineering #SoftwareDevelopment #Tech`,
      cardConfig: { title: isAr ? 'نظرة متعمقة' : 'Deep Dive', metrics: isAr ? 'أداء' : 'Performance', subtitle: isAr ? 'هندسة البرمجيات' : 'Software Engineering', theme: 'emerald' }
    },
    {
      id: 'static-temp-3',
      status: 'template',
      repoName: isAr ? 'مساهمة مفتوحة المصدر' : 'Open Source Release',
      text: isAr
        ? `🌟 متحمس جداً للإعلان أن [اسم المشروع] أصبح الآن مفتوح المصدر!\n\nنحن نؤمن بأهمية بناء المشاريع مع المجتمع. سواء كنت مطوراً متمرساً أو في بداية طريقك، نرحب بمساهماتك.\n\nتفضل بزيارة المستودع على جيتهاب وشاركنا في بناء شيء رائع: [الرابط]\n\n#مفتوح_المصدر #جيتهاب #مجتمع_المطورين`
        : `🌟 Excited to share that [Project Name] is now open source!\n\nWe believe in building together with the community. Whether you are a seasoned developer or just starting out, we welcome your contributions.\n\nCheck out the repo and let’s build something amazing together: [Link]\n\n#OpenSource #GitHub #DeveloperCommunity`,
      cardConfig: { title: isAr ? 'مفتوح المصدر' : 'Open Source', metrics: isAr ? 'مجتمع' : 'Community', subtitle: isAr ? 'شاركنا البناء' : 'Build with us', theme: 'blue' }
    },
    {
      id: 'static-temp-4',
      status: 'template',
      repoName: isAr ? 'الاحتفال بإنجاز (أرقام)' : 'Milestone Celebration',
      text: isAr
        ? `🎉 لقد وصلنا للتو إلى [رقم] مستخدم في [اسم المشروع]!\n\nأود أن أتوقف لحظة لشكر كل من دعمنا في هذه الرحلة. عندما بدأت في بناء هذا، لم أتخيل أبداً أننا سنصل إلى هذا الإنجاز بهذه السرعة.\n\nالخطوة القادمة: [الميزة القادمة]. ابقوا معنا!\n\n#إنجاز #شكراً #تطوير`
        : `🎉 We just hit [Number] users on [Project Name]!\n\nI want to take a moment to thank everyone who has supported this journey. When I started building this, I never imagined we would reach this milestone so quickly.\n\nNext up: [Next Feature]. Stay tuned!\n\n#Milestone #BuildInPublic #Tech`,
      cardConfig: { title: isAr ? 'إنجاز جديد' : 'Milestone Reached', metrics: '100K+', subtitle: isAr ? 'مستخدم نشط' : 'Active Users', theme: 'rose' }
    }
  ], [isAr]);


  const filteredPosts = useMemo(() => {
    if (filter === 'draft') return posts.filter((p) => !['scheduled', 'published', 'template'].includes(p.status));
    if (filter === 'template' || filter === 'templates') {
      const userTemplates = posts.filter((p) => p.status === 'template');
      return [...userTemplates, ...staticTemplates];
    }
    return posts.filter((p) => p.status === filter);
  }, [posts, filter, staticTemplates]);


  const currentPost = posts.find((p) => p.id === activePostId) || filteredPosts[0] || null;


  const getEmptyListMessage = () => {
    if (filter === 'draft') return isAr ? "لا توجد مسودات حالياً." : "No drafts available.";
    if (filter === 'scheduled') return isAr ? "لا توجد منشورات مجدولة." : "No scheduled posts.";
    if (filter === 'published') return isAr ? "لا توجد منشورات سابقة." : "No published posts.";
    if (filter === 'templates' || filter === 'template') return isAr ? "لا توجد قوالب محفوظة." : "No saved templates.";
    return t[lang].noPostsInTab;
  }

  const getEmptyRightPaneContent = () => {
    if (filter === 'draft') {
      return {
        title: isAr ? 'لا توجد مسودة محددة' : 'No Draft Selected',
        desc: isAr ? 'اختر مسودة من القائمة أو قم بتوليد واحدة جديدة من المستودعات.' : 'Select a draft from the list or generate a new one from your repositories.'
      }
    }
    if (filter === 'scheduled') {
      return {
        title: isAr ? 'لا يوجد منشور مجدول محدد' : 'No Scheduled Post Selected',
        desc: isAr ? 'اختر منشوراً مجدولاً لمعاينته أو تعديل موعده.' : 'Select a scheduled post to preview or reschedule it.'
      }
    }
    if (filter === 'published') {
      return {
        title: isAr ? 'لا يوجد منشور محدد' : 'No Published Post Selected',
        desc: isAr ? 'اختر منشوراً لعرض تفاصيله.' : 'Select a published post to view its details.'
      }
    }
    if (filter === 'templates' || filter === 'template') {
      return {
        title: isAr ? 'لا يوجد قالب محدد' : 'No Template Selected',
        desc: isAr ? 'اختر قالباً لمعاينته أو إنشاء مسودة جديدة منه.' : 'Select a template to preview or create a new draft from it.'
      }
    }
    
    return {
      title: t[lang].noActivePostTitle,
      desc: t[lang].noActivePostDesc
    }
  }

  const getLeftPaneTitle = () => {
    if (filter === 'draft') return t[lang].backQueueTitleDraft;
    if (filter === 'scheduled') return t[lang].backQueueTitleScheduled;
    if (filter === 'published') return t[lang].backQueueTitlePublished;
    if (filter === 'template' || filter === 'templates') return isAr ? 'مكتبة القوالب المحفوظة' : 'Saved Templates Library';
    return t[lang].backQueueTitleDraft;
  }

  // Tabs for the filtering
  const tabs = [
    { id: 'draft', label: isAr ? 'المسودات' : 'Drafts', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'scheduled', label: isAr ? 'مجدول' : 'Scheduled', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'published', label: isAr ? 'منشور' : 'Published', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 items-stretch h-full overflow-hidden">
      {/* LEFT PANE: List of Posts */}
      <div className="w-full md:w-80 flex flex-col gap-4 h-full shrink-0 border-r border-white/5 pr-0 md:pr-4">
        {/* Hub Header & Tabs */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              {getLeftPaneTitle()}
            </span>
            {filter === 'draft' && filteredPosts.length > 0 && <ExportButtons lang={lang} posts={filteredPosts} />}
          </div>

          <div className="flex p-1 bg-slate-900/60 rounded-xl border border-white/5 relative">
            {tabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilter(tab.id as any);
                    setActivePostId(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg relative z-10 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white/10 rounded-lg shadow-sm border border-white/5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5 pb-24 md:pb-0">
          <AnimatePresence mode="popLayout">
            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs p-6 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500 mt-4"
              >
                {getEmptyListMessage()}
              </motion.div>
            ) : (
              filteredPosts.map((post) => {
                const isActive = currentPost?.id === post.id;
                const dateObj = post.scheduledAt
                  ? new Date(post.scheduledAt)
                  : post.publishTime
                  ? new Date(post.publishTime)
                  : null;

                const colorClass =
                  post.status === 'scheduled'
                    ? 'amber'
                    : post.status === 'published'
                    ? 'emerald'
                    : post.status === 'failed'
                    ? 'rose'
                    : 'indigo';

                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={post.id}
                    onClick={() => setActivePostId(post.id)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-250 flex flex-col gap-2 cursor-pointer text-left transform active:scale-[0.99]
                      ${
                        isActive
                          ? `border-${colorClass}-500 bg-${colorClass}-500/10 shadow-lg shadow-${colorClass}-500/5`
                          : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70'
                      }
                    `}
                    dir="auto"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black text-slate-200 uppercase tracking-tight truncate max-w-[150px]">
                        {post.repoName}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-${colorClass}-500/20 text-${colorClass}-300 border border-${colorClass}-500/30`}
                      >
                        {post.status === 'failed'
                          ? t[lang].statusLabelFailed
                          : post.status === 'scheduled'
                          ? t[lang].statusLabelScheduled
                          : post.status === 'published'
                          ? t[lang].statusLabelLive
                          : t[lang].statusLabelDraft}
                      </span>
                    </div>
                    {dateObj && (
                      <span
                        className={`text-[9.5px] font-bold text-${colorClass}-300/80 bg-${colorClass}-500/5 px-2 py-0.5 rounded-md border border-${colorClass}-500/10 self-start`}
                      >
                        {post.status === 'published' ? '✓' : '⏱'} {dateObj.toLocaleString()}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {post.text}
                    </p>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANE: Split Editor & Config (only visible if there's a post, otherwise placeholder) */}
      <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col overflow-hidden min-h-[500px]">
        {currentPost ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Mode Switcher */}
            <div className="flex justify-center shrink-0">
              <div className="flex p-1 bg-slate-950/60 rounded-xl border border-white/5">
                <button
                  onClick={() => setEditorMode('edit')}
                  className={`flex items-center gap-1.5 py-1.5 px-4 text-[10.5px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                    editorMode === 'edit' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isAr ? 'التعديل' : 'Edit Mode'}
                </button>
                <button
                  onClick={() => setEditorMode('preview')}
                  className={`flex items-center gap-1.5 py-1.5 px-4 text-[10.5px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                    editorMode === 'preview' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isAr ? 'معاينة حية' : 'Live Preview'}
                </button>
              </div>
            </div>

            {editorMode === 'edit' ? (
              <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                {/* Active Editor Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  <PostEditor
                    lang={lang}
                    currentPost={currentPost}
                    handleUpdatePostText={handleUpdatePostText}
                    settings={settings}
                    showToast={showToast}
                  />
                </div>

                {/* Meta Controls & Schedule Widget Panel */}
                <div className="w-full lg:w-[300px] space-y-4 shrink-0 flex flex-col justify-between overflow-y-auto custom-scrollbar pr-1">
                  <div className="space-y-4">
                    {/* Visual Card customization preview */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2 text-left">
                        {t[lang].cardTitleLabel}
                      </span>
                      <SocialShareCard currentPost={currentPost} settings={settings} />
                    </div>

                {/* Interactive fields to customize graphic metadata */}
                <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2.5 text-left">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                      {t[lang].cardTitleInput}
                    </label>
                    <input
                      type="text"
                      value={currentPost.cardConfig?.title || ''}
                      onChange={(e) => handleUpdateCardConfig('title', e.target.value)}
                      className="w-full text-[10.5px] rounded-lg bg-slate-950 border border-white/5 py-1.5 px-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                      {t[lang].cardSubtitleInput}
                    </label>
                    <input
                      type="text"
                      value={currentPost.cardConfig?.subtitle || ''}
                      onChange={(e) => handleUpdateCardConfig('subtitle', e.target.value)}
                      className="w-full text-[10.5px] rounded-lg bg-slate-950 border border-white/5 py-1.5 px-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                        {t[lang].cardMetricsInput}
                      </label>
                      <input
                        type="text"
                        value={currentPost.cardConfig?.metrics || ''}
                        onChange={(e) => handleUpdateCardConfig('metrics', e.target.value)}
                        className="w-full text-[10.5px] rounded-lg bg-slate-950 border border-white/5 py-1.5 px-2.5 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-400 block mb-1">
                        {t[lang].cardThemeInput}
                      </label>
                      <select
                        value={currentPost.cardConfig?.colorTheme || 'indigo'}
                        onChange={(e) => handleUpdateCardConfig('colorTheme', e.target.value)}
                        className="w-full text-[10.5px] rounded-lg bg-slate-950 border border-white/5 py-1.5 px-2 text-white focus:outline-none"
                      >
                        <option value="indigo">Indigo</option>
                        <option value="emerald">Emerald</option>
                        <option value="amber">Amber</option>
                        <option value="rose">Rose</option>
                        <option value="teal">Teal</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interactive smart scheduling offsets */}
                {currentPost.status !== 'published' && (
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-white/5 text-left">
                    <span className="text-[10px] text-slate-350 font-black uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t[lang].optimalTimesTitle}</span>
                    </span>
                    <p className="text-[9.5px] text-slate-500 leading-normal mb-2">
                      {t[lang].optimalTimesDesc}
                    </p>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleApplyPresetTime('peak')}
                        className="w-full text-left p-2 rounded-lg bg-slate-950 border border-white/5 hover:border-amber-500/20 text-[10px] text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>{t[lang].presetPeakCorp}</span>
                        <span className="text-amber-400 font-mono text-[9px]">Tue 10:00 AM</span>
                      </button>
                      <button
                        onClick={() => handleApplyPresetTime('mid')}
                        className="w-full text-left p-2 rounded-lg bg-slate-950 border border-white/5 hover:border-amber-500/20 text-[10px] text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>{t[lang].presetMidWeek}</span>
                        <span className="text-amber-400 font-mono text-[9px]">Thu 01:00 PM</span>
                      </button>
                      <button
                        onClick={() => handleApplyPresetTime('weekend')}
                        className="w-full text-left p-2 rounded-lg bg-slate-950 border border-white/5 hover:border-amber-500/20 text-[10px] text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>{t[lang].presetWeekend}</span>
                        <span className="text-amber-400 font-mono text-[9px]">Sat 11:00 AM</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main publishing trigger actions footer */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                {currentPost.status === 'published' ? (
                  <button
                    onClick={handleCancelSchedule}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black transition-all cursor-pointer"
                  >
                    Revert to Idea Draft
                  </button>
                ) : currentPost.status === 'scheduled' ? (
                  <div className="space-y-2">
                    <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
                      <span className="text-[10px] text-amber-400 block font-bold">Scheduled Release Time</span>
                      <span className="text-[10.5px] text-white font-mono font-black mt-0.5 block">
                        {new Date(currentPost.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={handleCancelSchedule}
                      className="w-full py-3 rounded-2xl bg-indigo-650/10 hover:bg-indigo-650/20 border border-indigo-500/20 text-indigo-300 text-xs font-black transition-all cursor-pointer"
                    >
                      {t[lang].cancelScheduleBtn}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 block mb-1">
                          {t[lang].selectDateLabel}
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full text-[10.5px] bg-slate-950 border border-white/5 rounded-lg p-2 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 block mb-1">
                          {t[lang].selectTimeLabel}
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full text-[10.5px] bg-slate-950 border border-white/5 rounded-lg p-2 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (scheduleDate && scheduleTime) {
                          handleSchedulePost(`${scheduleDate}T${scheduleTime}`);
                        } else {
                          showToast(t[lang].toastScheduleRequired);
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-950 border border-white/5 hover:border-indigo-500/30 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>{t[lang].scheduleBtn}</span>
                    </button>

                    <button
                      onClick={() => setShowPublishConfirm(true)}
                      disabled={!settings.linkedinToken}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-black text-white shadow-xl shadow-indigo-600/15 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      title={!settings.linkedinToken ? t[lang].toastPublishNoProfile : ''}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>{t[lang].publishNowBtn}</span>
                    </button>
                  </div>
                )}

                {currentPost.status === 'template' ? (
                  <div className="flex flex-col gap-2 w-full mt-4">
                    <button
                      onClick={() => handleUseTemplate && handleUseTemplate(currentPost)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xs font-black text-white shadow-xl shadow-teal-500/15 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>{isAr ? 'إنشاء مسودة من القالب' : 'Use Template'}</span>
                    </button>
                    {!currentPost?.id?.startsWith('static-temp') && (
                      <button
                        onClick={handleDeletePost}
                        className="w-full py-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-300 text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Filter className="w-3.5 h-3.5 text-rose-455" />
                        <span>{t[lang].deleteBtn}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-4">
                    <button
                      onClick={() => handleSaveAsTemplate && handleSaveAsTemplate(currentPost)}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/10 text-indigo-300 text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حفظ كقالب' : 'Save Template'}</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-300 text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Filter className="w-3.5 h-3.5 text-rose-455" />
                      <span>{t[lang].deleteBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex justify-center">
                <div className="w-full max-w-lg mt-4">
                  <LivePreviewPane currentPost={currentPost} settings={settings} lang={lang} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto text-center max-w-sm p-8 bg-slate-900/40 rounded-3xl border border-white/5">
            <MoreHorizontal className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-sm font-black text-white mb-2">{getEmptyRightPaneContent().title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {getEmptyRightPaneContent().desc}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Publishing */}
      <AnimatePresence>
        {showPublishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-black text-white text-center mb-2">
                {isAr ? 'نشر المحتوى الآن؟' : 'Publish Content Now?'}
              </h3>
              <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
                {isAr 
                  ? 'سيتم نشر هذا المنشور فوراً على حساب لينكدإن الخاص بك. هل أنت متأكد من المتابعة؟' 
                  : 'This post will be published immediately to your connected LinkedIn profile. Are you sure you want to proceed?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowPublishConfirm(false);
                    handlePublishNow();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/25"
                >
                  {t[lang].publishNowBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

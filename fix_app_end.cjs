const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodEndCode = `  const handleApplyPresetTime = (presetType: 'peak' | 'mid' | 'weekend') => {
    const now = new Date();
    // Wednesday peak 10:00 AM as a beautiful optimal default
    now.setDate(now.getDate() + (presetType === 'peak' ? 1 : presetType === 'mid' ? 2 : 4));
    
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = "10:00";
    setScheduleDate(formattedDate);
    setScheduleTime(formattedTime);
    showToast(t[lang].toastPresetApplied);
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <Header 
        lang={lang} 
        handleToggleLang={handleToggleLang} 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row relative">
        <Sidebar 
          lang={lang}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (!['draft', 'scheduled', 'published'].includes(tab)) {
              setActivePostId(null);
            }
          }}
          posts={posts}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8 flex flex-col">
          {activeTab === 'settings' && (
            <div className="fade-in-element flex-1">
              <SettingsPanel 
                lang={lang}
                user={user}
                settings={settings}
                inputs={inputs}
                setInputs={setInputs}
                handleSaveSettings={handleSaveSettings}
                handleDisconnect={handleDisconnect}
                loading={loadingSettings}
              />
            </div>
          )}
          {activeTab === 'templates' && (
            <div className="fade-in-element flex-1">
              <TemplatesPanel 
                lang={lang}
                posts={posts}
                handleUseTemplate={handleUseTemplate}
              />
            </div>
          )}
          {activeTab === 'home' && (
            <div className="fade-in-element flex-1 flex flex-col w-full h-full">
              <RepositoriesDashboard 
                lang={lang}
                repos={repos}
                loadingRepos={loadingRepos}
                orgFilter={orgFilter}
                setOrgFilter={setOrgFilter}
                orgs={orgs}
                repoSearch={repoSearch}
                setRepoSearch={setRepoSearch}
                selectedRepo={selectedRepo}
                setSelectedRepo={setSelectedRepo}
                analyzingRepo={analyzingRepo}
                handleAnalyzeRepo={handleAnalyzeRepo}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                refreshRepos={refreshRepos}
                githubProfile={settings.githubProfile}
              />
            </div>
          )}
          {activeTab === 'posts' && (
            <div className="fade-in-element flex-1 h-full w-full">
              <PostsHub 
                lang={lang}
                posts={posts}
                loadingPosts={loadingPosts}
                activePostId={activePostId}
                setActivePostId={setActivePostId}
                handleUpdatePostText={handleUpdatePostText}
                handleUpdateCardConfig={handleUpdateCardConfig}
                handlePublishNow={handlePublishNow}
                handleSchedulePost={handleSchedulePost}
                handleCancelSchedule={handleCancelSchedule}
                handleDeletePost={handleDeletePost}
                handleSaveAsTemplate={handleSaveAsTemplate}
                showToast={showToast}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                scheduleTime={scheduleTime}
                setScheduleTime={setScheduleTime}
                handleApplyPresetTime={handleApplyPresetTime}
                suggestedTags={suggestedTags}
                isGeneratingTags={isGeneratingTags}
                handleGenerateHashtags={handleGenerateHashtags}
                handleAppendHashtags={handleAppendHashtags}
                handleAppendToAllDrafts={handleAppendToAllDrafts}
              />
            </div>
          )}
        </main>
      </div>
      <MobileNav 
        lang={lang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        posts={posts}
      />
      <GeneratorModal
        lang={lang}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        handleAnalyzeRepo={handleAnalyzeRepo}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 border border-indigo-500/30 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-350 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm font-medium text-white">{toast.message}</span>
        </div>
      )}
      <LegalModal 
        lang={lang}
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        activeTab={legalModalTab}
        setActiveTab={setLegalModalTab}
      />
      <footer className="h-10 bg-slate-950 border-t border-white/5 text-[9px] px-4 md:px-6 flex items-center justify-between text-slate-500 shrink-0 z-10 select-none">
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('privacy'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy'}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('terms'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms'}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('developer'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'المطور' : 'Developer'}</button>
        </div>
        <div>LinkedIn Authority Engine • v2.1</div>
      </footer>
    </div>
  );
};

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('const handleApplyPresetTime ='));

if (startIndex !== -1) {
  lines.splice(startIndex, lines.length - startIndex, goodEndCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find start index", startIndex);
}

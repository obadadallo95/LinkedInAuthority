const fs = require('fs');

let code = fs.readFileSync('src/components/RepositoriesDashboard.tsx', 'utf8');

const oldHeaderStr = `<div className="repositories-dashboard-header p-3 md:p-4 border-b border-white/5 bg-slate-900/50 flex flex-wrap flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 w-full min-w-[200px]">
                  <Search className={\`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors \${repoSearch ? 'text-indigo-400' : 'text-slate-500'}\`} />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                    className={\`w-full bg-slate-950 border rounded-lg py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors \${
                      repoSearch ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 focus:border-indigo-500'
                    } \${isAr ? 'pr-3 pl-9' : 'pl-9 pr-3'}\`}
                  />
                  {repoSearch && (
                    <button onClick={() => setRepoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                       <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative shrink-0 flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={\`w-full sm:w-auto bg-slate-950 border rounded-lg py-2.5 pl-3 pr-8 text-xs md:text-sm transition-colors appearance-none \${
                        sortBy !== 'date' ? 'border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 text-white focus:border-indigo-500'
                      }\`}
                    >
                      <option value="date">{isAr ? 'الأحدث' : 'Sort: Latest'}</option>
                      <option value="stars">{isAr ? 'النجوم' : 'Sort: Stars'}</option>
                      <option value="name">{isAr ? 'الاسم' : 'Sort: Name'}</option>
                    </select>
                    <ChevronDown className={\`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none \${sortBy !== 'date' ? 'text-indigo-400' : 'text-slate-500'}\`} />
                  </div>
                  <button onClick={toggleAll} className="h-[38px] md:h-[42px] px-4 bg-slate-950 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 justify-center shrink-0" title="Select All in Filter">
                    {checkedRepos.size > 0 && checkedRepos.size === sortedRepos.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium hidden sm:inline">{isAr ? 'تحديد الكل في الفلتر' : 'Select All in Filter'}</span>
                  </button>
                </div>
              </div>
              <div className="flex bg-slate-950 border border-white/5 rounded-lg p-0.5 w-full overflow-x-auto custom-scrollbar shrink-0">
                {['All', 'TypeScript', 'Python', 'Go', 'Other'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLangFilter(l)}
                    className={\`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-1 \${langFilter === l ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}\`}
                  >
                    {l === 'All' ? (isAr ? 'الكل' : 'All') : l === 'Other' ? (isAr ? 'أخرى' : 'Other') : l}
                  </button>
                ))}
              </div>
            </div>`;

const newHeaderStr = `<div className="repositories-dashboard-header p-3 md:p-4 border-b border-white/5 bg-slate-900/50 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search className={\`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors \${repoSearch ? 'text-indigo-400' : 'text-slate-500'}\`} />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                      className={\`w-full bg-slate-950 border rounded-lg py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors \${
                        repoSearch ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 focus:border-indigo-500'
                      } \${isAr ? 'pr-3 pl-9' : 'pl-9 pr-3'}\`}
                    />
                    {repoSearch && (
                      <button onClick={() => setRepoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                         <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full overflow-x-auto custom-scrollbar pb-1">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative shrink-0">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className={\`bg-slate-950 border rounded-lg py-2 px-3 pr-8 text-xs md:text-sm transition-colors appearance-none \${
                            sortBy !== 'date' ? 'border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 text-white focus:border-indigo-500'
                          }\`}
                        >
                          <option value="date">{isAr ? 'الأحدث' : 'Sort: Latest'}</option>
                          <option value="stars">{isAr ? 'النجوم' : 'Sort: Stars'}</option>
                          <option value="name">{isAr ? 'الاسم' : 'Sort: Name'}</option>
                        </select>
                        <ChevronDown className={\`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none \${sortBy !== 'date' ? 'text-indigo-400' : 'text-slate-500'}\`} />
                      </div>
                      <button onClick={toggleAll} className="h-[34px] md:h-[38px] px-3 bg-slate-950 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 justify-center shrink-0" title="Select All in Filter">
                        {checkedRepos.size > 0 && checkedRepos.size === sortedRepos.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">{isAr ? 'تحديد الكل في الفلتر' : 'Select All in Filter'}</span>
                      </button>
                    </div>

                    <div className="w-px h-6 bg-white/10 shrink-0 mx-1"></div>

                    <div className="flex bg-slate-950 border border-white/5 rounded-lg p-0.5 shrink-0">
                      {['All', 'TypeScript', 'Python', 'Go', 'Other'].map(l => (
                        <button
                          key={l}
                          onClick={() => setLangFilter(l)}
                          className={\`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap \${langFilter === l ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}\`}
                        >
                          {l === 'All' ? (isAr ? 'الكل' : 'All') : l === 'Other' ? (isAr ? 'أخرى' : 'Other') : l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>`;

code = code.replace(oldHeaderStr, newHeaderStr);
fs.writeFileSync('src/components/RepositoriesDashboard.tsx', code);

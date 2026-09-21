import React, { useEffect, useState } from 'react';

/**
 * Activity preview deliberately does not call GitHub from every repository card.
 * Activity and meaningful-change evidence are fetched by the bounded analysis
 * flow, where they can be authenticated, rate-limited, and grounded in a draft.
 */
export const RepoSparkline = ({ lang = 'en', className = 'h-6 w-16' }: { lang?: 'ar' | 'en' | 'de'; className?: string }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 120);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className={`${className} bg-slate-800/50 animate-pulse rounded-md`} aria-label="Loading activity preview" />;
  }

  return (
    <div className={`${className} flex items-center justify-center text-[9px] font-medium text-slate-500 text-center`} title="Activity is checked during repository analysis">
      {lang === 'ar' ? 'يُفحص النشاط عند التحليل' : lang === 'de' ? 'Aktivität wird bei der Analyse geprüft' : 'Activity checked on analyze'}
    </div>
  );
};

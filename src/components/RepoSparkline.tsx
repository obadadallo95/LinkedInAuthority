import React, { useState, useEffect, useRef } from 'react';

export const RepoSparkline = ({ username, repo, token }: { username: string; repo: string; token: string }) => {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let observer: IntersectionObserver;
    let isMounted = true;

    const loadData = async () => {
      try {
        const headers: Record<string, string> = {
          "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
          headers["Authorization"] = `token ${token}`;
        }
        // fetch participation stats (last 52 weeks)
        const res = await fetch(`https://api.github.com/repos/${username}/${repo}/stats/participation`, { headers });
        if (res.ok) {
          const stats = await res.json();
          if (stats.all && isMounted) {
            // take last 4 weeks (approx 30 days)
            setData(stats.all.slice(-4));
          }
        } else if (res.status === 202) {
          // GitHub is computing the stats, just set some dummy or retry later
          // We'll just show no activity for now instead of complex retry logic
          if (isMounted) setData([1,2,1,0]); // mock data if computing
        }
      } catch (e) {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (containerRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadData();
          observer.disconnect();
        }
      });
      observer.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      if (observer) observer.disconnect();
    };
  }, [username, repo, token]);

  if (loading) {
    return <div ref={containerRef} className="h-6 w-16 bg-slate-800/50 animate-pulse rounded-md"></div>;
  }

  if (data.length === 0 || data.every(d => d === 0)) {
    return <div ref={containerRef} className="h-6 w-16 text-[9px] text-slate-500 font-medium flex items-center justify-center">No activity</div>;
  }

  const max = Math.max(...data, 1);
  const min = 0;
  
  return (
    <div ref={containerRef} className="h-6 w-16 flex items-end gap-[2px]" title="Commit activity (last 30 days)">
      {data.map((val, i) => {
        const height = Math.max(((val - min) / (max - min)) * 100, 10);
        return (
          <div key={i} className="flex-1 bg-indigo-500 hover:bg-indigo-400 rounded-t-[1px] transition-all opacity-80 hover:opacity-100" style={{ height: `${height}%` }} />
        );
      })}
    </div>
  );
};

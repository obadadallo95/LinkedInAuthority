export const getAnalyticsData = (posts: any[], lang: 'ar' | 'en' | 'de') => {
  const data = [];
  const now = new Date();
  
  // Generate exactly last 30 days of telemetry data points
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en', {
      day: 'numeric',
      month: 'short',
    });
    const dateISO = d.toISOString().split('T')[0];
    
    const scheduledCount = posts.filter(p => {
      if (p.status !== 'scheduled' || !p.scheduledAt) return false;
      return p.scheduledAt.startsWith(dateISO);
    }).length;

    const publishedCount = posts.filter(p => {
      if (p.status !== 'published' || !p.publishTime) return false;
      return p.publishTime.startsWith(dateISO);
    }).length;

    // Dynamic reach scaled specifically on the user's actual published posts count
    const baseReach = publishedCount > 0 
      ? (publishedCount * (1200 + i * 10)) + 350
      : 0;

    data.push({
      date: dateStr,
      scheduled: scheduledCount,
      published: publishedCount,
      reach: baseReach,
    });
  }
  return data;
};

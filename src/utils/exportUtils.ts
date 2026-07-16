export const handleExportDrafts = (posts: any[], format: 'json' | 'csv') => {
  const drafts = posts.filter(p => p.status === 'draft' || p.status === 'failed');
  if (drafts.length === 0) return;
  
  if (format === 'json') {
    const dataStr = JSON.stringify(drafts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'drafts.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } else {
    const headers = ['repoName', 'title', 'text', 'status', 'id'];
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of drafts) {
      const values = headers.map(header => {
        let val = (row as any)[header];
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
        }
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    const dataStr = "\uFEFF" + csvRows.join('\n'); // BOM for excel
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'drafts.csv';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
};

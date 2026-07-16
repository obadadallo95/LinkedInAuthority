import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { handleExportDrafts } from '../../utils/exportUtils';
import { t } from '../../constants';

export const ExportButtons = ({ lang, posts }: any) => {
  return (
    <div className="flex gap-2 justify-end w-full max-w-[200px]">
      <button onClick={() => handleExportDrafts(posts, 'json')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider">
        <Download className="w-3 h-3" /> JSON
      </button>
      <button onClick={() => handleExportDrafts(posts, 'csv')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 rounded-lg text-[10px] uppercase font-bold tracking-wider border border-indigo-500/30">
        <Download className="w-3 h-3" /> CSV
      </button>
    </div>
  );
};

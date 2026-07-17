import React, { useState, useRef, useCallback } from 'react';
import { ThumbsUp, MessageSquare, Share2, Send, MoreHorizontal, Globe, Copy, Check, Type, Image as ImageIcon } from 'lucide-react';
import { SocialShareCard } from './SocialShareCard';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';

export const LivePreviewPane = ({ currentPost, settings, lang }: any) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleCopyText = () => {
    if (currentPost?.text) {
      navigator.clipboard.writeText(currentPost.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportImage = useCallback(() => {
    if (previewRef.current === null) return;
    setExporting(true);
    
    // We give a small delay to ensure rendering is complete before screenshot
    setTimeout(() => {
      toPng(previewRef.current as HTMLDivElement, { cacheBust: true, pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `post-${currentPost?.id || 'export'}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Error generating image', err);
        })
        .finally(() => {
          setExporting(false);
        });
    }, 100);
  }, [previewRef, currentPost?.id]);

  // Format text to handle newlines
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <motion.div 
      className="flex flex-col gap-3 relative" 
      id="posts-hub-preview-pane"
      whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: -1, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2)" }}
      style={{ perspective: 1200 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Tools Toolbar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-white/5 gap-2">
        <div className="flex items-center gap-2">
           <button
             onClick={() => setFontFamily(prev => prev === 'sans' ? 'serif' : 'sans')}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-white/5 transition-colors"
           >
             <Type className="w-3.5 h-3.5" />
             <span>{fontFamily === 'sans' ? 'Modern Sans' : 'Professional Serif'}</span>
           </button>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={handleCopyText}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-white/5 transition-colors"
           >
             {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
             <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
           </button>
           <button
             onClick={handleExportImage}
             disabled={exporting}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
           >
             <ImageIcon className="w-3.5 h-3.5" />
             <span>{exporting ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'حفظ كصورة' : 'Share Image')}</span>
           </button>
        </div>
      </div>

      <div className="w-full relative rounded-xl bg-[#f3f2ef] p-4">
        <div 
          ref={previewRef}
          className="w-full bg-white rounded-xl overflow-hidden shadow-sm flex flex-col text-[#000000E6] border border-slate-200"
          style={{ fontFamily: fontFamily === 'sans' ? '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif' : 'serif' }}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-3 flex gap-2 items-start bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 overflow-hidden cursor-pointer">
              {settings?.picture ? (
                <img src={settings.picture} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <h4 className="text-[14px] font-semibold truncate hover:text-[#0a66c2] hover:underline cursor-pointer leading-tight">
                      {settings?.name || "LinkedIn Member"}
                    </h4>
                    <span className="text-[#00000099] text-[14px]">• 1st</span>
                  </div>
                  <p className="text-[12px] text-[#00000099] truncate leading-tight mt-0.5">{settings?.tagline || "Software Engineer"}</p>
                  <div className="flex items-center gap-1 text-[12px] text-[#00000099] mt-0.5 leading-tight">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-[#0a66c2] hover:bg-[#0a66c2]/10 px-2 py-1 rounded-md transition-colors font-semibold text-[14px]">
                    <span className="text-xl leading-none -mt-1">+</span>
                    <span>{isAr ? 'متابعة' : 'Follow'}</span>
                  </button>
                  <button className="text-[#00000099] hover:bg-slate-100 p-1 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Text Body */}
          <div className="px-4 pb-2 text-[14px] leading-[1.5] break-words whitespace-pre-wrap bg-white text-[#000000E6]">
            {currentPost?.text ? renderText(currentPost.text) : "Your post content will appear here..."}
          </div>

          {/* Media / Card Attachment */}
          <div className="w-full border-t border-b border-[#e0e0df] bg-[#f3f2ef] relative pointer-events-none select-none overflow-hidden">
            <SocialShareCard currentPost={currentPost} settings={settings} />
          </div>

          {/* Engagement Counts (Mock) */}
          <div className="px-4 py-2 border-b border-[#e0e0df] bg-white flex justify-between items-center text-[#00000099] text-[12px]">
            <div className="flex items-center gap-1">
              <span className="bg-[#0a66c2] rounded-full p-[2px]"><ThumbsUp className="w-2 h-2 text-white fill-current" /></span>
              <span>124</span>
            </div>
            <div className="flex gap-2 hover:underline cursor-pointer">
              <span>12 comments</span>
              <span>•</span>
              <span>5 reposts</span>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="px-2 py-1 flex items-center justify-between text-[#00000099] bg-white">
            <button className="flex-1 flex justify-center items-center gap-1.5 py-3 hover:bg-[#00000014] rounded-md transition-colors font-semibold text-[14px]">
              <ThumbsUp className="w-5 h-5" />
              <span>{isAr ? 'أعجبني' : 'Like'}</span>
            </button>
            <button className="flex-1 flex justify-center items-center gap-1.5 py-3 hover:bg-[#00000014] rounded-md transition-colors font-semibold text-[14px]">
              <MessageSquare className="w-5 h-5" />
              <span>{isAr ? 'تعليق' : 'Comment'}</span>
            </button>
            <button className="flex-1 flex justify-center items-center gap-1.5 py-3 hover:bg-[#00000014] rounded-md transition-colors font-semibold text-[14px]">
              <Share2 className="w-5 h-5" />
              <span>{isAr ? 'إعادة نشر' : 'Repost'}</span>
            </button>
            <button className="flex-1 flex justify-center items-center gap-1.5 py-3 hover:bg-[#00000014] rounded-md transition-colors font-semibold text-[14px]">
              <Send className="w-5 h-5 transform -rotate-45 mb-1" />
              <span>{isAr ? 'إرسال' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

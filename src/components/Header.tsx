import React from "react";
import { useAuth } from "../application/AuthContext";
import { Globe, ShieldAlert, LogOut, Power, Server, Shield } from "lucide-react";
import { SystemGateway } from "../types";

interface HeaderProps {
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  globalStatus: "active" | "paused";
  onToggleGlobalStatus: () => void;
  gateways: SystemGateway[];
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  globalStatus,
  onToggleGlobalStatus,
  gateways
}) => {
  const { user, signOut } = useAuth();
  const isAr = lang === "ar";

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-40">
      
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-white tracking-tight">
              {isAr ? "برج مراقبة الوكلاء" : "Agent Control Tower"}
            </h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[9px] uppercase px-1.5 py-0.5 rounded-full font-black tracking-widest font-mono">
              MVP
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {isAr ? "حوكمة العمليات الذكية اللامركزية" : "Autonomous AI Agent Governance Ledger"}
          </p>
        </div>
      </div>

      {/* Center status bar: Real-time Gateway Health status */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl px-4 py-2 text-xs">
        <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
          {isAr ? "البوابات النشطة:" : "ACTIVE GATEWAYS:"}
        </span>
        <div className="flex items-center gap-2.5">
          {gateways.map(gw => (
            <div key={gw.id} className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
              <span className={`w-1.5 h-1.5 rounded-full ${gw.connected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
              <span className="text-[10.5px] font-bold text-slate-300 font-mono">
                {isAr ? gw.nameAr.split(" ")[0] : gw.nameEn.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls & Human Signature */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Master Workforce Toggle Switch */}
        <button
          onClick={onToggleGlobalStatus}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
            ${globalStatus === "active"
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
            }
          `}
          title={isAr ? "تبديل حالة تشغيل القوى العاملة بالكامل" : "Toggle global workforce active status"}
        >
          <Power className="w-3.5 h-3.5" />
          <span>
            {isAr 
              ? (globalStatus === "active" ? "الوكلاء: قيد التشغيل" : "الوكلاء: موقوف مؤقتاً")
              : (globalStatus === "active" ? "WORKFORCE: ACTIVE" : "WORKFORCE: PAUSED")
            }
          </span>
        </button>

        {/* Language Toggler */}
        <button
          onClick={() => setLang(isAr ? "en" : "ar")}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{isAr ? "English" : "العربية"}</span>
        </button>

        {/* User Identity Signoff */}
        {user && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-indigo-400 text-xs uppercase">
              {user.email ? user.email.slice(0, 2) : "OP"}
            </div>
            <div className="hidden sm:block text-left text-[10px] leading-tight">
              <span className="text-slate-500 block uppercase font-bold tracking-widest">
                {isAr ? "المشرف البشري" : "HUMAN SIGNATURE"}
              </span>
              <span className="text-slate-300 font-bold font-mono">
                {user.email || "obada.dallo95@gmail.com"}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
              title={isAr ? "تسجيل الخروج" : "Sign Out"}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

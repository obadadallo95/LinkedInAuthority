import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, Scale, User, Globe, GitBranch, Share2, ExternalLink, Copyright, Lock, ShieldCheck, Heart 
} from 'lucide-react';
import { TermsOfService } from '../TermsOfService';
import { PrivacyPage } from '../PrivacyPage';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en' | 'de';
  initialTab?: 'privacy' | 'terms' | 'developer' | 'faq';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, lang, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'developer' | 'faq'>(initialTab);
  const isAr = lang === 'ar';

  // Local translations for the Legal and Developer Hub
  const content = {
    ar: {
      title: "مركز الخصوصية والاتفاقات القانونية",
      close: "إغلاق",
      tabPrivacy: "سياسة الخصوصية",
      tabTerms: "شروط الخدمة",
      tabDeveloper: "بطاقة التعريف",
      tabFaq: "الأسئلة الشائعة",
      faq1Q: "هل تقومون بتخزين الكود الخاص بي؟",
      faq1A: "لا، نحن لا نقوم بتخزين أي شفرة مصدرية. نقوم فقط بقراءة الملفات للتحليل اللحظي وتوليد المحتوى.",
      faq2Q: "هل يمكنني حذف بياناتي؟",
      faq2A: "نعم، يمكنك حذف حسابك وكافة بياناتك نهائياً من خلال زر 'حذف الحساب' في صفحة الإعدادات، استجابة لقوانين حماية البيانات (GDPR).",
      faq3Q: "هل هناك اشتراك مدفوع؟",
      faq3A: "حاليا المنصة مجانية كجزء من النسخة التجريبية.",
      developedBy: "تطوير وبرمجة بواسطة:",
      devTitle: "Obada Dallo",
      devSubtitle: "Full-Stack Developer & AI Architect",
      portfolio: "البورتفوليو الشخصي",
      github: "الملف البرمجي GitHub",
      linkedin: "الشبكة المهنية LinkedIn",
      rightsReserved: "جميع الحقوق محفوظة لـ Obada Dallo © 2026",
      intellectualPropertyTitle: "حقوق الملكية الفكرية",
      intellectualPropertyText: "إن البنية المعمارية، وتصاميم واجهة المستخدم، والخوارزميات المستخدمة في LinkedIn Authority هي حقوق ملكية فكرية حصرية لـ Obada Dallo. لا يُسمح بالهندسة العكسية، أو الاستنساخ، أو إعادة التوزيع التجاري لأي جزء من الشفرة المصدرية دون إذن كتابي مسبق.",
      privacyTitle: "سياسة الخصوصية وأمن البيانات",
      privacyText1: "نحن نضع خصوصية وأمن بياناتك في مقدمة أولوياتنا. يتم التعامل مع رموز الوصول (Access Tokens) لحسابات GitHub و LinkedIn الخاصة بك بأعلى درجات التشفير وتخزن محلياً وبشكل آمن، ولا يتم مشاركتها أو نقلها إطلاقاً إلى أطراف ثالثة.",
      privacyText2: "نلتزم التزاماً كاملاً بعدم تخزين أو جمع أي نصوص أو شفرات مصدرية من مستودعاتك. تنحصر معالجة البيانات في التحليل اللحظي والآمن بغرض توليد محتوى مهني، ولا يتم الاحتفاظ بأي نسخ على خوادمنا.",
      termsTitle: "شروط الخدمة والاستخدام المهني",
      termsText1: "باستخدامك لمنصة LinkedIn Authority، فإنك توافق على الالتزام بالمعايير المهنية لشبكة LinkedIn. يُحظر بشدة استخدام المنصة لنشر محتوى مضلل أو رسائل غير مرغوب فيها (Spam) أو أي مواد تنتهك حقوق الملكية للآخرين.",
      termsText2: "تهدف أدوات الذكاء الاصطناعي المدمجة إلى تسهيل عملية إنشاء المحتوى، إلا أن المسؤولية النهائية المتعلقة بدقة المنشورات، وملاءمتها المهنية، وقانونيتها تظل كاملةً على عاتق المستخدم.",
      visitPortfolio: "زيارة الموقع الشخصي"
    },
    en: {
      title: "Privacy & Legal Center",
      close: "Close",
      tabPrivacy: "Privacy Policy",
      tabTerms: "Terms of Service",
      tabDeveloper: "Identity Card",
      tabFaq: "FAQ",
      faq1Q: "Do you store my code?",
      faq1A: "No, we do not store any source code. We only read files for real-time analysis and content generation.",
      faq2Q: "Can I delete my data?",
      faq2A: "Yes, you can permanently delete your account and all data via the 'Delete Account' button in Settings, fully compliant with GDPR.",
      faq3Q: "Is there a paid subscription?",
      faq3A: "The platform is currently free as part of our beta release.",
      developedBy: "Developed & Crafted by:",
      devTitle: "Obada Dallo",
      devSubtitle: "Full-Stack Developer & AI Architect",
      portfolio: "Personal Portfolio",
      github: "GitHub Profile",
      linkedin: "LinkedIn Profile",
      rightsReserved: "All Copyrights reserved for Obada Dallo © 2026",
      intellectualPropertyTitle: "Intellectual Property Rights",
      intellectualPropertyText: "The architectural framework, UI/UX designs, and core algorithmic implementations of LinkedIn Authority are the exclusive intellectual property of Obada Dallo. Reverse engineering, redistribution, or unauthorized commercial use of the codebase is strictly prohibited without explicit written consent.",
      privacyTitle: "Privacy & Data Security",
      privacyText1: "Your privacy and data security are our top priorities. Your GitHub and LinkedIn Access Tokens are handled with enterprise-grade encryption, stored locally and securely, and are never shared or transmitted to any third parties.",
      privacyText2: "We are strictly committed to never storing or collecting any source code or textual data from your repositories. Data processing is exclusively limited to real-time analysis for professional content generation, and no residual copies are retained on our servers.",
      termsTitle: "Terms of Service & Professional Use",
      termsText1: "By utilizing the LinkedIn Authority platform, you agree to adhere strictly to LinkedIn's professional networking standards. The use of this platform for disseminating misleading content, spam, or copyright-infringing materials is strictly prohibited.",
      termsText2: "While our integrated AI tools are designed to streamline content creation, the ultimate responsibility for the accuracy, professional appropriateness, and legality of the published posts remains entirely with the user.",
      visitPortfolio: "Visit Portfolio"
    },
    de: {
      title: "Datenschutz & Rechtliches Zentrum",
      close: "Schließen",
      tabPrivacy: "Datenschutzrichtlinie",
      tabTerms: "Nutzungsbedingungen",
      tabDeveloper: "Identitätskarte",
      tabFaq: "FAQ",
      faq1Q: "Speichern Sie meinen Code?",
      faq1A: "Nein, wir speichern keinen Quellcode. Wir lesen Dateien nur zur Echtzeitanalyse und Inhaltserstellung.",
      faq2Q: "Kann ich meine Daten löschen?",
      faq2A: "Ja, Sie können Ihr Konto und alle Daten über die Schaltfläche 'Konto löschen' in den Einstellungen dauerhaft löschen (DSGVO-konform).",
      faq3Q: "Gibt es ein kostenpflichtiges Abonnement?",
      faq3A: "Die Plattform ist derzeit als Teil unserer Beta-Version kostenlos.",
      developedBy: "Entwickelt & Gestaltet von:",
      devTitle: "Obada Dallo",
      devSubtitle: "Full-Stack Entwickler & KI-Architekt",
      portfolio: "Persönliches Portfolio",
      github: "GitHub Profil",
      linkedin: "LinkedIn Profil",
      rightsReserved: "Alle Urheberrechte vorbehalten für Obada Dallo © 2026",
      intellectualPropertyTitle: "Geistige Eigentumsrechte",
      intellectualPropertyText: "Das architektonische Framework, die UI/UX-Designs und die algorithmischen Kernimplementierungen von LinkedIn Authority sind das ausschließliche geistige Eigentum von Obada Dallo. Reverse Engineering, Weiterverbreitung oder unbefugte kommerzielle Nutzung der Codebasis ist ohne ausdrückliche schriftliche Zustimmung strengstens untersagt.",
      privacyTitle: "Datenschutz & Datensicherheit",
      privacyText1: "Ihre Privatsphäre und Datensicherheit stehen bei uns an erster Stelle. Ihre GitHub- und LinkedIn-Zugriffstoken werden mit Verschlüsselung auf Unternehmensniveau verarbeitet, lokal und sicher gespeichert und niemals an Dritte weitergegeben oder übertragen.",
      privacyText2: "Wir verpflichten uns strikt, niemals Quellcode oder Textdaten aus Ihren Repositories zu speichern oder zu sammeln. Die Datenverarbeitung beschränkt sich ausschließlich auf die Echtzeitanalyse zur Generierung professioneller Inhalte, und es werden keine Restkopien auf unseren Servern aufbewahrt.",
      termsTitle: "Nutzungsbedingungen & Professionelle Nutzung",
      termsText1: "Durch die Nutzung der LinkedIn Authority-Plattform stimmen Sie zu, sich strikt an die professionellen Netzwerkstandards von LinkedIn zu halten. Die Nutzung dieser Plattform zur Verbreitung irreführender Inhalte, Spam oder urheberrechtsverletzender Materialien ist strengstens untersagt.",
      termsText2: "Während unsere integrierten KI-Tools darauf ausgelegt sind, die Inhaltserstellung zu optimieren, liegt die letztendliche Verantwortung für die Genauigkeit, die professionelle Angemessenheit und die Legalität der veröffentlichten Beiträge vollständig beim Benutzer.",
      visitPortfolio: "Portfolio Besuchen"
    }
  };

  const t = content[lang] || content.en;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/15 rounded-3xl overflow-hidden shadow-2xl relative z-10 text-slate-100 flex flex-col h-[580px] max-h-[90vh]`}
          >
            {/* Header section with Close button */}
            <div className={`p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50 ${isAr ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <ShieldCheck className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className={isAr ? 'text-right' : 'text-left'}>
                  <h3 className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight">
                    {t.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'البوابة القانونية والتعريفية الرسمية' : 'Official Legal & Verification Portal'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Interactive Tabs */}
            <div className={`px-6 py-3 bg-slate-900/40 border-b border-white/5 flex gap-2 overflow-x-auto ${isAr ? 'flex-row-reverse' : ''}`}>
              <button 
                onClick={() => setActiveTab('privacy')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap
                  ${activeTab === 'privacy' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.03]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }
                  ${isAr ? 'flex-row-reverse' : ''}
                `}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t.tabPrivacy}</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('terms')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap
                  ${activeTab === 'terms' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.03]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }
                  ${isAr ? 'flex-row-reverse' : ''}
                `}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{t.tabTerms}</span>
              </button>

              <button
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'faq' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:bg-white/5'}`}
            >
              {isAr ? t.tabFaq : t.tabFaq}
            </button>
            <button
              onClick={() => setActiveTab('developer')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap
                  ${activeTab === 'developer' 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 scale-[1.03] border border-purple-500/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }
                  ${isAr ? 'flex-row-reverse' : ''}
                `}
              >
                <User className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1">
                  <span>{t.tabDeveloper}</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-1 py-0.2 rounded font-extrabold animate-pulse">DEV</span>
                </span>
              </button>
            </div>

            {/* Scrollable Content Body with nice fade transition */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-sm leading-relaxed text-slate-300">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  
                  {/* TAB 1: PRIVACY POLICY */}
                  {activeTab === 'privacy' && (
                    <PrivacyPage lang={lang} />
                  )}

                  {/* TAB 2: TERMS OF SERVICE & INTELLECTUAL PROPERTY */}
                  {activeTab === 'terms' && (
                    <TermsOfService lang={lang} />
                  )}

                  {/* TAB 3: MASTER DEVELOPER IDENTITY CARD */}
                  {activeTab === 'faq' && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-5">
                    <div>
                      <h4 className="text-white font-bold mb-1">{t.faq1Q}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{t.faq1A}</p>
                    </div>
                    <div className="h-px w-full bg-white/5" />
                    <div>
                      <h4 className="text-white font-bold mb-1">{t.faq2Q}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{t.faq2A}</p>
                    </div>
                    <div className="h-px w-full bg-white/5" />
                    <div>
                      <h4 className="text-white font-bold mb-1">{t.faq3Q}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{t.faq3A}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'developer' && (
                    <div className="space-y-6">
                      
                      {/* Elite Dev Profile Card */}
                      <div className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                        
                        {/* Decorative Background Glows */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />

                        <div className={`flex flex-col sm:flex-row items-center gap-5 relative z-10 ${isAr ? 'sm:flex-row-reverse text-center sm:text-right' : 'text-center sm:text-left'}`}>
                          
                          {/* Animated Creator Avatar */}
                          <div className="relative group shrink-0">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
                            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-2xl font-black text-white relative select-none">
                              <span>👨‍💻</span>
                              <span className="text-[9px] text-indigo-400 mt-0.5 tracking-wider font-extrabold uppercase font-mono">OBADA</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {t.developedBy}
                            </span>
                            <h4 className="text-lg font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-300">
                              {t.devTitle}
                            </h4>
                            <p className="text-xs text-purple-200/80 font-semibold tracking-wide font-mono">
                              {t.devSubtitle}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Bio bullet points */}
                        <p className={`text-xs text-slate-400 mt-4 leading-normal ${isAr ? 'text-right' : 'text-left'}`}>
                          {isAr 
                            ? "تم تصميم وصقل LinkedIn Authority بخبرة هندسية عالية لتمكين المهندسين والمطورين في العالم العربي من بناء حضور احترافي وعميق على لينكدإن باستخدام هندسة الأوامر الذكية وتحليل شجرة مستودعات الكود." 
                            : "LinkedIn Authority was built with elite software craftsmanship to empower creators & engineers to command dynamic authority on LinkedIn feeds, fully automated from live repository scanning."
                          }
                        </p>
                      </div>

                      {/* Developer Portfolio + Contact Connections */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        
                        {/* PORTFOLIO ACCENT BUTTON */}
                        <a 
                          href="https://obadadallo.web.app/"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/50 transition-all duration-200 group text-slate-100 cursor-pointer shadow hover:scale-[1.02]"
                          title={t.visitPortfolio}
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
                            <div className="text-left">
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">PORTFOLIO</p>
                              <p className="text-xs font-black">obadadallo.web.app</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </a>

                        {/* GITHUB BLUEPRINT */}
                        <a 
                          href="https://github.com/obadadallo95"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-200 group text-slate-100 cursor-pointer hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-2.5">
                            <GitBranch className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform duration-200" />
                            <div className="text-left">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GITHUB</p>
                              <p className="text-xs font-black">obadadallo95</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 transition-colors" />
                        </a>

                        {/* LINKEDIN NETWORKING */}
                        <a 
                          href="https://www.linkedin.com/in/obada-dallo-777a47a9/"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all duration-200 group text-slate-100 cursor-pointer hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-2.5">
                            <Share2 className="w-4 h-4 text-sky-400 group-hover:-translate-y-0.5 transition-transform duration-200" />
                            <div className="text-left">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LINKEDIN</p>
                              <p className="text-xs font-black">Obada Dallo</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                        </a>

                      </div>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer rights section of modal */}
            <div className={`p-4 bg-slate-950/60 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between px-6 text-[10px] text-slate-500 font-semibold gap-2 ${isAr ? 'sm:flex-row-reverse' : ''}`}>
              <span className="flex items-center gap-1.5 font-mono">
                <Copyright className="w-3 h-3 text-slate-600" />
                <span>{t.rightsReserved}</span>
              </span>
              
              <div className="flex items-center gap-1.5 text-rose-500/80">
                <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>Crafted by Obada Dallo</span>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

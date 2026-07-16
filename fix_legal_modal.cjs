const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/LegalModal.tsx', 'utf8');

// 1. Add faq to types
code = code.replace(/initialTab\?: 'privacy' \| 'terms' \| 'developer';/g, "initialTab?: 'privacy' | 'terms' | 'developer' | 'faq';");
code = code.replace(/useState\<'privacy' \| 'terms' \| 'developer'\>/g, "useState<'privacy' | 'terms' | 'developer' | 'faq'>");

// 2. Add translations
const arFaq = `
      tabFaq: "الأسئلة الشائعة",
      faq1Q: "هل تقومون بتخزين الكود الخاص بي؟",
      faq1A: "لا، نحن لا نقوم بتخزين أي شفرة مصدرية. نقوم فقط بقراءة الملفات للتحليل اللحظي وتوليد المحتوى.",
      faq2Q: "هل يمكنني حذف بياناتي؟",
      faq2A: "نعم، يمكنك حذف حسابك وكافة بياناتك نهائياً من خلال زر 'حذف الحساب' في صفحة الإعدادات، استجابة لقوانين حماية البيانات (GDPR).",
      faq3Q: "هل هناك اشتراك مدفوع؟",
      faq3A: "حاليا المنصة مجانية كجزء من النسخة التجريبية.",
      developedBy:`;
code = code.replace(/developedBy:/g, (match, offset) => {
  // only replace the first occurrence in AR
  if(offset < 1500) return arFaq.trim().replace('developedBy:', 'developedBy:');
  return match;
});

const enFaq = `
      tabFaq: "FAQ",
      faq1Q: "Do you store my code?",
      faq1A: "No, we do not store any source code. We only read files for real-time analysis and content generation.",
      faq2Q: "Can I delete my data?",
      faq2A: "Yes, you can permanently delete your account and all data via the 'Delete Account' button in Settings, fully compliant with GDPR.",
      faq3Q: "Is there a paid subscription?",
      faq3A: "The platform is currently free as part of our beta release.",
      developedBy:`;
code = code.replace(/developedBy:/g, (match, offset) => {
  if(offset > 1500 && offset < 3500) return enFaq.trim().replace('developedBy:', 'developedBy:');
  return match;
});

const deFaq = `
      tabFaq: "FAQ",
      faq1Q: "Speichern Sie meinen Code?",
      faq1A: "Nein, wir speichern keinen Quellcode. Wir lesen Dateien nur zur Echtzeitanalyse und Inhaltserstellung.",
      faq2Q: "Kann ich meine Daten löschen?",
      faq2A: "Ja, Sie können Ihr Konto und alle Daten über die Schaltfläche 'Konto löschen' in den Einstellungen dauerhaft löschen (DSGVO-konform).",
      faq3Q: "Gibt es ein kostenpflichtiges Abonnement?",
      faq3A: "Die Plattform ist derzeit als Teil unserer Beta-Version kostenlos.",
      developedBy:`;
code = code.replace(/developedBy:/g, (match, offset) => {
  if(offset > 3500) return deFaq.trim().replace('developedBy:', 'developedBy:');
  return match;
});

// 3. Add Tab Button for FAQ
const tabsUi = `
            <button
              onClick={() => setActiveTab('faq')}
              className={\`flex-1 py-3 text-xs md:text-sm font-bold transition-colors \${activeTab === 'faq' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:bg-white/5'}\`}
            >
              {isAr ? t.tabFaq : t.tabFaq}
            </button>
            <button
              onClick={() => setActiveTab('developer')}
`;
code = code.replace(/<button\s*onClick=\{\(\) => setActiveTab\('developer'\)\}/g, tabsUi.trim());


// 4. Add FAQ section rendering
const faqSection = `
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
`;
code = code.replace(/\{activeTab === 'developer' && \(/, faqSection.trim());

fs.writeFileSync('src/components/Layout/LegalModal.tsx', code);

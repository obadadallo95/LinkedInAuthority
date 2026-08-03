const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = {
  'en.ts': `
    navAutomations: "Automations",
    automationsTitle: "Weekly Automations",
    automationsDesc: "Monitor repositories and automatically generate weekly content.",
    automationEmptyTitle: "No Active Automations",
    automationEmptyDesc: "Select a repository to set up automated weekly insights, updates, and post generation.",
    automationCreateBtn: "Create New Automation",
    automationStatusActive: "Active",
    automationStatusPaused: "Paused",
    automationNextRun: "Next Run",
  `,
  'ar.ts': `
    navAutomations: "الأتمتة",
    automationsTitle: "السلسلة الأسبوعية",
    automationsDesc: "مراقبة المستودعات وتوليد محتوى أسبوعي آلياً.",
    automationEmptyTitle: "لا توجد أتمتة نشطة",
    automationEmptyDesc: "اختر مستودعاً لإعداد رؤى أسبوعية وتحديثات وتوليد منشورات تلقائياً.",
    automationCreateBtn: "إنشاء أتمتة جديدة",
    automationStatusActive: "نشط",
    automationStatusPaused: "متوقف",
    automationNextRun: "التشغيل القادم",
  `,
  'de.ts': `
    navAutomations: "Automatisierungen",
    automationsTitle: "Wöchentliche Automatisierungen",
    automationsDesc: "Repositories überwachen und wöchentlich Inhalte generieren.",
    automationEmptyTitle: "Keine aktiven Automatisierungen",
    automationEmptyDesc: "Wählen Sie ein Repository, um wöchentliche Einblicke und Posts einzurichten.",
    automationCreateBtn: "Neue Automatisierung erstellen",
    automationStatusActive: "Aktiv",
    automationStatusPaused: "Pausiert",
    automationNextRun: "Nächster Lauf",
  `
};

for (const [file, content] of Object.entries(files)) {
  const filePath = path.join(localesDir, file);
  let text = fs.readFileSync(filePath, 'utf8');
  // insert before the last };
  text = text.replace(/};\s*$/, content + '};\n');
  fs.writeFileSync(filePath, text);
}
console.log("Locales patched");

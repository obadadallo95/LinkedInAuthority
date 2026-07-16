const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf8');

// 1. Add handleDeleteAccount to props
code = code.replace(/handleDisconnect: \(provider: 'github' \| 'linkedin'\) => void;/g, `handleDisconnect: (provider: 'github' | 'linkedin') => void;\n  handleDeleteAccount: () => void;`);
code = code.replace(/handleDisconnect,\n  loading/g, `handleDisconnect,\n  handleDeleteAccount,\n  loading`);

// 2. Add Danger Zone UI at the end
const dangerZoneUi = `
      {/* Danger Zone (GDPR / Delete Account) */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 mt-12 animate-in fade-in duration-500">
        <h3 className="text-lg font-black text-red-400 tracking-tight mb-2">
          {isAr ? 'منطقة الخطر - حذف الحساب' : isDe ? 'Gefahrenzone - Konto löschen' : 'Danger Zone - Delete Account'}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {isAr 
            ? 'حذف حسابك سيؤدي إلى مسح جميع بياناتك، منشوراتك، وإعداداتك نهائياً من قاعدة البيانات. استجابةً لحق النسيان (GDPR)، سيتم إزالة كافة آثار نشاطك من خوادمنا. هذا الإجراء لا يمكن التراجع عنه.' 
            : isDe 
            ? 'Wenn Sie Ihr Konto löschen, werden alle Ihre Daten, Beiträge und Einstellungen dauerhaft aus unserer Datenbank gelöscht. Gemäß der DSGVO werden alle Spuren Ihrer Aktivitäten von unseren Servern entfernt. Diese Aktion kann nicht rückgängig gemacht werden.'
            : 'Deleting your account will permanently erase all your data, posts, and settings from our database. In compliance with the "Right to be Forgotten" (GDPR), all traces of your activity will be removed from our servers. This action cannot be undone.'}
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          {isAr ? 'حذف الحساب نهائياً' : isDe ? 'Konto endgültig löschen' : 'Permanently Delete Account'}
        </button>
      </div>
    </div>
  );
};
`;

code = code.replace(/<\/div>\n  \);\n};\n$/g, dangerZoneUi.trim() + '\n');

fs.writeFileSync('src/components/SettingsPanel.tsx', code);

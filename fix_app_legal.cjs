const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/activeTab={legalModalTab}\n        setActiveTab={setLegalModalTab}/, 'initialTab={legalModalTab}');

fs.writeFileSync('src/App.tsx', code);

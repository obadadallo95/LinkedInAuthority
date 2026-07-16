const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix export default
code = code.replace('export default function App() {', 'function App() {');

// Fix duplicate lang
let lines = code.split('\n');
let langIndex = lines.findIndex(l => l.includes('// Language state'));
if (langIndex !== -1) {
  // Delete the comment and the declaration (4 lines)
  lines.splice(langIndex, 4);
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodCode = `export default function App() {
  const [lang, setLang] = useState<'ar' | 'en' | 'de'>(() => {
    try {
      return (localStorage.getItem('linkedin_auth_lang') as 'ar' | 'en' | 'de') || 'ar';
    } catch (e) {
      return 'ar';
    }
  });
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('export default function App() {'));
let endIndex = lines.findIndex(l => l.includes("return 'ar';"));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1, goodCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

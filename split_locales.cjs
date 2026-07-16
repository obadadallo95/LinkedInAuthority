const fs = require('fs');

// We need to parse the constants.ts file.
// Since it's typescript, we could just import it if we transpile, or use regex.
// Using a regex to extract ar, en, de objects is easy.

const content = fs.readFileSync('src/constants.ts', 'utf-8');

const getObject = (lang) => {
  const start = content.indexOf(`  ${lang}: {`);
  if (start === -1) return null;
  let braces = 0;
  let end = -1;
  for (let i = start + 6; i < content.length; i++) {
    if (content[i] === '{') braces++;
    if (content[i] === '}') {
      braces--;
      if (braces === 0) {
        end = i;
        break;
      }
    }
  }
  return content.substring(start + 2 + lang.length + 3, end + 1);
};

const ar = getObject('ar');
const en = getObject('en');
const de = getObject('de');

fs.writeFileSync('src/locales/ar.ts', `export const ar = ${ar};\n`);
fs.writeFileSync('src/locales/en.ts', `export const en = ${en};\n`);
fs.writeFileSync('src/locales/de.ts', `export const de = ${de};\n`);

const indexTs = `import { ar } from './ar';
import { en } from './en';
import { de } from './de';

export type TranslationKey = keyof typeof en;
export type SupportedLanguage = 'en' | 'ar' | 'de';

export const t: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  ar,
  en,
  de
};
`;
fs.writeFileSync('src/locales/index.ts', indexTs);

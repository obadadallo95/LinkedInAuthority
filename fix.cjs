const fs = require('fs');
let code = fs.readFileSync('src/components/PostsHub.tsx', 'utf-8');

// I need to replace all single quotes that span multiple lines with backticks.
// But the syntax error I got earlier was because I had unescaped newlines in the string literal in the JS file.
// Let's just fix it by replacing single quotes with backticks around the text values.
code = code.replace(/text: isAr \n        \? '([\s\S]*?)'\n        : '([\s\S]*?)',/g, 'text: isAr \n        ? `$1`\n        : `$2`,');
code = code.replace(/text: isAr\n        \? '([\s\S]*?)'\n        : '([\s\S]*?)',/g, 'text: isAr\n        ? `$1`\n        : `$2`,');

fs.writeFileSync('src/components/PostsHub.tsx', code);

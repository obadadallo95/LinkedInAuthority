const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const titleTag = '<title>The Agent Control Tower</title>';
const newSeo = `<title>LinkedIn Authority Engine | AI Content Automation</title>
    <meta name="description" content="AI-powered LinkedIn content automation platform. Transform your GitHub repositories into engaging technical posts, articles, and graphics.">
    <meta name="keywords" content="LinkedIn, Automation, AI, GitHub, Developer, Content Creation, Tech Brand">
    <meta property="og:title" content="LinkedIn Authority Engine">
    <meta property="og:description" content="Turn your codebase into a powerful professional brand on LinkedIn using AI.">
    <meta property="og:type" content="website">
    <link rel="author" href="/about-linkedin-authority.md">
`;

code = code.replace(titleTag, newSeo);
fs.writeFileSync('index.html', code);

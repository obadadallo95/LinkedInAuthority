const fs = require('fs');
const file = 'src/components/RepoDetails.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add imports
content = content.replace(
  "import { DeepScanLoader } from './DeepScan/DeepScanLoader';",
  `import { DeepScanLoader } from './DeepScan/DeepScanLoader';
import { Target, AlertTriangle, MessageSquare, Repeat2, Send, ThumbsUp, Globe, Check } from 'lucide-react';
import { IntentCards } from './IntentCards';
import { TransformationLoader } from './TransformationLoader';
import { motion, AnimatePresence } from 'framer-motion';

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

const LinkedinIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
`
);

// 2. Add state
content = content.replace(
  "const [needsContext, setNeedsContext] = useState(false);",
  `const [needsContext, setNeedsContext] = useState(false);
  const [targetAudience, setTargetAudience] = useState('Software Engineers');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedComment, setHasCopiedComment] = useState(false);`
);

// 3. Update the quick analyze endpoint call to pass targetAudience
content = content.replace(
  "body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, intent, lang: lang })",
  "body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, intent, humanContext: targetAudience, lang: lang })"
);

// 4. Update the generate post endpoint to use humanContext from the state
content = content.replace(
  "body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, analysisToken, angleId: angle.id, humanContext, lang })",
  "body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, analysisToken, angleId: angle.id, humanContext, lang })" // It actually already has humanContext, which we use for targetAudience if we don't have adaptive questions! Wait, the adaptive question uses humanContext state too. Let's let them coexist.
);

fs.writeFileSync(file, content, 'utf-8');

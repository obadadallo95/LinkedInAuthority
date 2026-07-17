# AI Generation & Predictive Reach Engineering

This document outlines the artificial intelligence pipelines powering **LinkedIn Authority [PRO]**, focusing on repository content parsing, the Google Gemini API integration, and predictive engagement indexing.

---

## 1. Engine & Model Selection

- **Primary SDK**: Official `@google/genai` TypeScript SDK (server-side exclusive).
- **Core Model**: `gemini-3.5-flash` - Chosen for low-latency inference, highly optimized system-instruction compliance, and cost-efficient scaling.
- **Access Strategy**: Token secrets are kept server-side in `process.env.GEMINI_API_KEY` to guarantee complete client isolation.

---

## 2. Codebase Scan & Repository Synthesis

When a user selects a repository for LinkedIn publication:
1. The server makes secure, authenticated requests via GitHub API Proxies to obtain the repository's `README.md` and public descriptions.
2. The extracted markdown files and directory structures are synthesized into structural context strings.
3. The server filters out binary files, node_modules, or lock files to preserve context space.
4. The synthesized repository context is fed directly into the system instruction prompt.

---

## 3. Advanced Multi-lingual Prompting Strategy

The prompt requests the LLM to act as an elite Technical Developer Advocate and generates highly engaging publications tailored for three content templates across different languages:

### Content Categories:
1. **Showcase**: Focusing on codebase architecture, core algorithms, stack decisions, and coding micro-details.
2. **Educational / Tutorial**: Structured lessons explaining "How-To" solve a specific problem using the source codebase.
3. **Thought Leadership**: Deep systems discussions, engineering philosophies, or architectural trade-offs.

### System Prompt Engineering Parameters:
The backend instructs Gemini to respond with a structured JSON array containing exact formats to feed the visual social graphics:

```ts
const systemInstruction = `
You are an elite, world-class developer advocate and software architect.
Analyze the provided repository content (README, file context, and description) and generate LinkedIn posts.
Your tone must be technical, authentic, and engaging.

Provide exactly 3 posts matching the requested template (${template}) and target language (${lang}).
For each post, output a JSON object containing:
1. "text": The complete markdown string of the LinkedIn post with relevant hashtags.
2. "cardConfig": {
     "title": A short high-impact title for a social graphic (max 20 chars).
     "subtitle": A secondary descriptive context (max 35 chars).
     "metrics": A technical key performance metric, e.g. "99.2% Uptime", "12ms Latency".
     "colorTheme": One of "indigo", "emerald", "amber", "rose", "slate".
   }
`;
```

---

## 4. Predictive Engagement Algorithm

The system features an interactive **AI Reach Predictor** and **Predictive Engagement Index** calculations located in `AnalyticsPanel.tsx`. It simulates future LinkedIn engagement based on content characteristics and historical trends:

### 1. Organic Reach Formulation:
The potential reach of any post is calculated through high-fidelity character-weighting models:
$$\text{Reach} = 1200 + (\text{Text Length} \times 1.83)$$
- For scheduled posts, a projected reach is estimated using:
$$\text{Projected} = 1500 + (\text{Text Length} \times 1.5)$$

### 2. Interaction Breakdown Simulation:
Interactions (Likes, Shares, Comments) are calculated proportionally to organic reach:
- **Likes**: ~3.5% of Reach
- **Shares**: ~0.6% of Reach
- **Comments**: ~1.2% of Reach

### 3. Category & Tag Classification:
The predictive index automatically parses generated post structures using sub-string matching classifiers:
- If text contains: `"tutorial"`, `"how to"`, `"شرح"`, `"تعلم"` -> Classified as **Educational / Tutorial** (High audience retention).
- If text contains: `"showcase"`, `"demo"`, `"code"`, `"مستودع"` -> Classified as **Showcase / Feature Release** (High interaction rates).
- If text contains: `"opinion"`, `"thought"`, `"نقاش"`, `"leader"` -> Classified as **Thought Leadership** (High shareability).

This classification dynamically renders the **High-Impact Content Type** widget inside the Analytics screen.

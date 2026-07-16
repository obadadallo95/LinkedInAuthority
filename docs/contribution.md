# Contribution & Development Standards Guide

Welcome! This guide outlines the development workflows, contribution procedures, and technical standards governing the **LinkedIn Authority [PRO]** codebase to ensure consistent quality and ease of maintenance.

---

## 1. Branching & Lifecycle Model

For development inside engineering teams:
1. **Branch Names**: Use descriptive, prefixed branches:
   - `feature/your-feature-name` for new user stories.
   - `bugfix/issue-description` for hotfixes.
   - `docs/changes-detail` for documentations.
2. **Review Pipeline**: Always target type checking and linter scans before merging into the main line:
   ```bash
   npm run lint
   ```

---

## 2. Coding Standards & Conventions

To maintain a clean, readable, and highly maintainable codebase, future engineers are expected to respect the following standards:

### A. TypeScript Guidelines
- **Strict Typing**: Avoid using the `any` type parameter. Always define solid interfaces inside `/src/types.ts` or close to the component's structure.
- **Named Imports**: Do not use object destructuring imports. Place all `import` blocks at the top level of the file:
  ```typescript
  // ❌ Bad
  const React = require('react');
  
  // ✅ Good
  import React, { useState, useMemo } from 'react';
  ```
- **Standard Enums**: Use standard TypeScript `enum` declarations, never `const enum`.

### B. React Components Style Guide
- **Functional Components**: All components must be written as functional components utilizing hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- **UseEffect Safety**: Avoid infinite re-renders. Never trigger state updates directly within the main body of a component. Only include primitive variables inside the dependency arrays of `useEffect` blocks unless dependencies are heavily memoized.
- **Component Splitting**: Do not create massive component files (e.g. keep files under 400 lines where practical). Extract modular subsystems (such as cards, modals, or graph tooltips) into dedicated files under `/src/components/` or a close directory hierarchy.

### C. Styling & Tailwind CSS
- **Tailwind Utility First**: Write clean, responsive utility classes directly inside JSX `className` parameters.
- **Translucent UI Patterns**: Adhere strictly to the established **Glassmorphic Slate** theme. Do not invent custom, vibrant gradients or unrequested dark color themes. Frame components with soft white boundaries (`border-white/5`) and backdrops (`bg-slate-900/40 backdrop-blur-md`).
- **Dynamic Icons**: Import all icons exclusively from the `lucide-react` library. Do not design manual custom inline SVGs.

---

## 3. Localization Best Practices

All visible strings, captions, overlays, or buttons **MUST** read translations from the primary localized dictionary defined in `/src/constants.ts`:

- When implementing new UI text, always add its equivalent translation keys for:
  1. `en` (English)
  2. `ar` (Arabic - RTL)
  3. `de` (German)
- Inside the component, read the active `lang` prop and query translations using `t[lang].yourKeyName`.
- Account for layout alterations in Arabic RTL contexts using conditional CSS parameters (e.g., matching padding-left to padding-right).

---

## 4. Verification & Testing Checklist

Before proposing or shipping changes, verify that the application compiles perfectly under production environments:

1. **Linting Check**:
   ```bash
   npm run lint
   ```
2. **Production Compilation**:
   ```bash
   npm run build
   ```
3. **Execution**:
   ```bash
   npm run start
   ```
   *Verify that the application successfully binds to port `3000` and starts without warnings.*

export const isBrowserE2E = import.meta.env.DEV
  && typeof window !== 'undefined'
  && window.localStorage.getItem('linkedin-e2e-mode') === 'true';

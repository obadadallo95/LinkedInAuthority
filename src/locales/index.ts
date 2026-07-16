import { ar } from './ar';
import { en } from './en';
import { de } from './de';

export type TranslationKey = keyof typeof en;
export type SupportedLanguage = 'en' | 'ar' | 'de';

export const t: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  ar,
  en,
  de
};

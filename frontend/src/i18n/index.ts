import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uz } from './uz';
import { ru } from './ru';

export type Locale = 'uz' | 'ru';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'uz',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'smartpos-lang' }
  )
);

const translations = { uz, ru };

export const useTranslation = () => {
  const { locale, setLocale } = useI18nStore();
  const currentLang = translations[locale] || uz;

  const t = (path: string): string => {
    const parts = path.split('.');
    let cur: any = currentLang;
    for (const part of parts) {
      if (cur && cur[part] !== undefined) {
        cur = cur[part];
      } else {
        return path;
      }
    }
    return typeof cur === 'string' ? cur : path;
  };

  return { t, locale, setLocale };
};

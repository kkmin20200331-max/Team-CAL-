import { useState, useEffect } from 'react';

function applyLangAttribute(language: string) {
  document.documentElement.setAttribute('data-lang', language);
}

export function useLanguage() {
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja'>(
    () => {
      const lang = (sessionStorage.getItem('app-language') as 'ko' | 'en' | 'ja') || 'ko';
      applyLangAttribute(lang);
      return lang;
    }
  );

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const lang = (e.detail as 'ko' | 'en' | 'ja') || 'ko';
      setLanguage(lang);
      applyLangAttribute(lang);
    };
    window.addEventListener('app-language-change', handler as EventListener);
    return () => window.removeEventListener('app-language-change', handler as EventListener);
  }, []);

  return language;
}

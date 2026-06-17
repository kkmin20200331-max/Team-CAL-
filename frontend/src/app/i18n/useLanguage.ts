import { useState, useEffect } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja'>(
    () => (sessionStorage.getItem('app-language') as 'ko' | 'en' | 'ja') || 'ko'
  );

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setLanguage((e.detail as 'ko' | 'en' | 'ja') || 'ko');
    };
    window.addEventListener('app-language-change', handler as EventListener);
    return () => window.removeEventListener('app-language-change', handler as EventListener);
  }, []);

  return language;
}

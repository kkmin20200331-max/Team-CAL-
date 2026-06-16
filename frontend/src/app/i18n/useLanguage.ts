import { useState, useEffect } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja'>(
    () => (localStorage.getItem('app-language') as 'ko' | 'en' | 'ja') || 'ko'
  );
  useEffect(() => {
    const handler = () => {
      setLanguage((localStorage.getItem('app-language') as 'ko' | 'en' | 'ja') || 'ko');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return language;
}

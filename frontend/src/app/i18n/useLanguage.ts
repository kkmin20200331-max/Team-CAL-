import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/axiosInstance';

function applyLangAttribute(language: string) {
  document.documentElement.setAttribute('data-lang', language);
}

function getCurrentUserId() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.id || user.user_id || user.userId || '';
  } catch {
    return '';
  }
}

function syncLanguage(language: 'ko' | 'en' | 'ja') {
  const userId = getCurrentUserId();

  if (!userId) {
    return;
  }

  fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/language`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  }).catch(() => {});
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
      syncLanguage(lang);
    };
    window.addEventListener('app-language-change', handler as EventListener);
    return () => window.removeEventListener('app-language-change', handler as EventListener);
  }, []);

  return language;
}

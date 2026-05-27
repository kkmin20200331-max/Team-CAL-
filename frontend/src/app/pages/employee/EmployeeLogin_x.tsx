import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { useTheme } from 'next-themes';
import { Moon, Sun, Smartphone } from 'lucide-react';

export default function EmployeeLogin_x() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('ko');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/employee/home');
  };

  const translations = {
    ko: {
      title: 'ShiftOps AI',
      subtitle: '직원 앱',
      username: '아이디',
      password: '비밀번호',
      login: '로그인',
      signup: '회원가입',
      language: '언어',
      darkMode: '다크 모드'
    },
    en: {
      title: 'ShiftOps AI',
      subtitle: 'Employee App',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      signup: 'Sign Up',
      language: 'Language',
      darkMode: 'Dark Mode'
    },
    ja: {
      title: 'ShiftOps AI',
      subtitle: '従業員アプリ',
      username: 'ユーザー名',
      password: 'パスワード',
      login: 'ログイン',
      signup: '会員登録',
      language: '言語',
      darkMode: 'ダークモード'
    }
  };

  const t = translations[language as keyof typeof translations];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t.subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">{t.username}</Label>
              <Input id="username" type="text" placeholder={t.username} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input id="password" type="password" placeholder={t.password} />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              {t.login}
            </Button>

            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              {t.signup}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div className="space-y-2">
              <Label>{t.language}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t.darkMode}</Label>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => navigate('/admin')}
            >
              관리자로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

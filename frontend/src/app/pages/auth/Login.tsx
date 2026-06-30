import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../../components/PasswordInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { useTheme } from "next-themes";
import { loginAPI } from "../../components/api/auth";

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.1565 14.4456C20.1565 11.2915 17.5996 8.73453 14.4455 8.73453C11.2914 8.73453 8.73446 11.2914 8.73446 14.4456C8.73447 17.5997 11.2914 20.1565 14.4455 20.1565C17.5996 20.1565 20.1565 17.5997 20.1565 14.4456ZM22.1721 14.4456C22.1721 18.7129 18.7128 22.1722 14.4455 22.1722C10.1782 22.1722 6.71882 18.7129 6.71881 14.4456C6.71881 10.1782 10.1782 6.71887 14.4455 6.71887C18.7128 6.71888 22.1721 10.1782 22.1721 14.4456Z" fill={color} />
      <path d="M13.4377 3.69538V1.00783C13.4377 0.451219 13.8889 0 14.4455 0C15.0021 0 15.4533 0.451219 15.4533 1.00783V3.69538C15.4533 4.25198 15.0021 4.7032 14.4455 4.7032C13.8889 4.7032 13.4377 4.25198 13.4377 3.69538Z" fill={color} />
      <path d="M13.4377 27.8832V25.1957C13.4377 24.6391 13.8889 24.1879 14.4455 24.1879C15.0021 24.1879 15.4533 24.6391 15.4533 25.1957V27.8832C15.4533 28.4398 15.0021 28.8911 14.4455 28.8911C13.8889 28.8911 13.4377 28.4398 13.4377 27.8832Z" fill={color} />
      <path d="M3.69538 13.4377C4.25198 13.4377 4.7032 13.8889 4.7032 14.4455C4.7032 15.0021 4.25198 15.4533 3.69538 15.4533H1.00783C0.451219 15.4533 0 15.0021 0 14.4455C0 13.8889 0.451219 13.4377 1.00783 13.4377H3.69538Z" fill={color} />
      <path d="M27.8832 13.4377C28.4398 13.4377 28.8911 13.8889 28.8911 14.4455C28.8911 15.0021 28.4398 15.4533 27.8832 15.4533H25.1957C24.6391 15.4533 24.1879 15.0021 24.1879 14.4455C24.1879 13.8889 24.6391 13.4377 25.1957 13.4377H27.8832Z" fill={color} />
      <path opacity="0.5" d="M24.2171 3.25079C24.6278 2.87521 25.2653 2.90374 25.6409 3.31453C26.0165 3.72531 25.988 4.36278 25.5772 4.73836L22.5913 7.46835C22.1805 7.84392 21.5431 7.81539 21.1675 7.40461C20.7919 6.99382 20.8204 6.35633 21.2312 5.98074L24.2171 3.25079Z" fill={color} />
      <path opacity="0.5" d="M3.25012 3.31453C3.6257 2.90374 4.26316 2.87521 4.67395 3.25079L7.65983 5.98074C8.07062 6.35632 8.09915 6.99382 7.72357 7.40461C7.34798 7.81539 6.71049 7.84393 6.2997 7.46835L3.31386 4.73836C2.90307 4.36277 2.87454 3.72532 3.25012 3.31453Z" fill={color} />
      <path opacity="0.5" d="M6.26737 21.1984C6.66095 20.8049 7.29907 20.8049 7.69265 21.1984C8.08623 21.592 8.08623 22.2302 7.69265 22.6237L4.70649 25.6098C4.31291 26.0034 3.67479 26.0034 3.28121 25.6098C2.88763 25.2163 2.88763 24.5781 3.28121 24.1846L6.26737 21.1984Z" fill={color} />
      <path opacity="0.5" d="M21.1987 21.1976C21.5923 20.8041 22.2304 20.8041 22.624 21.1977L25.6098 24.1838C26.0034 24.5774 26.0033 25.2155 25.6097 25.6091C25.2161 26.0026 24.578 26.0026 24.1845 25.609L21.1986 22.6229C20.805 22.2293 20.8051 21.5912 21.1987 21.1976Z" fill={color} />
    </svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M27.898 13.9496C27.898 21.6533 21.6527 27.8986 13.949 27.8986C12.325 27.8986 10.7658 27.621 9.31634 27.1109C8.70609 25.6344 8.36938 24.016 8.36938 22.319C8.36938 19.2206 9.49182 16.3844 11.3522 14.1948C12.9865 16.5739 15.7267 18.1343 18.8311 18.1343C22.1252 18.1343 25.009 16.3775 26.5968 13.7498C26.9306 13.1974 27.898 13.3041 27.898 13.9496Z" fill={color} />
      <path d="M0 13.949C0 20.0288 3.88971 25.2001 9.31636 27.1103C8.70611 25.6338 8.36941 24.0155 8.36941 22.3184C8.36941 19.2201 9.49184 16.3838 11.3523 14.1942C10.3505 12.7359 9.76431 10.9698 9.76431 9.06686C9.76431 5.77273 11.521 2.88891 14.1488 1.30111C14.7011 0.967322 14.5944 0 13.949 0C6.24518 0 0 6.24518 0 13.949Z" fill={color} />
    </svg>
  );
}

const translations = {
  ko: {
    username: "아이디",
    password: "비밀번호",
    login: "로그인",
    signup: "회원가입",
    language: "언어",
    darkMode: "다크 모드",
    errorEmpty: "아이디와 비밀번호를 모두 입력해주세요.",
    errorNoUser: "계정 정보가 일치하지 않습니다.",
    errorPending: "관리자 승인 대기 중입니다.",
    errorServer: "서버 오류가 발생했습니다.",
  },
  en: {
    username: "Username",
    password: "Password",
    login: "Login",
    signup: "Sign Up",
    language: "Language",
    darkMode: "Dark Mode",
    errorEmpty: "Please enter both username and password.",
    errorNoUser: "Invalid username or password.",
    errorPending: "Waiting for admin approval.",
    errorServer: "Server error occurred.",
  },
  ja: {
    username: "会員ID",
    password: "パスワード",
    login: "ログイン",
    signup: "会員登録",
    language: "言語",
    darkMode: "ダークモード",
    errorEmpty: "IDとパスワードを入力してください。",
    errorNoUser: "アカウント情報が一致しません。",
    errorPending: "管理者の承認待ちです。",
    errorServer: "サーバーエラーが発生しました。",
  },
};

const logoMap: Record<string, string> = {
  ko: "/logo_ko.png",
  en: "/logo_en.png",
  ja: "/logo_ja.png",
};

const fontMap: Record<string, string> = {
  ko: "'Noto Sans KR', sans-serif",
  en: "'Leferi', 'Noto Sans KR', sans-serif",
  ja: "'Noto Sans JP', sans-serif",
};

export default function Login() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState(
    () => sessionStorage.getItem("app-language") || "ko",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const t = translations[language as keyof typeof translations];
  const isDark = theme === "dark";
  const font = fontMap[language];

  // 비밀번호 dots 가시성: HTML color-scheme을 테마에 맞게 강제
  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const bgColor = isDark ? "#1c1c1e" : "#EEF5DD";
  const cardBg = isDark ? "#2c2c2e" : "#FFFFFF";
  const labelColor = isDark ? "#aaa" : "#606060";
  const inputBg = isDark ? "#3a3a3c" : "#F2F5EB";
  const secondaryBtnBg = isDark ? "#3a3a3c" : "#F2F5EB";
  const secondaryBtnColor = isDark ? "#4cd964" : "#00A200";

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    sessionStorage.setItem("app-language", val);
    window.dispatchEvent(new CustomEvent("app-language-change", { detail: val }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const loginUsername = username.trim();
    const loginPassword = password.trim();
    if (!loginUsername || !loginPassword) {
      setErrorMsg(t.errorEmpty);
      return;
    }
    try {
      const res = await loginAPI(loginUsername, loginPassword);
      const loginUser = {
        id: res.data.id,
        username: res.data.username,
        name: res.data.name,
        role: res.data.role,
        phone: res.data.phone || '',
      };
      sessionStorage.setItem("user", JSON.stringify(loginUser));

      if (loginUser.role === "MASTER") {
        navigate("/master/applications");
      } else if (loginUser.role === "ADMIN") {
        navigate("/admin/branch-selection");
      } else {
        navigate("/employee/home");
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setErrorMsg(t.errorPending);
      } else if (err.response?.status === 401 || err.response?.status === 404) {
        setErrorMsg(t.errorNoUser);
      } else {
        setErrorMsg(t.errorServer);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{
          background: cardBg,
          borderRadius: 58,
          boxShadow: isDark ? "3px 4px 20px rgba(0,0,0,0.4)" : "3px 4px 12.6px rgba(255,255,255,0.25)",
          padding: "48px 80px",
          minHeight: 780,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ height: 185, display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 24 }}>
            <img
              src={logoMap[language]}
              alt="Baitomate"
              style={{ width: 218, height: "auto", objectFit: "contain", marginTop: language === "ko" ? -10 : 0 }}
            />
          </div>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: font, fontWeight: 300, fontSize: 16, color: labelColor, marginBottom: 6 }}>
                {t.username}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.username}
                className="signup-input"
                style={{ width: "100%", height: 38, background: inputBg, boxShadow: "inset -2px -1px 4px rgba(126,147,126,0.14)", borderRadius: 9, border: "none", outline: "none", padding: "0 14px", fontFamily: font, fontWeight: 300, fontSize: 16, color: isDark ? "#fff" : "#333", WebkitTextFillColor: isDark ? "#fff" : "#333", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: font, fontWeight: 300, fontSize: 16, color: labelColor, marginBottom: 6 }}>
                {t.password}
              </div>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder={t.password}
                autoComplete="current-password"
                style={{ width: "100%", height: 38, background: inputBg, boxShadow: "inset -2px -1px 4px rgba(126,147,126,0.14)", borderRadius: 9, border: "none", outline: "none", padding: "0 14px", fontFamily: font, fontWeight: 300, fontSize: 16, color: isDark ? "#fff" : "#333", WebkitTextFillColor: isDark ? "#fff" : "#333", boxSizing: "border-box" as const }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: "#e03434", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              style={{ width: "100%", height: 67, background: "#00A200", borderRadius: 9, border: "none", color: "#fff", fontFamily: font, fontWeight: 700, fontSize: 18, cursor: "pointer", marginBottom: 14, transition: "opacity 0.15s" }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {t.login}
            </button>

            {/* Signup button */}
            <button
              type="button"
              onClick={() => navigate("/auth/signup")}
              style={{ width: "100%", height: 67, background: secondaryBtnBg, borderRadius: 9, border: "none", color: secondaryBtnColor, fontFamily: font, fontWeight: 700, fontSize: 18, cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {t.signup}
            </button>
          </form>

          {/* Divider */}
          <div style={{ margin: "28px 0", height: 1, background: isDark ? "#3a3a3c" : "#e5e7eb" }} />

          {/* Language */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: font, fontWeight: 300, fontSize: 16, color: labelColor, marginBottom: 8 }}>
              {t.language}
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger style={{ height: 38, background: inputBg, border: "none", borderRadius: 9, fontSize: 15, color: isDark ? "#fff" : "#606060" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dark mode */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: font, fontWeight: 300, fontSize: 16, color: labelColor }}>
              {t.darkMode}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SunIcon color="#00A200" />
              <Switch
                checked={isDark}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                className="data-[state=checked]:bg-[#00A200]"
              />
              <MoonIcon color="#00A200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

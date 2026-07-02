import { CSSProperties, useEffect, useState } from "react";
import { CheckCircle, LogOut, RefreshCw, ShieldCheck, Store, XCircle } from "lucide-react";

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M27.898 13.9496C27.898 21.6533 21.6527 27.8986 13.949 27.8986C12.325 27.8986 10.7658 27.621 9.31634 27.1109C8.70609 25.6344 8.36938 24.016 8.36938 22.319C8.36938 19.2206 9.49182 16.3844 11.3522 14.1948C12.9865 16.5739 15.7267 18.1343 18.8311 18.1343C22.1252 18.1343 25.009 16.3775 26.5968 13.7498C26.9306 13.1974 27.898 13.3041 27.898 13.9496Z" fill={color} />
      <path d="M0 13.949C0 20.0288 3.88971 25.2001 9.31636 27.1103C8.70611 25.6338 8.36941 24.0155 8.36941 22.3184C8.36941 19.2201 9.49184 16.3838 11.3523 14.1942C10.3505 12.7359 9.76431 10.9698 9.76431 9.06686C9.76431 5.77273 11.521 2.88891 14.1488 1.30111C14.7011 0.967322 14.5944 0 13.949 0C6.24518 0 0 6.24518 0 13.949Z" fill={color} />
    </svg>
  );
}
import { useTheme } from "next-themes";
import { Switch } from "../../components/ui/switch";
import {
  AdminApplication,
  approveAdminApplicationAPI,
  getAdminApplicationsAPI,
  rejectAdminApplicationAPI,
} from "../../components/api/adminApplications";

const BG = "#EEF5DD";
const BG_DARK = "#1c1c1e";
const GREEN = "#00A200";
const DARK_GREEN = "#07790F";
const LIGHT_GREEN = "#E6F5C8";
const BORDER_GREEN = "#00A200";
const FONT = "'Noto Sans JP', 'Noto Sans KR', sans-serif";

const translations = {
  ko: {
    master: "MASTER",
    title: "관리자 가입 신청",
    subtitle: "점주/관리자 신청을 검토하고 승인하면 매장이 자동 생성됩니다.",
    refresh: "새로고침",
    logout: "로그아웃",
    pending: "대기",
    count: "건",
    loading: "불러오는 중...",
    empty: "대기 중인 관리자 가입 신청이 없습니다.",
    error: "관리자 가입 신청을 불러오지 못했습니다.",
    approve: "승인",
    reject: "거절",
    applicant: "신청자",
    phone: "전화",
    bizType: "업종",
    bizNumber: "사업자번호",
    noAddress: "주소 미입력",
    confirmApprove: (name: string) => `${name} 관리자 가입 신청을 승인하시겠습니까?`,
    promptReject: "거절 사유를 입력하세요.",
    defaultRejectReason: "증빙 정보 확인이 필요합니다.",
    lang: "언어",
  },
  en: {
    master: "MASTER",
    title: "Admin Applications",
    subtitle: "Review and approve store owner applications. Approving will auto-create the store.",
    refresh: "Refresh",
    logout: "Logout",
    pending: "Pending",
    count: "",
    loading: "Loading...",
    empty: "No pending admin applications.",
    error: "Failed to load admin applications.",
    approve: "Approve",
    reject: "Reject",
    applicant: "Applicant",
    phone: "Phone",
    bizType: "Type",
    bizNumber: "Biz No.",
    noAddress: "No address",
    confirmApprove: (name: string) => `Approve application for ${name}?`,
    promptReject: "Enter rejection reason.",
    defaultRejectReason: "Verification of supporting documents is required.",
    lang: "Language",
  },
  ja: {
    master: "MASTER",
    title: "管理者登録申請",
    subtitle: "店舗主・管理者の申請を確認し、承認すると店舗が自動作成されます。",
    refresh: "更新",
    logout: "ログアウト",
    pending: "審査中",
    count: "件",
    loading: "読み込み中...",
    empty: "承認待ちの管理者申請はありません。",
    error: "管理者申請の読み込みに失敗しました。",
    approve: "承認",
    reject: "却下",
    applicant: "申請者",
    phone: "電話",
    bizType: "業種",
    bizNumber: "事業者番号",
    noAddress: "住所未入力",
    confirmApprove: (name: string) => `${name} の管理者申請を承認しますか？`,
    promptReject: "却下理由を入力してください。",
    defaultRejectReason: "証明書類の確認が必要です。",
    lang: "言語",
  },
};

type Lang = "ko" | "en" | "ja";

export default function MasterApplications() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    return (sessionStorage.getItem("master_lang") as Lang) || "ko";
  });
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const master = JSON.parse(sessionStorage.getItem("user") || "{}");
  const t = translations[lang];

  // 다크모드 색상
  const pageBg   = isDark ? BG_DARK    : BG;
  const cardBg   = isDark ? "#2c2c2e"  : "#fff";
  const cardBorder = isDark ? "#3a3a3c" : "#d4eabc";
  const textMain = isDark ? "#fff"     : "#1a1a1a";
  const textSub  = isDark ? "#aaa"     : "#606060";
  const pillBg   = isDark ? "#3a3a3c"  : "#F2F5EB";
  const pillBorder = isDark ? "#505050" : "#d4eabc";
  const pillColor = isDark ? "#ccc"    : "#3d6b3d";
  const btnBg    = isDark ? "#2c2c2e"  : "#fff";
  const btnBorder = isDark ? "#3a3a3c" : BORDER_GREEN;
  const btnColor = isDark ? "#4cd964"  : DARK_GREEN;
  const langWrapBg = isDark ? "#2c2c2e" : "#fff";

  const handleLangChange = (l: Lang) => {
    setLang(l);
    sessionStorage.setItem("master_lang", l);
  };

  const loadApplications = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await getAdminApplicationsAPI("PENDING");
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (application: AdminApplication) => {
    if (!confirm(t.confirmApprove(application.store_name))) return;
    await approveAdminApplicationAPI(application.id, master.id);
    await loadApplications();
  };

  const handleReject = async (application: AdminApplication) => {
    const reason = prompt(t.promptReject, t.defaultRejectReason);
    if (reason === null) return;
    await rejectAdminApplicationAPI(application.id, reason, master.id);
    await loadApplications();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    location.href = "/auth/login";
  };

  return (
    <>
      <style>{`html, body { background: ${pageBg} !important; margin: 0; padding: 0; min-height: 100%; }`}</style>
      <main style={{ minHeight: "100vh", background: pageBg, fontFamily: FONT, padding: "32px 24px" }}>
        <section style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* Header */}
          <header style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...logoBoxStyle, background: isDark ? "#2c2c2e" : LIGHT_GREEN, border: `1.5px solid ${isDark ? "#3a3a3c" : BORDER_GREEN}` }}>
                  <ShieldCheck size={20} color={GREEN} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 2, textTransform: "uppercase" }}>
                    {t.master}
                  </div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: textMain }}>
                    {t.title}
                  </h1>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* 언어 선택 */}
                <div style={{ ...langToggleWrapStyle, background: langWrapBg, border: `1.5px solid ${btnBorder}` }}>
                  {(["ko", "en", "ja"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => handleLangChange(l)}
                      style={{
                        ...langToggleBtnStyle,
                        borderRight: `1px solid ${btnBorder}`,
                        background: lang === l ? GREEN : "transparent",
                        color: lang === l ? "#fff" : btnColor,
                        fontWeight: lang === l ? 800 : 600,
                      }}
                    >
                      {l === "ko" ? "한" : l === "en" ? "EN" : "日"}
                    </button>
                  ))}
                </div>
                <button onClick={loadApplications} style={{ ...outlineBtnStyle, background: btnBg, border: `1.5px solid ${btnBorder}`, color: btnColor }}>
                  <RefreshCw size={14} />
                  {t.refresh}
                </button>
                <button onClick={handleLogout} style={{
                  ...redBtnStyle,
                  background: isDark ? "transparent" : "#fff1f2",
                  border: isDark ? "1.5px solid rgba(220,38,38,0.35)" : "1.5px solid #fca5a5",
                  fontWeight: isDark ? 700 : 800,
                }}>
                  <LogOut size={14} />
                  {t.logout}
                </button>
              </div>
            </div>
            <p style={{ margin: "10px 0 0 0", fontSize: 13, color: textSub, fontWeight: 600 }}>
              {t.subtitle}
            </p>
          </header>

          {hasError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontWeight: 700, fontSize: 13 }}>
              {t.error}
            </div>
          )}

          {/* Badge */}
          {!loading && applications.length > 0 && (
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: GREEN, color: "#fff", borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 800 }}>
                {t.pending} {applications.length}{t.count}
              </span>
            </div>
          )}

          {/* List */}
          <div style={{ display: "grid", gap: 12 }}>
            {loading ? (
              <div style={{ ...emptyStyle, background: cardBg, border: `1.5px solid ${cardBorder}`, color: textSub }}>{t.loading}</div>
            ) : applications.length === 0 ? (
              <div style={{ ...emptyStyle, background: cardBg, border: `1.5px solid ${cardBorder}`, color: textSub }}>
                <ShieldCheck size={32} color={GREEN} style={{ marginBottom: 10, opacity: 0.5 }} />
                <div>{t.empty}</div>
              </div>
            ) : (
              applications.map((application) => (
                <article key={application.id} style={{ ...cardStyle, background: cardBg, border: `1.5px solid ${cardBorder}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ ...iconBoxStyle, background: isDark ? "#3a3a3c" : LIGHT_GREEN, border: `1.5px solid ${isDark ? "#505050" : "#b7dfa0"}` }}>
                      <Store size={20} color={GREEN} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textMain }}>
                        {application.store_name}
                      </h2>
                      <p style={{ margin: "4px 0 10px", fontSize: 12, color: textSub, fontWeight: 600 }}>
                        {application.store_address || t.noAddress}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ ...pillStyle, background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>{t.applicant}: {application.user_name || application.username}</span>
                        <span style={{ ...pillStyle, background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>{t.phone}: {application.phone || "-"}</span>
                        <span style={{ ...pillStyle, background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>{t.bizType}: {application.store_type || "OTHER"}</span>
                        <span style={{ ...pillStyle, background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>{t.bizNumber}: {application.business_number || "-"}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleApprove(application)} style={approveBtnStyle}>
                        <CheckCircle size={14} />
                        {t.approve}
                      </button>
                      <button onClick={() => handleReject(application)} style={rejectBtnStyle}>
                        <XCircle size={14} />
                        {t.reject}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* 하단 다크모드 토글 */}
          <div style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: `1px solid ${isDark ? "#3a3a3c" : "#d4eabc"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: textSub }}>
              {lang === "ko" ? "다크 모드" : lang === "en" ? "Dark Mode" : "ダークモード"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SunIcon color={GREEN} />
              <Switch
                checked={isDark}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                className="data-[state=checked]:bg-[#00A200]"
              />
              <MoonIcon color={GREEN} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const logoBoxStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: LIGHT_GREEN,
  border: `1.5px solid ${BORDER_GREEN}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const langToggleWrapStyle: CSSProperties = {
  display: "flex",
  background: "#fff",
  border: `1.5px solid ${BORDER_GREEN}`,
  borderRadius: 10,
  overflow: "hidden",
};

const langToggleBtnStyle: CSSProperties = {
  border: "none",
  borderRight: `1px solid ${BORDER_GREEN}`,
  padding: "8px 13px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: FONT,
  transition: "background 0.15s, color 0.15s",
  letterSpacing: 0.3,
};

const outlineBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: `1.5px solid ${BORDER_GREEN}`,
  background: "#fff",
  color: DARK_GREEN,
  borderRadius: 10,
  padding: "8px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
};

const redBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1.5px solid #fca5a5",
  background: "#fff1f2",
  color: "#dc2626",
  borderRadius: 10,
  padding: "8px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1.5px solid #d4eabc",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 2px 12px rgba(0, 162, 0, 0.07)",
};

const emptyStyle: CSSProperties = {
  background: "#fff",
  border: "1.5px solid #d4eabc",
  borderRadius: 16,
  padding: 40,
  color: "#606060",
  fontWeight: 700,
  fontSize: 14,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const iconBoxStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: LIGHT_GREEN,
  border: "1.5px solid #b7dfa0",
  flexShrink: 0,
};

const pillStyle: CSSProperties = {
  borderRadius: 999,
  background: "#F2F5EB",
  border: "1px solid #d4eabc",
  color: "#3d6b3d",
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 700,
};

const approveBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: GREEN,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "8px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
};

const rejectBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "transparent",
  color: "#dc2626",
  border: "1.5px solid rgba(220, 38, 38, 0.35)",
  borderRadius: 10,
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
};

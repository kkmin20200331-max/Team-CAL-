import { useState, useRef } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { X, Camera, LogOut, MapPin, User, Pencil } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import LineLoginButton from "../auth/LineLoginButton";
function SunIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.1565 14.4456C20.1565 11.2915 17.5996 8.73453 14.4455 8.73453C11.2914 8.73453 8.73446 11.2914 8.73446 14.4456C8.73447 17.5997 11.2914 20.1565 14.4455 20.1565C17.5996 20.1565 20.1565 17.5997 20.1565 14.4456ZM22.1721 14.4456C22.1721 18.7129 18.7128 22.1722 14.4455 22.1722C10.1782 22.1722 6.71882 18.7129 6.71881 14.4456C6.71881 10.1782 10.1782 6.71887 14.4455 6.71887C18.7128 6.71888 22.1721 10.1782 22.1721 14.4456Z"
        fill={color}
      />
      <path
        d="M13.4377 3.69538V1.00783C13.4377 0.451219 13.8889 0 14.4455 0C15.0021 0 15.4533 0.451219 15.4533 1.00783V3.69538C15.4533 4.25198 15.0021 4.7032 14.4455 4.7032C13.8889 4.7032 13.4377 4.25198 13.4377 3.69538Z"
        fill={color}
      />
      <path
        d="M13.4377 27.8832V25.1957C13.4377 24.6391 13.8889 24.1879 14.4455 24.1879C15.0021 24.1879 15.4533 24.6391 15.4533 25.1957V27.8832C15.4533 28.4398 15.0021 28.8911 14.4455 28.8911C13.8889 28.8911 13.4377 28.4398 13.4377 27.8832Z"
        fill={color}
      />
      <path
        d="M3.69538 13.4377C4.25198 13.4377 4.7032 13.8889 4.7032 14.4455C4.7032 15.0021 4.25198 15.4533 3.69538 15.4533H1.00783C0.451219 15.4533 0 15.0021 0 14.4455C0 13.8889 0.451219 13.4377 1.00783 13.4377H3.69538Z"
        fill={color}
      />
      <path
        d="M27.8832 13.4377C28.4398 13.4377 28.8911 13.8889 28.8911 14.4455C28.8911 15.0021 28.4398 15.4533 27.8832 15.4533H25.1957C24.6391 15.4533 24.1879 15.0021 24.1879 14.4455C24.1879 13.8889 24.6391 13.4377 25.1957 13.4377H27.8832Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M24.2171 3.25079C24.6278 2.87521 25.2653 2.90374 25.6409 3.31453C26.0165 3.72531 25.988 4.36278 25.5772 4.73836L22.5913 7.46835C22.1805 7.84392 21.5431 7.81539 21.1675 7.40461C20.7919 6.99382 20.8204 6.35633 21.2312 5.98074L24.2171 3.25079Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M3.25012 3.31453C3.6257 2.90374 4.26316 2.87521 4.67395 3.25079L7.65983 5.98074C8.07062 6.35632 8.09915 6.99382 7.72357 7.40461C7.34798 7.81539 6.71049 7.84393 6.2997 7.46835L3.31386 4.73836C2.90307 4.36277 2.87454 3.72532 3.25012 3.31453Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M6.26737 21.1984C6.66095 20.8049 7.29907 20.8049 7.69265 21.1984C8.08623 21.592 8.08623 22.2302 7.69265 22.6237L4.70649 25.6098C4.31291 26.0034 3.67479 26.0034 3.28121 25.6098C2.88763 25.2163 2.88763 24.5781 3.28121 24.1846L6.26737 21.1984Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M21.1987 21.1976C21.5923 20.8041 22.2304 20.8041 22.624 21.1977L25.6098 24.1838C26.0034 24.5774 26.0033 25.2155 25.6097 25.6091C25.2161 26.0026 24.578 26.0026 24.1845 25.609L21.1986 22.6229C20.805 22.2293 20.8051 21.5912 21.1987 21.1976Z"
        fill={color}
      />
    </svg>
  );
}
function MoonIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.898 13.9496C27.898 21.6533 21.6527 27.8986 13.949 27.8986C12.325 27.8986 10.7658 27.621 9.31634 27.1109C8.70609 25.6344 8.36938 24.016 8.36938 22.319C8.36938 19.2206 9.49182 16.3844 11.3522 14.1948C12.9865 16.5739 15.7267 18.1343 18.8311 18.1343C22.1252 18.1343 25.009 16.3775 26.5968 13.7498C26.9306 13.1974 27.898 13.3041 27.898 13.9496Z"
        fill={color}
      />
      <path
        d="M0 13.949C0 20.0288 3.88971 25.2001 9.31636 27.1103C8.70611 25.6338 8.36941 24.0155 8.36941 22.3184C8.36941 19.2201 9.49184 16.3838 11.3523 14.1942C10.3505 12.7359 9.76431 10.9698 9.76431 9.06686C9.76431 5.77273 11.521 2.88891 14.1488 1.30111C14.7011 0.967322 14.5944 0 13.949 0C6.24518 0 0 6.24518 0 13.949Z"
        fill={color}
      />
    </svg>
  );
}
import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const LIGHT_GREEN = "#E6F5C8";

export default function EmployeeProfilePanel() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const language = useLanguage();
  const t = translations.employeeProfilePanel[language];

  const changeLanguage = (lang: "ko" | "en" | "ja") => {
    sessionStorage.setItem("app-language", lang);
    window.dispatchEvent(
      new CustomEvent("app-language-change", { detail: lang }),
    );
  };

  const panelBg = isDark ? "#1c1c1e" : "#fff";
  const headerBg = isDark ? "#1c1c1e" : "#fff";
  const textMain = isDark ? "#fff" : "#111";
  const textSub = isDark ? "#aaa" : "#555";
  const divider = isDark ? "#3a3a3c" : LIGHT_GREEN;
  const closeBg = isDark ? "#2c2c2e" : LIGHT_GREEN;
  const closeIcon = isDark ? "#aaa" : DARK_GREEN;
  const logoutBg = isDark ? "#2c2c2e" : "#f5f5f5";
  const logoutHov = isDark ? "#3a3a3c" : "#ebebeb";
  const logoutTxt = isDark ? "#ccc" : "#555";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const storeName = sessionStorage.getItem("store_name") || "";

  const [profileImage, setProfileImage] = useState<string>(
    () => currentUser?.profile_image || sessionStorage.getItem("employee_profile_image") || "",
  );
  const [open, setOpen] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post(
        `/users/${currentUser.id}/profile-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const url = response.data?.profile_image;
      setProfileImage(url);
      const updatedUser = { ...currentUser, profile_image: url };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('프로필 이미지 업로드 실패:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("store_id");
    sessionStorage.removeItem("store_name");
    navigate("/");
  };

  return (
    <>
      {/* 아바타 버튼 */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "relative",
          borderRadius: "50%",
          border: `3px solid ${LIGHT_GREEN}`,
          width: 64,
          height: 64,
          overflow: "hidden",
          background: "#80D180",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="profile"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {currentUser?.name?.[0] ?? <User />}
          </span>
        )}
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.35)",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드 패널 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: 380,
          background: panelBg,
          zIndex: 50,
          boxShadow: "-4px 0 32px rgba(0,0,0,0.24)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: `2.5px solid ${GREEN}`,
            background: headerBg,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 18, color: GREEN }}>
            {t.myProfile}
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: closeBg,
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: 16, height: 16, color: closeIcon }} />
          </button>
        </div>

        {/* 본문 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* 프로필 사진 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: `4px solid ${LIGHT_GREEN}`,
                  background: "#80D180",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 34, fontWeight: 800, color: "#fff" }}
                  >
                    {currentUser?.name?.[0] ?? "?"}
                  </span>
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: DARK_GREEN,
                  border: `2.5px solid ${panelBg}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera style={{ width: 13, height: 13, color: "#fff" }} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            <p style={{ fontSize: 12, color: "#aaa" }}>{t.changePhoto}</p>
          </div>

          {/* 이름 / 역할 */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: textMain }}>
              {currentUser?.name || t.employee}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: "5px 16px",
                borderRadius: 20,
                background: isDark ? "#2c3e2c" : LIGHT_GREEN,
                color: isDark ? "#4cd964" : DARK_GREEN,
              }}
            >
              {currentUser?.role || t.employee}
            </span>
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: `1px solid ${divider}` }} />

          {/* 매장 */}
          {storeName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MapPin
                style={{
                  width: 16,
                  height: 16,
                  color: "#5a8a5c",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: textSub }}>{storeName}</span>
            </div>
          )}

          {/* 회원정보 수정 버튼 */}
          <button
            onClick={() => {
              setOpen(false);
              navigate("/employee/edit-profile");
            }}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK_GREEN} 100%)`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 12px rgba(24,160,34,0.25)",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Pencil style={{ width: 16, height: 16 }} />
            {t.editProfile}
          </button>
        </div>
        {/* 라인 연동 */}
        <LineLoginButton />
        {/* 하단 */}
        <div
          style={{
            padding: "16px 28px 28px",
            borderTop: `1px solid ${divider}`,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* 다크모드 토글 — 로그인과 동일한 Switch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: logoutTxt }}>
              {language === "ko"
                ? "다크 모드"
                : language === "en"
                  ? "Dark Mode"
                  : "ダークモード"}
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

          {/* 언어 선택 — 작은 pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: logoutTxt }}>
              {language === "ko"
                ? "언어"
                : language === "en"
                  ? "Language"
                  : "言語"}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {(["ko", "en", "ja"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: language === lang ? GREEN : logoutBg,
                    color: language === lang ? "#fff" : logoutTxt,
                  }}
                >
                  {lang === "ko" ? "한" : lang === "en" ? "EN" : "日"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: logoutBg,
              color: logoutTxt,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = logoutHov)}
            onMouseOut={(e) => (e.currentTarget.style.background = logoutBg)}
          >
            <LogOut style={{ width: 16, height: 16, color: "#e03434" }} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </>
  );
}

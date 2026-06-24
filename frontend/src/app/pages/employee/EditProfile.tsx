import axiosInstance from "../../../lib/axiosInstance";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PasswordInput from '../../components/PasswordInput';
import { Camera, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';


const fontMap: Record<string, string> = {
  ko: "'Noto Sans KR', sans-serif",
  en: "'Leferi', 'Noto Sans KR', sans-serif",
  ja: "'Noto Sans JP', sans-serif",
};

/* ── 비밀번호 강도 (Signup.tsx 동일 로직) ── */
function getStrength(pw: string): 'weak' | 'medium' | 'strong' | null {
  if (!pw) return null;
  const u = /[A-Z]/.test(pw);
  const s = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  const l = pw.length >= 8;
  if (l && u && s) return 'strong';
  if (l && (u || s)) return 'medium';
  return 'weak';
}

export default function EditProfile() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t        = translations.employeeProfilePanel[language];
  const font     = fontMap[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
  });

  // 비밀번호 dots 가시성: HTML color-scheme을 테마에 맞게 설정
  useEffect(() => {
    const prev = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    return () => { document.documentElement.style.colorScheme = prev; };
  }, [isDark]);

  const [profileImage, setProfileImage] = useState<string>(
    () => sessionStorage.getItem('profile_image') || ''
  );

  const [formName,       setFormName]       = useState(currentUser?.name     || '');
  const [formUsername,   setFormUsername]   = useState(currentUser?.username || '');
  const existingPhone = currentUser?.phone || '';
  const splitPhone = (p: string) => [p.slice(0,3), p.slice(3,7), p.slice(7,11)];
  const [p1, p2, p3] = splitPhone(existingPhone.replace(/-/g, ''));
  const [phone1, setPhone1] = useState(p1);
  const [phone2, setPhone2] = useState(p2);
  const [phone3, setPhone3] = useState(p3);
  const formPhone = `${phone1}${phone2}${phone3}`;
  const [formCurrentPw,  setFormCurrentPw]  = useState('');  // 현재 비밀번호
  const [formPw,         setFormPw]         = useState('');  // 새 비밀번호
  const [formPwConf,     setFormPwConf]     = useState('');
  const [saving,         setSaving]         = useState(false);
  const [savedFlash,     setSavedFlash]     = useState(false);
  const [errMsg,         setErrMsg]         = useState('');

  // 이름 중복확인
  const [nameChecked,  setNameChecked]  = useState(true);
  const [nameCheckMsg, setNameCheckMsg] = useState('');
  const [nameCheckOk,  setNameCheckOk]  = useState<boolean | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  const bgColor    = isDark ? '#1c1c1e' : '#EEF5DD';
  const cardBg     = isDark ? '#2c2c2e' : '#FFFFFF';
  const labelColor = isDark ? '#aaa'    : '#606060';
  const inputBg    = isDark ? '#3a3a3c' : '#F2F5EB';
  const inputTxt   = isDark ? '#fff'    : '#333';
  const pwShadow   = `0 0 0 ${inputTxt}`;

  const strength = getStrength(formPw);
  const strengthLabel = {
    ko: { weak: '약함', medium: '보통', strong: '강함' },
    en: { weak: 'Weak', medium: 'Fair', strong: 'Strong' },
    ja: { weak: '弱い', medium: '普通', strong: '強い' },
  }[language];
  const strengthColor = strength === 'strong' ? '#16a34a' : strength === 'medium' ? '#f59e0b' : '#ef4444';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      sessionStorage.setItem('profile_image', base64);
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (val === currentUser?.name) {
      setNameChecked(true); setNameCheckOk(null); setNameCheckMsg('');
    } else {
      setNameChecked(false); setNameCheckOk(null); setNameCheckMsg('');
    }
  };

  const handleCheckName = async () => {
    if (!formName.trim()) return;
    setCheckingName(true); setNameCheckMsg('');
    try {
      await axiosInstance.get('/users/check-nickname', { params: { nickname: formName } });
      setNameCheckOk(true); setNameChecked(true); setNameCheckMsg(t.nameAvailable);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setNameCheckOk(false); setNameChecked(false); setNameCheckMsg(t.nameTaken);
      } else {
        setNameCheckOk(null); setNameCheckMsg(t.errCheckName);
      }
    } finally {
      setCheckingName(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');

    // 이름이 바뀐 경우에만 중복확인 필요
    if (formName !== currentUser?.name && !nameChecked) {
      setErrMsg(t.nameNotChecked); return;
    }

    // 현재 비밀번호는 항상 필요 (백엔드 PUT이 password 필드 요구)
    if (!formCurrentPw) {
      setErrMsg(t.currentPasswordPlaceholder); return;
    }

    // 현재 비밀번호 검증
    try {
      await axiosInstance.post('/users/login', { username: currentUser.username, password: formCurrentPw });
    } catch {
      setErrMsg(t.errCurrentPassword); return;
    }

    // 새 비밀번호 유효성
    if (formPw) {
      if (getStrength(formPw) !== 'strong') { setErrMsg((t as any).errPasswordWeak); return; }
      if (formPw !== formPwConf) { setErrMsg(t.errPasswordMismatch); return; }
    }

    setSaving(true);
    try {
      const body: Record<string, any> = {
        id:       currentUser.id,
        username: formUsername || currentUser.username,
        name:     formName,
        phone:    formPhone || existingPhone,
        role:     currentUser.role,
        status:   currentUser.status,
        // 새 비밀번호가 있으면 새 것, 없으면 현재 비밀번호로 유지
        password: formPw || formCurrentPw,
      };

      await axiosInstance.put('/users', body);

      const savedProfileImage = sessionStorage.getItem('profile_image') || currentUser.profile_image || '';
      const updated = { ...currentUser, name: formName, phone: formPhone, username: formUsername || currentUser.username, profile_image: savedProfileImage };
      sessionStorage.setItem('user', JSON.stringify(updated));

      setSavedFlash(true);
      setTimeout(() => navigate(-1), 1200);
    } catch {
      setErrMsg(t.errSave);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, height: 38,
    background: inputBg,
    boxShadow: 'inset -2px -1px 4px rgba(126,147,126,0.14)',
    borderRadius: 9, border: 'none', outline: 'none',
    padding: '0 14px', fontFamily: font,
    fontWeight: 300, fontSize: 16, color: inputTxt,
    WebkitTextFillColor: inputTxt,
    boxSizing: 'border-box' as const, minWidth: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: font, fontWeight: 300, fontSize: 16,
    color: labelColor, marginBottom: 6, display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, paddingTop: 80, }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{
          background: cardBg,
          borderRadius: 58,
          boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
          padding: '48px 80px 48px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 페이지 제목 */}
          <h1 style={{
            fontFamily: font, fontWeight: 800, fontSize: 26,
            color: '#00A200', textAlign: 'center', marginBottom: 28,
          }}>
            {(t as any).editTitle || t.editProfile}
          </h1>

          {/* 프로필 사진 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%',
                background: '#80D180', overflow: 'hidden',
                border: '5px solid #E6F5C8',
                boxShadow: '0 4px 20px rgba(0,162,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {profileImage
                  ? <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 52, fontWeight: 800, color: '#fff', fontFamily: font }}>{currentUser?.name?.[0] ?? '?'}</span>
                }
              </div>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera style={{ width: 32, height: 32, color: '#fff' }} />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            <p style={{ fontFamily: font, fontSize: 13, color: '#999', marginTop: 12 }}>{t.changePhoto}</p>
          </div>

          <form onSubmit={handleSave}>
            {/* 이름 + 중복확인 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t.name}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={handleCheckName}
                  disabled={checkingName || !formName.trim()}
                  style={{
                    flexShrink: 0, height: 38, padding: '0 14px',
                    borderRadius: 9, border: 'none',
                    background: nameCheckOk === true ? '#18A022' : '#00A200',
                    color: '#fff', fontFamily: font, fontWeight: 600, fontSize: 14,
                    cursor: checkingName || !formName.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap' as const,
                    opacity: !formName.trim() ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {nameCheckOk === true ? <Check style={{ width: 16, height: 16 }} /> : checkingName ? '...' : t.checkDuplicate}
                </button>
              </div>
              {nameCheckMsg && (
                <p style={{ fontSize: 12, marginTop: 5, fontFamily: font, color: nameCheckOk === true ? '#18A022' : '#e03434' }}>
                  {nameCheckMsg}
                </p>
              )}
            </div>

            {/* 아이디 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{(t as any).username || 'ID'}</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                style={{ ...inputStyle, flex: 'none', width: '100%' }}
              />
            </div>

            {/* 전화번호 — 3칸 분리 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t.phone}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="tel" maxLength={3}
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, flex: '0 0 28%', width: 'auto', textAlign: 'center' }}
                />
                <span style={{ color: '#aaa', flexShrink: 0 }}>-</span>
                <input
                  type="tel" maxLength={4}
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, flex: 1, width: 'auto', textAlign: 'center' }}
                />
                <span style={{ color: '#aaa', flexShrink: 0 }}>-</span>
                <input
                  type="tel" maxLength={4}
                  value={phone3}
                  onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, flex: 1, width: 'auto', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* 현재 비밀번호 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t.currentPassword}</label>
              <PasswordInput
                value={formCurrentPw}
                onChange={setFormCurrentPw}
                placeholder={t.currentPasswordPlaceholder}
                autoComplete="current-password"
                style={{ ...inputStyle, flex: 'none', width: '100%' }}
              />
            </div>

            {/* 새 비밀번호 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t.newPassword}</label>
              <PasswordInput
                value={formPw}
                onChange={setFormPw}
                placeholder={t.passwordPlaceholder}
                autoComplete="new-password"
                style={{ ...inputStyle, flex: 'none', width: '100%' }}
              />
            </div>

            {/* 강도 바 — 사인업과 동일 */}
            {formPw && strength && (
              <div style={{ marginTop: -12, marginBottom: 20 }}>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'all 0.4s',
                    width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%',
                    background: strength === 'strong' ? '#22c55e' : '#ef4444',
                  }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 3, fontFamily: font, color: strength === 'strong' ? '#16a34a' : '#ef4444' }}>
                  {strength === 'strong' ? strengthLabel?.strong : strengthLabel?.weak}
                </div>
              </div>
            )}

            {/* 비밀번호 확인 */}
            {formPw && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t.confirmPassword}</label>
                <PasswordInput
                  value={formPwConf}
                  onChange={setFormPwConf}
                  autoComplete="new-password"
                  style={{
                    ...inputStyle, flex: 'none', width: '100%',
                    boxShadow: formPwConf && formPw !== formPwConf
                      ? 'inset -2px -1px 4px rgba(185,28,28,0.2)'
                      : 'inset -2px -1px 4px rgba(126,147,126,0.14)',
                    border: formPwConf && formPw !== formPwConf ? '1px solid #B91C1C' : 'none',
                  }}
                />
              </div>
            )}

            {/* 에러 */}
            {errMsg && (
              <div style={{ color: '#e03434', fontSize: 13, textAlign: 'center', marginBottom: 14, fontFamily: font }}>
                {errMsg}
              </div>
            )}

            {/* 저장 */}
            <button
              type="submit"
              disabled={saving || savedFlash}
              style={{
                width: '100%', height: 67,
                background: savedFlash ? '#18A022' : '#00A200',
                borderRadius: 9, border: 'none',
                color: '#fff', fontFamily: font, fontWeight: 700, fontSize: 18,
                cursor: saving ? 'not-allowed' : 'pointer',
                marginBottom: 14, transition: 'opacity 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseOver={(e) => { if (!saving) e.currentTarget.style.opacity = '0.88'; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {savedFlash ? <><Check style={{ width: 20, height: 20 }} />{t.saved}</> : saving ? t.saving : t.save}
            </button>

            {/* 취소 */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: '100%', height: 67,
                background: '#F2F5EB', borderRadius: 9, border: 'none',
                color: '#00A200', fontFamily: font, fontWeight: 700, fontSize: 18,
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {t.cancel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

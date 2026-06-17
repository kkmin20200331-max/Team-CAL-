import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { signupAPI } from "../../components/api/auth";

const BG = '#EEF5DD';
const GREEN = '#00A200';
const INPUT_BG = '#F2F5EB';
const LABEL_COLOR = '#606060';
const PLACEHOLDER_COLOR = '#B7B4B4';

const INPUT_SHADOW = "inset -2px -1px 4px rgba(126, 147, 126, 0.15)";

const translations = {
    ko: {
        bannerStep1: '기본 정보 입력 (1/2)',
        bannerStep2Admin: '매장 정보 입력 (2/2)',
        bannerStep2Emp: '근무지 선택 (2/2)',
        nickname: '이름 (닉네임)',
        phone: '전화번호',
        username: '아이디',
        password: '비밀번호',
        confirmPassword: '비밀번호 확인',
        checkDuplicate: '중복 확인',
        role: '가입 유형',
        admin: '관리자 (사장님)',
        employee: '직원 (알바생)',
        next: '다음으로 ＞',
        prev: '이전',
        signup: '회원가입 완료',
        backToLogin: '이미 계정이 있으신가요? 로그인',
        brandName: '브랜드명 (가게명)',
        branchName: '지점명',
        isFranchise: '프랜차이저 (체인 매장)인가요?',
        openTime: '오픈 시간',
        closeTime: '마감 시간',
        maxCapacity: '최대 수용 인원 (명)',
        selectStore: '근무할 매장 선택',
        errorEmpty: '모든 항목을 입력해주세요.',
        errorCheckNickname: '닉네임 중복 확인을 해주세요.',
        errorCheckUsername: '아이디 중복 확인을 해주세요.',
        errorMatch: '비밀번호가 일치하지 않습니다.',
        errorPasswordWeak: '비밀번호는 대문자와 특수문자를 최소 1개 이상 포함해야 합니다.',
        errorDuplicate: '이미 존재하는 아이디입니다.',
        errorServer: '서버 오류가 발생했습니다.',
        successAlert: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.',
        strong: '강함', weak: '약함',
        loadingStores: '매장 목록을 불러오는 중...',
        storePlaceholder: '매장을 선택하세요',
    },
    en: {
        bannerStep1: 'Basic Information (1/2)',
        bannerStep2Admin: 'Store Information (2/2)',
        bannerStep2Emp: 'Select Workplace (2/2)',
        nickname: 'Name (Nickname)',
        phone: 'Phone Number',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        checkDuplicate: 'Check',
        role: 'Account Type',
        admin: 'Admin (Manager)',
        employee: 'Employee (Staff)',
        next: 'Next ＞',
        prev: 'Back',
        signup: 'Complete Sign Up',
        backToLogin: 'Already have an account? Login',
        brandName: 'Brand Name',
        branchName: 'Branch Name',
        isFranchise: 'Is this a franchise store?',
        openTime: 'Opening Time',
        closeTime: 'Closing Time',
        maxCapacity: 'Max Capacity',
        selectStore: 'Select Workplace',
        errorEmpty: 'Please fill in all fields.',
        errorCheckNickname: 'Please check nickname availability.',
        errorCheckUsername: 'Please check username availability.',
        errorMatch: 'Passwords do not match.',
        errorPasswordWeak: 'Password must include at least one uppercase letter and one special character.',
        errorDuplicate: 'This username is already taken.',
        errorServer: 'Server error occurred.',
        successAlert: 'Registration complete! Moving to login page.',
        strong: 'Strong', weak: 'Weak',
        loadingStores: 'Loading stores...',
        storePlaceholder: 'Select a store',
    },
    ja: {
        bannerStep1: '基本情報の入力 (1/2)',
        bannerStep2Admin: '店舗情報の入力 (2/2)',
        bannerStep2Emp: '勤務地の選択 (2/2)',
        nickname: '名前（ニックネーム）',
        phone: '電話番号',
        username: '会員ID',
        password: 'パスワード',
        confirmPassword: 'パスワード確認',
        checkDuplicate: '重複確認',
        role: 'アカウントタイプ',
        admin: '管理者 (店舗主)',
        employee: '従業員（パートタイマー）',
        next: '次へ進む',
        prev: '戻る',
        signup: '登録完了',
        backToLogin: 'すでにアカウントをお持ちですか？ログイン',
        brandName: 'ブランド名 (店舗名)',
        branchName: '店舗名 (支店)',
        isFranchise: 'フランチャイズ店舗ですか？',
        openTime: '開店時間',
        closeTime: '閉店時間',
        maxCapacity: '最大収容人数 (人)',
        selectStore: '勤務店舗を選択',
        errorEmpty: 'すべての項目を入力してください。',
        errorCheckNickname: 'ニックネームの重複確認をしてください。',
        errorCheckUsername: '会員IDの重複確認をしてください。',
        errorMatch: 'パスワードが一致しません。',
        errorPasswordWeak: 'パスワードには大文字と特殊文字を最低1つずつ含める必要があります。',
        errorDuplicate: '既に存在するユーザー名です。',
        errorServer: 'サーバーエラーが発生しました。',
        successAlert: '会員登録が完了しました！ログインページに移動します。',
        strong: '強い', weak: '弱い',
        loadingStores: '店舗リストを読み込み中...',
        storePlaceholder: '店舗を選択してください',
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

type NicknameStatus = 'idle' | 'ok' | 'error';

function Field({ label, children, style, font }: { label: string; children: React.ReactNode; style?: React.CSSProperties; font: string }) {
    return (
        <div style={{ marginBottom: 18, ...style }}>
            <div style={{ fontFamily: font, fontWeight: 300, fontSize: 15, color: LABEL_COLOR, marginBottom: 7, display: 'block' }}>{label}</div>
            {children}
        </div>
    );
}

export default function Signup() {
  const navigate = useNavigate();
  const [language] = useState(
    () => sessionStorage.getItem("app-language") || "ko",
  );
  const [step, setStep] = useState(1);

    const [role, setRole] = useState('employee');
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
    const [nicknameChecking, setNicknameChecking] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<NicknameStatus>('idle');
    const [usernameChecking, setUsernameChecking] = useState(false);

  const [isFranchise, setIsFranchise] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [maxCapacity, setMaxCapacity] = useState("");

  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

    const t = translations[language as keyof typeof translations];
    const font = fontMap[language];

    const inputStyle: React.CSSProperties = {
        height: 37.53, background: INPUT_BG, boxShadow: INPUT_SHADOW, borderRadius: 9,
        border: 'none', outline: 'none', padding: '0 14px', fontFamily: font,
        fontWeight: 300, fontSize: 15, color: '#333', boxSizing: 'border-box', width: '100%',
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: font, fontWeight: 300, fontSize: 15, color: LABEL_COLOR, marginBottom: 7, display: 'block',
    };

  useEffect(() => {
    if (role === "employee") {
      axios
        .get("http://localhost:8080/api/store/all")
        .then((res) => setStores(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [role]);

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    setNicknameStatus("idle");
  };

    const handleCheckNickname = async () => {
        if (!nickname.trim()) { setErrorMsg(t.errorEmpty); return; }
        setErrorMsg('');
        setNicknameChecking(true);
        try {
            await axios.get('http://localhost:8080/api/users/check-nickname', { params: { nickname } });
            setNicknameStatus('ok');
        } catch (err: any) {
            if (err.response?.status === 409) {
                setNicknameStatus('error');
            } else {
                // 네트워크 오류 등 예상치 못한 에러
                setErrorMsg(t.errorServer);
                setNicknameStatus('idle');
            }
        } finally {
            setNicknameChecking(false);
        }
    };

    const handleUsernameChange = (val: string) => {
        setUsername(val);
        setUsernameStatus('idle');
    };

    const handleCheckUsername = async () => {
        if (!username.trim()) { setErrorMsg(t.errorEmpty); return; }
        setErrorMsg('');
        setUsernameChecking(true);
        try {
            await axios.get('http://localhost:8080/api/users/check-username', { params: { username } });
            setUsernameStatus('ok');
        } catch (err: any) {
            if (err.response?.status === 409) {
                setUsernameStatus('error');
            } else {
                setErrorMsg(t.errorServer);
                setUsernameStatus('idle');
            }
        } finally {
            setUsernameChecking(false);
        }
    };

    const getStrength = (pw: string) => {
        if (!pw) return null;
        const u = /[A-Z]/.test(pw), s = /[!@#$%^&*(),.?":{}|<>]/.test(pw), l = pw.length >= 8;
        if (l && u && s) return 'strong';
        if (l && (u || s)) return 'medium';
        return 'weak';
    };
    const strength = getStrength(password);

    const handleNextStep = () => {
        setErrorMsg('');
        if (!username || !nickname || !phone || !password || !confirmPassword) { setErrorMsg(t.errorEmpty); return; }
        if (nicknameStatus !== 'ok') { setErrorMsg(t.errorCheckNickname); return; }
        if (usernameStatus !== 'ok') { setErrorMsg(t.errorCheckUsername); return; }
        if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(password)) { setErrorMsg(t.errorPasswordWeak); return; }
        if (password !== confirmPassword) { setErrorMsg(t.errorMatch); return; }
        setStep(2);
    };

  const handleFinalSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (role === "admin") {
      if (!brandName || (isFranchise && !branchName) || !maxCapacity) {
        setErrorMsg(t.errorEmpty);
        return;
      }
    } else {
      if (!selectedStoreId) {
        setErrorMsg(t.errorEmpty);
        return;
      }
    }
    try {
      const res = await signupAPI({
        username,
        password,
        name: nickname,
        phone,
        role: role === "admin" ? "ADMIN" : "STAFF",
        ...(role === "admin"
          ? {
              brandName,
              branchName: isFranchise ? branchName : null,
              openTime,
              closeTime,
              maxCapacity: Number(maxCapacity),
            }
          : {}),
      });
      if (role === "employee") {
        await axios.post("http://localhost:8080/api/store_member", {
          id: "SM_" + Date.now(),
          store_id: selectedStoreId,
          user_id: res.data.id,
        });
      }
      alert(t.successAlert);
      navigate("/auth/login");
    } catch (err: any) {
      setErrorMsg(
        err.response?.status === 409 ? t.errorDuplicate : t.errorServer,
      );
    }
  };

  const bannerText =
    step === 1
      ? t.bannerStep1
      : role === "admin"
        ? t.bannerStep2Admin
        : t.bannerStep2Emp;

    return (
        <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 560, marginTop: 20, marginBottom: 20 }}>
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: 58,
                    boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
                    padding: '48px 80px 48px 80px',
                }}>
                    {/* Logo - 118×83px from Figma */}
                    <div style={{ height: 124, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <img src={logoMap[language]} alt="Baitomate" style={{ width: 145, height: 'auto', objectFit: 'contain' }} />
                    </div>

                    {/* Step banner - 249px wide, pill shape */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <div style={{
                            width: 249,
                            height: 37.53,
                            background: GREEN,
                            borderRadius: 18.77,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: font,
                            fontWeight: 300,
                            fontSize: 15,
                            color: '#FFFFFF',
                        }}>
                            {bannerText}
                        </div>
                    </div>

                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <div>
                            {/* Role */}
                            <Field label={t.role} font={font}>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger style={{
                                        height: 37.53, background: INPUT_BG, border: 'none',
                                        borderRadius: 9, fontSize: 15, color: '#606060',
                                        boxShadow: INPUT_SHADOW,
                                    }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">{t.employee}</SelectItem>
                                        <SelectItem value="admin">{t.admin}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            {/* Nickname + check button */}
                            <div style={{ marginBottom: 18 }}>
                                <div style={labelStyle}>{t.nickname}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => handleNicknameChange(e.target.value)}
                                        placeholder={t.nickname}
                                        style={{ ...inputStyle, flex: 1, width: 'auto' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCheckNickname}
                                        disabled={nicknameChecking}
                                        style={{
                                            width: 102.51, height: 37.53, flexShrink: 0,
                                            background: GREEN, border: 'none', borderRadius: 9,
                                            color: '#fff', fontFamily: font, fontWeight: 300,
                                            fontSize: 14, cursor: 'pointer',
                                            opacity: nicknameChecking ? 0.6 : 1,
                                            boxShadow: INPUT_SHADOW,
                                        }}
                                    >
                                        {nicknameChecking ? '...' : t.checkDuplicate}
                                    </button>
                                    {nicknameStatus === 'ok' && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: '#16a34a',
                                            background: '#f0fdf4', border: '1px solid #86efac',
                                            borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>OK</span>
                                    )}
                                    {nicknameStatus === 'error' && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: '#dc2626',
                                            background: '#fef2f2', border: '1px solid #fca5a5',
                                            borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>Error</span>
                                    )}
                                </div>
                            </div>

                            <Field label={t.phone} font={font}>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="000-0000-0000" style={inputStyle} />
                            </Field>

                            {/* Username + check button */}
                            <div style={{ marginBottom: 18 }}>
                                <div style={labelStyle}>{t.username}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => handleUsernameChange(e.target.value)}
                                        placeholder={t.username}
                                        style={{ ...inputStyle, flex: 1, width: 'auto' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCheckUsername}
                                        disabled={usernameChecking}
                                        style={{
                                            width: 102.51, height: 37.53, flexShrink: 0,
                                            background: GREEN, border: 'none', borderRadius: 9,
                                            color: '#fff', fontFamily: font, fontWeight: 300,
                                            fontSize: 14, cursor: 'pointer',
                                            opacity: usernameChecking ? 0.6 : 1,
                                            boxShadow: INPUT_SHADOW,
                                        }}
                                    >
                                        {usernameChecking ? '...' : t.checkDuplicate}
                                    </button>
                                    {usernameStatus === 'ok' && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: '#16a34a',
                                            background: '#f0fdf4', border: '1px solid #86efac',
                                            borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>OK</span>
                                    )}
                                    {usernameStatus === 'error' && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: '#dc2626',
                                            background: '#fef2f2', border: '1px solid #fca5a5',
                                            borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>Error</span>
                                    )}
                                </div>
                            </div>

                            <Field label={t.password} font={font}>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} style={inputStyle} />
                                {password && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 99, transition: 'all 0.4s',
                                                width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%',
                                                background: strength === 'strong' ? '#22c55e' : strength === 'medium' ? '#f59e0b' : '#ef4444',
                                            }} />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 500, marginTop: 3, color: strength === 'strong' ? '#16a34a' : '#ef4444' }}>
                                            {strength === 'strong' ? t.strong : t.weak}
                                        </div>
                                    </div>
                                )}
                            </Field>

                            <Field label={t.confirmPassword} font={font}>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.confirmPassword} style={inputStyle} />
                            </Field>

                            {errorMsg && <div style={{ color: '#e03434', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{errorMsg}</div>}

                            {/* 次へ進む button - 67px tall, full width */}
                            <button
                                type="button"
                                onClick={handleNextStep}
                                style={{
                                    width: '100%', height: 67.03, background: GREEN, border: 'none',
                                    borderRadius: 9, color: '#fff', fontFamily: font,
                                    fontWeight: 400, fontSize: 18, cursor: 'pointer',
                                    marginBottom: 20, transition: 'opacity 0.15s',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
                                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                                {t.next}
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/auth/login')}
                                    style={{
                                        background: 'none', border: 'none', fontFamily: font,
                                        fontWeight: 400, fontSize: 15, color: GREEN, cursor: 'pointer',
                                    }}
                                >
                                    {t.backToLogin}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <form onSubmit={handleFinalSignUp}>
                            {role === 'admin' && (
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px', background: INPUT_BG, borderRadius: 9,
                                        boxShadow: INPUT_SHADOW, marginBottom: 18,
                                    }}>
                                        <span style={{ ...labelStyle, marginBottom: 0 }}>{t.isFranchise}</span>
                                        <Switch checked={isFranchise} onCheckedChange={setIsFranchise} className="data-[state=checked]:bg-[#00A200]" />
                                    </div>

                                    <Field label={t.brandName} font={font}>
                                        <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                            placeholder={language === 'ko' ? '예: 춘식이네 매장' : language === 'en' ? 'e.g. My Store' : '例: 春日の店'}
                                            style={inputStyle} />
                                    </Field>

                                    <Field label={t.branchName} font={font}>
                                        <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)}
                                            disabled={!isFranchise}
                                            placeholder={isFranchise
                                                ? (language === 'ko' ? '예: 역삼점' : language === 'en' ? 'e.g. Downtown' : '例: 渋谷店')
                                                : (language === 'ko' ? '단독 매장 (입력 불가)' : language === 'en' ? 'N/A' : '入力不可')}
                                            style={{ ...inputStyle, background: isFranchise ? INPUT_BG : '#e8ebe0', cursor: isFranchise ? 'auto' : 'not-allowed', color: isFranchise ? '#333' : PLACEHOLDER_COLOR }} />
                                    </Field>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                        <div>
                                            <div style={labelStyle}>{t.openTime}</div>
                                            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={inputStyle} />
                                        </div>
                                        <div>
                                            <div style={labelStyle}>{t.closeTime}</div>
                                            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>

                                    <Field label={t.maxCapacity} font={font}>
                                        <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="10" min="1" style={inputStyle} />
                                    </Field>
                                </>
                            )}

                            {role === 'employee' && (
                                <Field label={t.selectStore} font={font}>
                                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                        <SelectTrigger style={{ height: 37.53, background: INPUT_BG, border: 'none', borderRadius: 9, fontSize: 15, color: '#333', boxShadow: INPUT_SHADOW }}>
                                            <SelectValue placeholder={t.storePlaceholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.length === 0
                                                ? <SelectItem value="none" disabled>{t.loadingStores}</SelectItem>
                                                : stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )}

                            {errorMsg && <div style={{ color: '#e03434', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{errorMsg}</div>}

                            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setErrorMsg(''); }}
                                    style={{
                                        flex: 1, height: 67.03, background: INPUT_BG, border: 'none',
                                        borderRadius: 9, color: LABEL_COLOR, fontFamily: font,
                                        fontWeight: 300, fontSize: 15, cursor: 'pointer',
                                        boxShadow: INPUT_SHADOW,
                                    }}
                                >
                                    {t.prev}
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 2, height: 67.03, background: GREEN, border: 'none',
                                        borderRadius: 9, color: '#fff', fontFamily: font,
                                        fontWeight: 400, fontSize: 16, cursor: 'pointer',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
                                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                    {t.signup}
                                </button>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/auth/login')}
                                    style={{
                                        background: 'none', border: 'none', fontFamily: font,
                                        fontWeight: 400, fontSize: 15, color: GREEN, cursor: 'pointer',
                                    }}
                                >
                                    {t.backToLogin}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              {/* Role */}
              <Field label={t.role}>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    style={{
                      height: 37.53,
                      background: INPUT_BG,
                      border: "none",
                      borderRadius: 9,
                      fontSize: 15,
                      color: "#606060",
                      boxShadow: INPUT_SHADOW,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{t.employee}</SelectItem>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Nickname + check button */}
              <div style={{ marginBottom: 18 }}>
                <div style={labelStyle}>{t.nickname}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    placeholder={t.nickname}
                    style={{ ...inputStyle, flex: 1, width: "auto" }}
                  />
                  <button
                    type="button"
                    onClick={handleCheckNickname}
                    disabled={nicknameChecking}
                    style={{
                      width: 102.51,
                      height: 37.53,
                      flexShrink: 0,
                      background: GREEN,
                      border: "none",
                      borderRadius: 9,
                      color: "#fff",
                      fontFamily: FONT,
                      fontWeight: 300,
                      fontSize: 14,
                      cursor: "pointer",
                      opacity: nicknameChecking ? 0.6 : 1,
                      boxShadow: INPUT_SHADOW,
                    }}
                  >
                    {nicknameChecking ? "..." : t.checkDuplicate}
                  </button>
                  {nicknameStatus === "ok" && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#16a34a",
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: 6,
                        padding: "3px 8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      OK
                    </span>
                  )}
                  {nicknameStatus === "error" && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: 6,
                        padding: "3px 8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      Error
                    </span>
                  )}
                </div>
              </div>

              <Field label={t.phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="000-0000-0000"
                  style={inputStyle}
                />
              </Field>

              <Field label={t.username}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
                  style={inputStyle}
                />
              </Field>

              <Field label={t.password}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                  style={inputStyle}
                />
                {password && (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        height: 4,
                        background: "#e5e7eb",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 99,
                          transition: "all 0.4s",
                          width:
                            strength === "strong"
                              ? "100%"
                              : strength === "medium"
                                ? "66%"
                                : "33%",
                          background:
                            strength === "strong"
                              ? "#22c55e"
                              : strength === "medium"
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 3,
                        color: strength === "strong" ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {strength === "strong" ? t.strong : t.weak}
                    </div>
                  </div>
                )}
              </Field>

              <Field label={t.confirmPassword}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPassword}
                  style={inputStyle}
                />
              </Field>

              {errorMsg && (
                <div
                  style={{
                    color: "#e03434",
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* 次へ進む button - 67px tall, full width */}
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  width: "100%",
                  height: 67.03,
                  background: GREEN,
                  border: "none",
                  borderRadius: 9,
                  color: "#fff",
                  fontFamily: FONT_CAL,
                  fontWeight: 400,
                  fontSize: 18,
                  cursor: "pointer",
                  marginBottom: 20,
                  transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {t.next}
              </button>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: FONT_CAL,
                    fontWeight: 400,
                    fontSize: 15,
                    color: GREEN,
                    cursor: "pointer",
                  }}
                >
                  {t.backToLogin}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleFinalSignUp}>
              {role === "admin" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: INPUT_BG,
                      borderRadius: 9,
                      boxShadow: INPUT_SHADOW,
                      marginBottom: 18,
                    }}
                  >
                    <span style={{ ...labelStyle, marginBottom: 0 }}>
                      {t.isFranchise}
                    </span>
                    <Switch
                      checked={isFranchise}
                      onCheckedChange={setIsFranchise}
                      className="data-[state=checked]:bg-[#00A200]"
                    />
                  </div>

                  <Field label={t.brandName}>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder={
                        language === "ko"
                          ? "예: 춘식이네 매장"
                          : language === "en"
                            ? "e.g. My Store"
                            : "例: 春日の店"
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <Field label={t.branchName}>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      disabled={!isFranchise}
                      placeholder={
                        isFranchise
                          ? language === "ko"
                            ? "예: 역삼점"
                            : language === "en"
                              ? "e.g. Downtown"
                              : "例: 渋谷店"
                          : language === "ko"
                            ? "단독 매장 (입력 불가)"
                            : language === "en"
                              ? "N/A"
                              : "入力不可"
                      }
                      style={{
                        ...inputStyle,
                        background: isFranchise ? INPUT_BG : "#e8ebe0",
                        cursor: isFranchise ? "auto" : "not-allowed",
                        color: isFranchise ? "#333" : PLACEHOLDER_COLOR,
                      }}
                    />
                  </Field>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div style={labelStyle}>{t.openTime}</div>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <div style={labelStyle}>{t.closeTime}</div>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <Field label={t.maxCapacity}>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      placeholder="10"
                      min="1"
                      style={inputStyle}
                    />
                  </Field>
                </>
              )}

              {role === "employee" && (
                <Field label={t.selectStore}>
                  <Select
                    value={selectedStoreId}
                    onValueChange={setSelectedStoreId}
                  >
                    <SelectTrigger
                      style={{
                        height: 37.53,
                        background: INPUT_BG,
                        border: "none",
                        borderRadius: 9,
                        fontSize: 15,
                        color: "#333",
                        boxShadow: INPUT_SHADOW,
                      }}
                    >
                      <SelectValue placeholder={t.storePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t.loadingStores}
                        </SelectItem>
                      ) : (
                        stores.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {errorMsg && (
                <div
                  style={{
                    color: "#e03434",
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  style={{
                    flex: 1,
                    height: 67.03,
                    background: INPUT_BG,
                    border: "none",
                    borderRadius: 9,
                    color: LABEL_COLOR,
                    fontFamily: FONT,
                    fontWeight: 300,
                    fontSize: 15,
                    cursor: "pointer",
                    boxShadow: INPUT_SHADOW,
                  }}
                >
                  {t.prev}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    height: 67.03,
                    background: GREEN,
                    border: "none",
                    borderRadius: 9,
                    color: "#fff",
                    fontFamily: FONT_CAL,
                    fontWeight: 400,
                    fontSize: 16,
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {t.signup}
                </button>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: FONT_CAL,
                    fontWeight: 400,
                    fontSize: 15,
                    color: GREEN,
                    cursor: "pointer",
                  }}
                >
                  {t.backToLogin}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../../components/PasswordInput";
import axiosInstance from "../../../lib/axiosInstance";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { signupAPI } from "../../components/api/auth";
import { getAllStoresAPI, createStoreMemberAPI } from "../../components/api/store";

// 물리 키코드 → 영문 변환 (한타 입력 방지용)
const CODE_MAP: Record<string, string> = {
  KeyQ:'q',KeyW:'w',KeyE:'e',KeyR:'r',KeyT:'t',KeyY:'y',KeyU:'u',KeyI:'i',KeyO:'o',KeyP:'p',
  KeyA:'a',KeyS:'s',KeyD:'d',KeyF:'f',KeyG:'g',KeyH:'h',KeyJ:'j',KeyK:'k',KeyL:'l',
  KeyZ:'z',KeyX:'x',KeyC:'c',KeyV:'v',KeyB:'b',KeyN:'n',KeyM:'m',
  Digit1:'1',Digit2:'2',Digit3:'3',Digit4:'4',Digit5:'5',
  Digit6:'6',Digit7:'7',Digit8:'8',Digit9:'9',Digit0:'0',
  Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',
  Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backquote:'`',
};
const CODE_MAP_SHIFT: Record<string, string> = {
  KeyQ:'Q',KeyW:'W',KeyE:'E',KeyR:'R',KeyT:'T',KeyY:'Y',KeyU:'U',KeyI:'I',KeyO:'O',KeyP:'P',
  KeyA:'A',KeyS:'S',KeyD:'D',KeyF:'F',KeyG:'G',KeyH:'H',KeyJ:'J',KeyK:'K',KeyL:'L',
  KeyZ:'Z',KeyX:'X',KeyC:'C',KeyV:'V',KeyB:'B',KeyN:'N',KeyM:'M',
  Digit1:'!',Digit2:'@',Digit3:'#',Digit4:'$',Digit5:'%',
  Digit6:'^',Digit7:'&',Digit8:'*',Digit9:'(',Digit0:')',
  Minus:'_',Equal:'+',BracketLeft:'{',BracketRight:'}',Backslash:'|',
  Semicolon:':',Quote:'"',Comma:'<',Period:'>',Slash:'?',Backquote:'~',
};
const isKorean = (key: string) => /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(key);

const BG = "#EEF5DD";
const GREEN = "#00A200";
const INPUT_BG = "#F2F5EB";
const LABEL_COLOR = "#606060";
const PLACEHOLDER_COLOR = "#B7B4B4";
const FONT = "'Noto Sans JP', 'Noto Sans KR', sans-serif";
const FONT_CAL = "'Cal Sans', 'Noto Sans KR', sans-serif";

const INPUT_SHADOW = "inset -2px -1px 4px rgba(126, 147, 126, 0.15)";

const translations = {
  ko: {
    bannerStep1: "기본 정보 입력 (1/2)",
    bannerStep2Admin: "매장 정보 입력 (2/2)",
    bannerStep2Emp: "근무지 선택 (2/2)",
    nickname: "이름 (닉네임)",
    phone: "전화번호",
    username: "아이디",
    password: "비밀번호",
    confirmPassword: "비밀번호 확인",
    checkDuplicate: "중복 확인",
    role: "가입 유형",
    admin: "관리자 (사장님)",
    employee: "직원 (알바생)",
    next: "다음으로 ＞",
    prev: "← 이전",
    signup: "회원가입 완료",
    backToLogin: "이미 계정이 있으신가요? 로그인",
    brandName: "브랜드명 (가게명)",
    branchName: "지점명",
    isFranchise: "프랜차이저 (체인 매장)인가요?",
    openTime: "오픈 시간",
    closeTime: "마감 시간",
    maxCapacity: "최대 수용 인원 (명)",
    storeAddress: "매장 주소",
    storeType: "업종",
    storeTypeCafe: "카페",
    storeTypeRestaurant: "음식점",
    storeTypeFastFood: "패스트푸드",
    storeTypeRetail: "소매업",
    storeTypeService: "서비스업",
    storeTypeEtc: "ETC",
    businessNumber: "사업자등록번호",
    validateBusiness: "인증",
    businessValSuccess: "인증 성공",
    businessValFail: "유효하지 않은 사업자 번호입니다.",
    errorValidateBusiness: "사업자등록번호 인증을 완료해주세요.",
    selectStore: "근무할 매장 선택",
    errorEmpty: "모든 항목을 입력해주세요.",
    errorCheckNickname: "닉네임 중복 확인을 해주세요.",
    errorMatch: "비밀번호가 일치하지 않습니다.",
    errorPasswordWeak:
      "비밀번호는 대문자와 특수문자를 최소 1개 이상 포함해야 합니다.",
    errorDuplicate: "이미 존재하는 아이디입니다.",
    errorServer: "서버 오류가 발생했습니다.",
    successAlert: "회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.",
    adminPendingAlert: "관리자 가입 신청이 접수되었습니다. 마스터 승인 후 로그인할 수 있습니다.",
    strong: "강함",
    weak: "약함",
    loadingStores: "매장 목록을 불러오는 중...",
    storePlaceholder: "매장을 선택하세요",
  },
  en: {
    bannerStep1: "Basic Information (1/2)",
    bannerStep2Admin: "Store Information (2/2)",
    bannerStep2Emp: "Select Workplace (2/2)",
    nickname: "Name (Nickname)",
    phone: "Phone Number",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    checkDuplicate: "Check",
    role: "Account Type",
    admin: "Admin (Manager)",
    employee: "Employee (Staff)",
    next: "Next ＞",
    prev: "← Back",
    signup: "Complete Sign Up",
    backToLogin: "Already have an account? Login",
    brandName: "Brand Name",
    branchName: "Branch Name",
    isFranchise: "Is this a franchise store?",
    openTime: "Opening Time",
    closeTime: "Closing Time",
    maxCapacity: "Max Capacity",
    storeAddress: "Store Address",
    storeType: "Business Type",
    storeTypeCafe: "Cafe",
    storeTypeRestaurant: "Restaurant",
    storeTypeFastFood: "Fast Food",
    storeTypeRetail: "Retail",
    storeTypeService: "Service",
    storeTypeEtc: "Other",
    businessNumber: "Business Number",
    validateBusiness: "Verify",
    businessValSuccess: "Verified",
    businessValFail: "Invalid business number.",
    errorValidateBusiness: "Please verify your business number.",
    selectStore: "Select Workplace",
    errorEmpty: "Please fill in all fields.",
    errorCheckNickname: "Please check nickname availability.",
    errorMatch: "Passwords do not match.",
    errorPasswordWeak:
      "Password must include at least one uppercase letter and one special character.",
    errorDuplicate: "This username is already taken.",
    errorServer: "Server error occurred.",
    successAlert: "Registration complete! Moving to login page.",
    adminPendingAlert: "Admin application submitted. You can log in after master approval.",
    strong: "Strong",
    weak: "Weak",
    loadingStores: "Loading stores...",
    storePlaceholder: "Select a store",
  },
  ja: {
    bannerStep1: "基本情報の入力 (1/2)",
    bannerStep2Admin: "店舗情報の入力 (2/2)",
    bannerStep2Emp: "勤務地の選択 (2/2)",
    nickname: "名前（ニックネーム）",
    phone: "電話番号",
    username: "会員ID",
    password: "パスワード",
    confirmPassword: "パスワード確認",
    checkDuplicate: "重複確認",
    role: "アカウントタイプ",
    admin: "管理者 (店舗主)",
    employee: "従業員（パートタイマー）",
    next: "次へ進む",
    prev: "← 戻る",
    signup: "登録完了",
    backToLogin: "すでにアカウントをお持ちですか？ログイン",
    brandName: "ブランド名 (店舗名)",
    branchName: "店舗名 (支店)",
    isFranchise: "フランチャイズ店舗ですか？",
    openTime: "開店時間",
    closeTime: "閉店時間",
    maxCapacity: "最大収容人数 (人)",
    storeAddress: "店舗住所",
    storeType: "業種",
    storeTypeCafe: "カフェ",
    storeTypeRestaurant: "レストラン",
    storeTypeFastFood: "ファストフード",
    storeTypeRetail: "小売",
    storeTypeService: "サービス業",
    storeTypeEtc: "その他",
    businessNumber: "事業者登録番号",
    validateBusiness: "認証",
    businessValSuccess: "認証完了",
    businessValFail: "無効な事業者番号です。",
    errorValidateBusiness: "事業者登録番号の検証をしてください。",
    selectStore: "勤務店舗を選択",
    errorEmpty: "すべての項目を入力してください。",
    errorCheckNickname: "ニックネームの重複確認をしてください。",
    errorMatch: "パスワードが一致しません。",
    errorPasswordWeak:
      "パスワードには大文字と特殊文字を最低1つずつ含める必要があります。",
    errorDuplicate: "既に存在するユーザー名です。",
    errorServer: "サーバーエラーが発生しました。",
    successAlert: "会員登録が完了しました！ログインページに移動します。",
    adminPendingAlert: "管理者登録申請を受け付けました。マスター承認後にログインできます。",
    strong: "強い",
    weak: "弱い",
    loadingStores: "店舗リストを読み込み中...",
    storePlaceholder: "店舗を選択してください",
  },
};

const logoMap: Record<string, string> = {
  ko: "/logo_ko.png",
  en: "/logo_en.png",
  ja: "/logo_ja.png",
};

type NicknameStatus = "idle" | "ok" | "error";

// inputStyle / labelStyle은 컴포넌트 안에서 isDark를 받아 생성

function Field({
  label,
  children,
  style,
  labelStyle,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 한글 IME 조합 시작 시 blur→focus로 강제 해제 (전화번호 등에 사용)
  const resetIme = (e: React.CompositionEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    el.blur();
    requestAnimationFrame(() => el.focus());
  };

  // 한타 입력 시 물리 키코드로 영문 변환 (아이디 필드용)
  const makeEnglishKeyDown = (
    value: string,
    setter: (v: string) => void
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isKorean(e.key)) {
      e.preventDefault();
      const char = (e.shiftKey ? CODE_MAP_SHIFT : CODE_MAP)[e.nativeEvent.code];
      if (char) setter(value + char);
    }
  };

  const [language] = useState(
    () => sessionStorage.getItem("app-language") || "ko",
  );
  const [step, setStep] = useState(1);

  // color-scheme을 테마에 맞게 설정 (비밀번호 dots 가시성)
  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  // 다크/라이트 색상 팔레트
  const pageBg   = isDark ? '#1c1c1e' : BG;
  const cardBg   = isDark ? '#2c2c2e' : '#FFFFFF';
  const inputBg  = isDark ? '#3a3a3c' : INPUT_BG;
  const inputTxt = isDark ? '#fff'    : '#333';
  const labelClr = isDark ? '#aaa'    : LABEL_COLOR;
  const shadow   = isDark ? '3px 4px 20px rgba(0,0,0,0.4)' : '3px 4px 12.6px rgba(255,255,255,0.25)';

  const inputStyle: React.CSSProperties = {
    height: 37.53,
    background: inputBg,
    boxShadow: INPUT_SHADOW,
    borderRadius: 9,
    border: "none",
    outline: "none",
    padding: "0 14px",
    fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
    fontWeight: 300,
    fontSize: 15,
    color: inputTxt,
    boxSizing: "border-box",
    width: "100%",
  };

  // 비밀번호 인풋 전용: color-scheme 우회를 위해 transparent + textShadow 트릭 사용
  const pwInputStyle: React.CSSProperties = {
    ...inputStyle,
    color: inputTxt,            // 현재 적용된 텍스트 색상
    WebkitTextFillColor: inputTxt, // Safari/Chrome 대응
    opacity: 1,                 // 혹시 모를 투명도 문제 방지
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 300,
    fontSize: 15,
    color: labelClr,
    marginBottom: 7,
    display: "block",
  };

  const [role, setRole] = useState("employee");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const phone = `${phone1}${phone2}${phone3}`;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [nicknameChecking, setNicknameChecking] = useState(false);

  const [isFranchise, setIsFranchise] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeType, setStoreType] = useState("CAFE");
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessValidated, setBusinessValidated] = useState(false);
  const [businessChecking, setBusinessChecking] = useState(false);
  const [businessMsg, setBusinessMsg] = useState("");

  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // new loading and error state for store list
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState("");

  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    if (role === "employee") {
      setStoresLoading(true);
      setStoresError("");
      getAllStoresAPI()
        .then((res) => {
          setStores(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
          console.error('Failed to load stores', err);
          setStoresError(t.loadingStores + ' (오류)');
        })
        .finally(() => setStoresLoading(false));
    }
  }, [role]);

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    setNicknameStatus("idle");
  };

  const handleBusinessNumberChange = (val: string) => {
    setBusinessNumber(val);
    setBusinessValidated(false);
    setBusinessMsg("");
  };

  const handleValidateBusiness = async () => {
    if (!businessNumber.trim()) {
      setErrorMsg(t.errorEmpty);
      return;
    }
    setErrorMsg("");
    setBusinessChecking(true);
    setBusinessMsg("");
    try {
      const res = await axiosInstance.post("/users/validate-business", {
        businessNumber: businessNumber,
      });
      setBusinessValidated(true);
      setBusinessMsg(t.businessValSuccess);
    } catch (err: any) {
      setBusinessValidated(false);
      setBusinessMsg(t.businessValFail);
    } finally {
      setBusinessChecking(false);
    }
  };

  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      setErrorMsg(t.errorEmpty);
      return;
    }
    setErrorMsg("");
    setNicknameChecking(true);
    try {
      await axiosInstance.get("/users/check-nickname", {
        params: { nickname },
      });
      setNicknameStatus("ok");
    } catch (err: any) {
      setNicknameStatus(err.response?.status === 409 ? "error" : "ok");
    } finally {
      setNicknameChecking(false);
    }
  };

  const getStrength = (pw: string) => {
    if (!pw) return null;
    const u = /[A-Z]/.test(pw),
      s = /[!@#$%^&*(),.?":{}|<>]/.test(pw),
      l = pw.length >= 8;
    if (l && u && s) return "strong";
    if (l && (u || s)) return "medium";
    return "weak";
  };
  const strength = getStrength(password);

  const handleNextStep = () => {
    setErrorMsg("");
    if (!username || !nickname || !phone || !password || !confirmPassword) {
      setErrorMsg(t.errorEmpty);
      return;
    }
    if (nicknameStatus !== "ok") {
      setErrorMsg(t.errorCheckNickname);
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(password)) {
      setErrorMsg(t.errorPasswordWeak);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t.errorMatch);
      return;
    }
    setStep(2);
  };

  const handleFinalSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (role === "admin") {
      if (!brandName || !storeAddress || !businessNumber || (isFranchise && !branchName) || !maxCapacity) {
        setErrorMsg(t.errorEmpty);
        return;
      }
      if (!businessValidated) {
        setErrorMsg(t.errorValidateBusiness);
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
              storeAddress,
              storeType,
              businessNumber,
              openTime,
              closeTime,
              maxCapacity: Number(maxCapacity),
            }
          : {}),
      });
      if (role === "employee") {
        await createStoreMemberAPI({
          id: "SM_" + Date.now(),
          store_id: selectedStoreId,
          user_id: res.data.id,
        });
      }
      alert(role === "admin" ? t.adminPendingAlert : t.successAlert);
      navigate("/auth/login");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg(
          typeof err.response.data === "string" && err.response.data
            ? err.response.data
            : t.errorDuplicate,
        );
      } else {
        setErrorMsg(t.errorServer);
      }
    }
  };

  const bannerText =
    step === 1
      ? t.bannerStep1
      : role === "admin"
        ? t.bannerStep2Admin
        : t.bannerStep2Emp;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: cardBg,
            borderRadius: 58,
            boxShadow: shadow,
            padding: "48px 80px",
          }}
        >
          {/* Logo - 118×83px from Figma */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <img
              src={logoMap[language]}
              alt="Baitomate"
              style={{ height: 83, width: "auto", objectFit: "contain" }}
            />
          </div>

          {/* Step banner - 249px wide, pill shape */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 249,
                height: 37.53,
                background: GREEN,
                borderRadius: 18.77,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: 15,
                color: "#FFFFFF",
              }}
            >
              {bannerText}
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              {/* Role */}
              <Field labelStyle={labelStyle} label={t.role}>
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
                    style={{ ...inputStyle, flex: 1, width: "auto" }} className="signup-input"
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

              <Field labelStyle={labelStyle} label={t.phone}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="tel" maxLength={3} lang="en"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value.replace(/\D/g, ''))}
                    onCompositionStart={resetIme}
                    style={{ ...inputStyle, width: "28%", textAlign: "center" }} className="signup-input"
                  />
                  <span style={{ color: "#aaa", fontWeight: 400, flexShrink: 0 }}>-</span>
                  <input
                    type="tel" maxLength={4} lang="en"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ''))}
                    onCompositionStart={resetIme}
                    style={{ ...inputStyle, flex: 1, textAlign: "center" }} className="signup-input"
                  />
                  <span style={{ color: "#aaa", fontWeight: 400, flexShrink: 0 }}>-</span>
                  <input
                    type="tel" maxLength={4} lang="en"
                    value={phone3}
                    onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ''))}
                    onCompositionStart={resetIme}
                    style={{ ...inputStyle, flex: 1, textAlign: "center" }} className="signup-input"
                  />
                </div>
              </Field>

              <Field labelStyle={labelStyle} label={t.username}>
                <input
                  type="text"
                  lang="en"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))}
                  onKeyDown={makeEnglishKeyDown(username, setUsername)}
                  placeholder={t.username}
                  style={{ ...inputStyle }}
                  className="signup-input"
                />
              </Field>

              <Field labelStyle={labelStyle} label={t.password}>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={t.password}
                  autoComplete="new-password"
                  style={inputStyle} className="signup-input"
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

              <Field labelStyle={labelStyle} label={t.confirmPassword}>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder={t.confirmPassword}
                  autoComplete="new-password"
                  style={inputStyle} className="signup-input"
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

                  <Field labelStyle={labelStyle} label={t.brandName}>
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
                      style={inputStyle} className="signup-input"
                    />
                  </Field>

                  <Field labelStyle={labelStyle} label={t.branchName}>
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

                  <Field labelStyle={labelStyle} label={t.storeAddress}>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="서울시 강남구 ..."
                      style={inputStyle} className="signup-input"
                    />
                  </Field>

                  <div style={{ marginBottom: 18 }}>
                    <div style={labelStyle}>{t.storeType}</div>
                    <select
                      value={storeType}
                      onChange={(e) => setStoreType(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      className="signup-input"
                    >
                      <option value="CAFE">{t.storeTypeCafe}</option>
                      <option value="RESTAURANT">{t.storeTypeRestaurant}</option>
                      <option value="FAST_FOOD">{t.storeTypeFastFood}</option>
                      <option value="RETAIL">{t.storeTypeRetail}</option>
                      <option value="SERVICE">{t.storeTypeService}</option>
                      <option value="ETC">{t.storeTypeEtc}</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={labelStyle}>{t.businessNumber}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        lang="en"
                        value={businessNumber}
                        onChange={(e) => handleBusinessNumberChange(e.target.value)}
                        onCompositionStart={resetIme}
                        placeholder="123-45-67890"
                        style={{ ...inputStyle, flex: 1, width: "auto" }} className="signup-input"
                      />
                      <button
                        type="button"
                        onClick={handleValidateBusiness}
                        disabled={businessChecking}
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
                          opacity: businessChecking ? 0.6 : 1,
                          boxShadow: INPUT_SHADOW,
                        }}
                      >
                        {businessChecking ? "..." : t.validateBusiness}
                      </button>
                      {businessValidated && (
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
                    </div>
                    {businessMsg && (
                      <div
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          color: businessValidated ? "#16a34a" : "#dc2626",
                          fontFamily: FONT,
                          fontWeight: 400
                        }}
                      >
                        {businessMsg}
                      </div>
                    )}
                  </div>

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
                        style={inputStyle} className="signup-input"
                      />
                    </div>
                    <div>
                      <div style={labelStyle}>{t.closeTime}</div>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        style={inputStyle} className="signup-input"
                      />
                    </div>
                  </div>

                  <Field labelStyle={labelStyle} label={t.maxCapacity}>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      placeholder="10"
                      min="1"
                      style={inputStyle} className="signup-input"
                    />
                  </Field>
                </>
              )}

              {role === "employee" && (
                <Field labelStyle={labelStyle} label={t.selectStore}>
                  {storesLoading ? (
                    <div style={{ color: '#666', fontSize: 13 }}>{t.loadingStores}...</div>
                  ) : storesError ? (
                    <div style={{ color: '#e03434', fontSize: 13 }}>{storesError}</div>
                  ) : (
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
                        {stores.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                  disabled={role === "employee" && !selectedStoreId}
                  style={{
                    flex: 2,
                    height: 67.03,
                    background: role === "employee" && !selectedStoreId ? '#90c090' : GREEN,
                    border: "none",
                    borderRadius: 9,
                    color: "#fff",
                    fontFamily: FONT_CAL,
                    fontWeight: 400,
                    fontSize: 16,
                    cursor: role === "employee" && !selectedStoreId ? "not-allowed" : "pointer",
                    opacity: role === "employee" && !selectedStoreId ? 0.6 : 1,
                    transition: "opacity 0.15s",
                  }}
                  onMouseOver={(e) => {
                    if (!(role === "employee" && !selectedStoreId)) e.currentTarget.style.opacity = "0.88";
                  }}
                  onMouseOut={(e) => {
                    if (!(role === "employee" && !selectedStoreId)) e.currentTarget.style.opacity = "1";
                  }}
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

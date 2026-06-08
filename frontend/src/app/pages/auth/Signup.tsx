import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { UserPlus, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { signupAPI } from '../../components/api/auth';

const translations = {
    ko: {
        title: 'ShiftOps AI',
        subtitle: '새로운 계정 생성하기',
        step1: '기본 정보 입력 (1/2)',
        step2Admin: '매장 운영 정보 입력 (2/2)',
        step2Emp: '근무지 선택 (2/2)',
        username: '아이디',
        password: '비밀번호',
        confirmPassword: '비밀번호 확인',
        nickname: '이름 (닉네임)',
        phone: '전화번호',
        checkDuplicate: '중복 확인',
        role: '가입 유형',
        admin: '관리자 (사장님)',
        employee: '직원 (알바생)',
        next: '다음 단계로',
        prev: '이전으로',
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
        errorMatch: '비밀번호가 일치하지 않습니다.',
        errorDuplicate: '이미 존재하는 회원 아이디입니다.',
        errorServer: '서버 오류가 발생했습니다.',
        nicknameAvailable: '사용 가능한 이름(닉네임)입니다.',
        successAlert: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.'
    },
    en: {
        title: 'ShiftOps AI',
        subtitle: 'Create a new account',
        step1: 'Basic Information (1/2)',
        step2Admin: 'Store Operations (2/2)',
        step2Emp: 'Workplace Selection (2/2)',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        nickname: 'Name (Nickname)',
        phone: 'Phone Number',
        checkDuplicate: 'Check',
        role: 'Account Type',
        admin: 'Admin (Manager)',
        employee: 'Employee (Staff)',
        next: 'Next',
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
        errorMatch: 'Passwords do not match.',
        errorDuplicate: 'This username is already taken.',
        errorServer: 'Server error occurred.',
        nicknameAvailable: 'This nickname is available.',
        successAlert: 'Registration complete! Moving to login page.'
    },
    ja: {
        title: 'ShiftOps AI',
        subtitle: '新しいアカウントを作成',
        step1: '基本情報の入力 (1/2)',
        step2Admin: '店舗運営情報の入力 (2/2)',
        step2Emp: '勤務地の選択 (2/2)',
        username: 'ユーザー名',
        password: 'パスワード',
        confirmPassword: 'パスワードの確認',
        nickname: '名前 (ニックネーム)',
        phone: '電話番号',
        checkDuplicate: '重複確認',
        role: 'アカウントタイプ',
        admin: '管理者 (店舗主)',
        employee: '従業員 (アルバイト)',
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
        errorMatch: 'パスワードが一致しません。',
        errorDuplicate: '既に存在するユーザー名です。',
        errorServer: 'サーバーエラーが発生しました。',
        nicknameAvailable: '使用可能なニックネームです。',
        successAlert: '会員登録が完了しました！ログインページに移動します。'
    }
};

export default function Signup() {
    const navigate = useNavigate();
    const [language] = useState(() => localStorage.getItem('app-language') || 'ko');
    const [step, setStep] = useState(1);

    // 1단계 상태값
    const [role, setRole] = useState('employee');
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 2단계 사장님 전용 상태값
    const [isFranchise, setIsFranchise] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('22:00');
    const [maxCapacity, setMaxCapacity] = useState('');

    // 2단계 알바생 전용 상태값 - DB에서 가져온 매장 목록
    const [stores, setStores] = useState<{id: string, name: string}[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const t = translations[language as keyof typeof translations];

    // 알바생 선택 시 매장 목록 불러오기
    useEffect(() => {
        if (role === 'employee') {
            const fetchStores = async () => {
                try {
                    const res = await axios.get('http://localhost:8080/api/store/all');
                    setStores(Array.isArray(res.data) ? res.data : []);
                } catch (err) {
                    console.error('매장 목록 조회 실패:', err);
                }
            };
            fetchStores();
        }
    }, [role]);

    const getPasswordStrength = (pw: string) => {
        if (!pw) return null;
        const hasUpper = /[A-Z]/.test(pw);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
        const hasLength = pw.length >= 8;
        if (hasLength && hasUpper && hasSpecial) return 'strong';
        if (hasLength && (hasUpper || hasSpecial)) return 'medium';
        return 'weak';
    };

    const strength = getPasswordStrength(password);

    const handleCheckNickname = () => {
        if (!nickname.trim()) {
            setErrorMsg(t.errorEmpty);
            return;
        }
        setErrorMsg('');
        setSuccessMsg(t.nicknameAvailable);
    };

    const handleNextStep = () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!username || !nickname || !phone || !password || !confirmPassword) {
            setErrorMsg(t.errorEmpty);
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
        if (!passwordRegex.test(password)) {
            setErrorMsg('비밀번호는 대문자와 특수문자를 최소 1개 이상 포함해야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg(t.errorMatch);
            return;
        }

        setStep(2);
    };

    const handleFinalSignUp = async (e: any) => {
        e.preventDefault();
        setErrorMsg('');

        if (role === 'admin') {
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
                role: role === 'admin' ? 'ADMIN' : 'STAFF',
                ...(role === 'admin'
                    ? {
                        brandName,
                        branchName: isFranchise ? branchName : null,
                        openTime,
                        closeTime,
                        maxCapacity: Number(maxCapacity),
                    }
                    : {}
                ),
            });

            // 직원이면 가입 후 store_member에 PENDING으로 등록
            if (role === 'employee') {
                const newUserId = res.data.id;
                await axios.post('http://localhost:8080/api/store_member', {
                    id: 'SM_' + Date.now(),
                    store_id: selectedStoreId,
                    user_id: newUserId
                });
            }

            alert(t.successAlert);
            navigate('/auth/login');
        } catch (err: any) {
            if (err.response?.status === 409) {
                setErrorMsg(t.errorDuplicate);
            } else {
                setErrorMsg(t.errorServer);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md my-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-md">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t.title}</h1>
                        <p className="text-blue-600 dark:text-blue-400 mt-2 text-sm font-semibold">
                            {step === 1 ? t.step1 : (role === 'admin' ? t.step2Admin : t.step2Emp)}
                        </p>
                    </div>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">{t.role}</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="w-full h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">{t.employee}</SelectItem>
                                        <SelectItem value="admin">{t.admin}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nickname" className="text-sm font-semibold">{t.nickname}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder={t.nickname}
                                        className="flex-1 h-11"
                                    />
                                    <Button type="button" onClick={handleCheckNickname} variant="secondary" className="h-11 px-4">
                                        {t.checkDuplicate}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-sm font-semibold">{t.phone}</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="010-0000-0000"
                                    className="w-full h-11"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-sm font-semibold">{t.username}</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="사용할 아이디를 입력하세요"
                                    className="w-full h-11"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-semibold">{t.password}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.password}
                                    className="w-full h-11"
                                />
                                {password && (
                                    <div className="mt-2 space-y-1">
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    strength === 'strong'
                                                        ? 'w-full bg-gradient-to-r from-green-400 to-emerald-500'
                                                        : strength === 'medium'
                                                            ? 'w-2/3 bg-gradient-to-r from-yellow-400 to-orange-400'
                                                            : 'w-1/3 bg-gradient-to-r from-red-400 to-red-500'
                                                }`}
                                            />
                                        </div>
                                        <p className={`text-xs font-medium ${
                                            strength === 'strong' ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                            {strength === 'strong' ? '강함' : '약함'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-sm font-semibold">{t.confirmPassword}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t.confirmPassword}
                                    className="w-full h-11"
                                />
                            </div>

                            {errorMsg && <p className="text-sm font-medium text-red-500 text-center">{errorMsg}</p>}
                            {successMsg && (
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
                                    <Check className="w-4 h-4" /> {successMsg}
                                </p>
                            )}

                            <div className="space-y-3 pt-4">
                                <Button type="button" onClick={handleNextStep} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-sm flex items-center justify-center gap-2">
                                    {t.next} <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => navigate('/auth/login')} className="w-full h-11 text-blue-600 dark:text-blue-400 font-medium">
                                    {t.backToLogin}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <form onSubmit={handleFinalSignUp} className="space-y-4">

                            {/* 사장님 양식 */}
                            {role === 'admin' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-1 bg-blue-50/50 dark:bg-slate-900/50 p-3 rounded-lg border border-blue-100/50 dark:border-slate-700/50">
                                        <Label htmlFor="isFranchise" className="text-sm font-medium text-blue-900 dark:text-blue-300">{t.isFranchise}</Label>
                                        <Switch id="isFranchise" checked={isFranchise} onCheckedChange={setIsFranchise} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">{t.brandName}</Label>
                                        <Input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="예: 춘식이네 매장" className="h-11" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">{t.branchName}</Label>
                                        <Input
                                            type="text"
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            placeholder={isFranchise ? "예: 역삼점" : "단독 매장 (입력 불가)"}
                                            disabled={!isFranchise}
                                            className="h-11 disabled:bg-gray-100 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">{t.openTime}</Label>
                                            <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">{t.closeTime}</Label>
                                            <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="h-11" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">{t.maxCapacity}</Label>
                                        <Input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="예: 10" min="1" className="h-11" />
                                    </div>
                                </div>
                            )}

                            {/* 알바생 양식 - DB에서 가져온 실제 매장 목록 */}
                            {role === 'employee' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">{t.selectStore}</Label>
                                        <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="매장을 선택하세요" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stores.length === 0 ? (
                                                    <SelectItem value="none" disabled>매장 목록을 불러오는 중...</SelectItem>
                                                ) : (
                                                    stores.map(store => (
                                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {errorMsg && <p className="text-sm font-medium text-red-500 text-center">{errorMsg}</p>}

                            <div className="flex gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setStep(1); setErrorMsg(''); }} className="flex-1 h-11 border-gray-300 dark:border-gray-600 gap-1">
                                    <ArrowLeft className="w-4 h-4" /> {t.prev}
                                </Button>
                                <Button type="submit" className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                                    {t.signup}
                                </Button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}

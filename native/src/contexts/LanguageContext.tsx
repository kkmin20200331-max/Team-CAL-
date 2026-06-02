import React, { createContext, useState, useContext } from 'react';

export type Language = '한국어' | 'English' | '日本語';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// 다국어 사전 (필요한 텍스트를 여기에 계속 추가하면 됩니다)
const translations = {
  '한국어': {
    greeting: '안녕하세요',
    admin: '관리자',
    staff: '일반 직원',
    todayWork: '오늘의 근무',
    weeklyHours: '이번 주 근무 시간',
    weeklySalary: '이번 주 예상급여',
    notice: '사내 게시판',
    more: '더보기',
    myInfo: '내 정보 관리',
    profileEdit: '개인정보 수정',
    contract: '나의 근로계약서',
    healthCert: '보건증 관리',
    appSettings: '앱 설정',
    themeMode: '화면 모드',
    languageSetting: '언어 설정',
    pushAlert: '앱 푸시 알림',
    logout: '로그아웃',
    scheduled: '근무 예정',
    inProgress: '근무 중',
    completed: '근무 완료',
    substituteReq: '대타 찾는 중',
    offDay: '휴무',
    leaveRequest: '휴무 신청 / 대타 구하기',
    noSchedule: '선택한 날짜에는 근무 일정이 없습니다.',
    leaveReasonPlaceholder: '휴무 사유를 상세히 적어주세요 (예: 병원 진료, 학교 시험 등)',
    cancel: '취소',
    apply: '신청하기',
    monthlyView: '월간 보기',
    close: '닫기',
    sun: '일',
    mon: '월',
    tue: '화',
    wed: '수',
    thu: '목',
    fri: '금',
    sat: '토',
    month: '월',
    year: '년',
  },
  '日本語': {
    greeting: 'こんにちは',
    admin: '管理者',
    staff: '一般スタッフ',
    todayWork: '今日の勤務',
    weeklyHours: '今週の勤務時間',
    weeklySalary: '今週の予想給与',
    notice: '社内掲示板',
    more: 'もっと見る',
    myInfo: '自分の情報管理',
    profileEdit: '個人情報の修正',
    contract: '私の労働契約書',
    healthCert: '保健証の管理',
    appSettings: 'アプリ設定',
    themeMode: '画面モード',
    languageSetting: '言語設定',
    pushAlert: 'アプリプッシュ通知',
    logout: 'ログアウト',
    scheduled: '勤務予定',
    inProgress: '勤務中',
    completed: '勤務完了',
    substituteReq: '代打探し中',
    offDay: '休み',
    leaveRequest: '休み申請 / 代打探し',
    noSchedule: '選択した日付の勤務予定はありません。',
    leaveReasonPlaceholder: '休みの理由を詳しく記入してください（例：通院、テストなど）',
    cancel: 'キャンセル',
    apply: '申請する',
    monthlyView: '月間ビュー',
    close: '閉じる',
    sun: '日',
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    month: '月',
    year: '年',
  },
  'English': {
    greeting: 'Hello',
    admin: 'Admin',
    staff: 'Staff',
    todayWork: 'Today\'s Shift',
    weeklyHours: 'Weekly Hours',
    weeklySalary: 'Expected Salary',
    notice: 'Notice Board',
    more: 'More',
    myInfo: 'My Info Management',
    profileEdit: 'Edit Profile',
    contract: 'My Contract',
    healthCert: 'Health Certificate',
    appSettings: 'App Settings',
    themeMode: 'Theme Mode',
    languageSetting: 'Language Settings',
    pushAlert: 'Push Notifications',
    logout: 'Logout',
    scheduled: 'Scheduled',
    inProgress: 'In Progress',
    completed: 'Completed',
    substituteReq: 'Finding Sub',
    offDay: 'Off',
    leaveRequest: 'Request Leave / Substitute',
    noSchedule: 'No schedule for the selected date.',
    leaveReasonPlaceholder: 'Please enter details for leave (e.g. sick, exam)',
    cancel: 'Cancel',
    apply: 'Apply',
    monthlyView: 'Monthly View',
    close: 'Close',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    month: 'Month',
    year: 'Year',
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: '한국어',
  setLanguage: () => {},
  t: (key: string) => key, // Provider가 없을 경우 key를 그대로 반환하여 에러 방지
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('한국어');

  // key 값을 받아 현재 선택된 언어의 텍스트를 반환하는 번역 함수
  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['한국어']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
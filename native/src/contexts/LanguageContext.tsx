import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateTexts } from '../api/translation';

const TRANSLATION_VERSION = '1.3'; // 번역 데이터 버전

const ko = {
  greeting: '안녕하세요',
  suffixNim: '님',
  todayWork: '오늘의 근무',
  scheduled: '근무 예정',
  inProgress: '근무중',
  completed: '근무 완료',
  substituteReq: '대타 요청중',
  offDay: '휴무',
  weeklyHours: '이번 주 근무 시간',
  weeklySalary: '이번 주 예상 급여',
  subReqAlertTitle: '새로운 대타 요청',
  subReqAlertDesc: '김민준 님의 근무에 대타 지원이 필요합니다.',
  applyBtn: '지원하기',
  rejectBtn: '거절',
  latestNotices: '최신 공지사항',
  viewAll: '전체보기',
  noNotices: '등록된 공지사항이 없습니다.',
  qrCheckIn: 'QR 체크인',
  defaultUserName: '사용자',
  admin: '관리자',
  staff: '직원',
  myInfo: '내 정보',
  profileEdit: '프로필 수정',
  contract: '근로계약서',
  healthCert: '보건증',
  appSettings: '앱 설정',
  themeMode: '테마 모드',
  languageSetting: '언어 설정',
  pushAlert: '푸시 알림',
  logout: '로그아웃',
  withdrawBtn: '회원 탈퇴',
  withdrawConfirmTitle: '회원 탈퇴 확인',
  withdrawConfirmMsg: '정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  cancel: '취소',
  confirm: '확인',
  withdrawSuccessTitle: '탈퇴 완료',
  withdrawSuccessMsg: '회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.',
  themeSettings: '테마 설정',
  langSettings: '언어 설정',
  employeeManagement: '직원 관리',
  monthlySchedule: '월간 근무표',
  payroll: '급여 정산',
  internalBoard: '사내 게시판',
  adminDashboard: '관리자 대시보드',
  brand: '브랜드',
  branch: '지점',
  currentlyWorking: '현재 근무중',
  requestProcessing: '요청 처리',
  selectBranch: '지점 선택',
  addNewBranch: '+ 새 지점 추가',
  close: '닫기',
  findSubstitute: '대타 찾기',
  myPaystub: '나의 급여 명세서',
  mySubstituteHistory: '나의 대타 내역',
  storeManagement: '매장 관리',
  storeInfoEdit: '매장 정보 수정',
  healthCertManagement: '보건증 관리',
  contractManagement: '근로계약서 관리',
  leaveRequestManagement: '휴무 신청 관리',
  lineConnect: 'LINE 연동하기',
  lightMode: '라이트 모드',
  darkMode: '다크 모드',
  systemSetting: '시스템 설정',
  writer: '작성자',
  views: '조회수',
  boardDetailTitle: '게시글 상세',
  unpin: '상단 고정 해제',
  pin: '상단 고정',
  comments: '댓글',
  noComments: '아직 댓글이 없습니다.',
  addCommentPlaceholder: '댓글을 입력하세요...',
  register: '등록',
  commentEmptyTitle: '댓글 오류',
  commentEmptyMsg: '댓글 내용을 입력해주세요.',
  deleteCommentConfirmTitle: '댓글 삭제',
  deleteCommentConfirmMsg: '이 댓글을 정말 삭제하시겠습니까?',
  deleteCommentSuccessTitle: '삭제 완료',
  deleteCommentSuccessMsg: '댓글이 삭제되었습니다.',
  unknown: '알 수 없음',
  checkIn: '출근',
  checkOut: '퇴근',
  expectedDailyWage: '예상 일급',
  currency: '원',
  noScheduleToday: '오늘은 예정된 근무가 없습니다.',
  notifListTitle: '알림 목록',
  markAllRead: '모두 읽음',
  delete: '삭제',
  weeklyDetailTitle: '주간 근무 상세',
  noDetails: '상세 내역을 불러올 수 없습니다.',
  totalWorkDays: '근무일',
  daysUnit: '일',
  totalWorkHours: '총 시간',
  hoursUnit: '시간',
  appliedRate: '적용 시급',
  dailyWorkHistory: '일별 근무 내역',
  noWeeklyWorkHistory: '이번 주 근무 기록이 없습니다.',
  alert: '알림',
  titleContentRequired: '제목과 내용을 모두 입력해주세요.',
  success: '성공',
  postEditSuccess: '게시글이 성공적으로 수정되었습니다.',
  newNotice: '새로운 공지사항 등록',
  notice: '공지사항',
  alertFailed: '알림 실패',
  pushAlertFailed: '푸시 알림을 보내는 데 실패했습니다.',
  postCreateSuccess: '게시글이 성공적으로 등록되었습니다.',
  editPost: '글 수정하기',
  writeNewPost: '새 글 쓰기',
  selectCategory: '카테고리 선택',
  title: '제목',
  titlePlaceholder: '제목을 입력하세요',
  content: '내용',
  contentPlaceholder: '내용을 자세히 작성해주세요.',
  editComplete: '수정하기',
  createComplete: '등록하기',
  suggestion: '건의사항',
  lost_found: '분실물',
  free_board: '자유게시판',
  leaveRequest: '휴무 신청 대기중',
  requestComplete: '신청 완료',
  requestSentToAdmin: '점주에게 요청이 전송되었습니다.',
  unassigned: '배정 안됨',
  requestLeave: '휴가 신청',
  requestSubstitute: '대타 신청',
  monthlyView: '월간 보기',
  newShift: '새 근무',
  noSchedule: '예정된 근무가 없습니다.',
  leaveReasonPlaceholder: '휴가 사유를 입력해주세요.',
  substituteReasonPlaceholder: '대타 요청 사유를 입력해주세요.',
  substituteApplyTitle: '대타 지원',
  substituteApplyMsg: '이 근무에 대타로 지원하시겠습니까?',
  applySuccess: '지원이 완료되었습니다.',
  error: '오류',
  errorApplySubstitute: '지원 중 오류가 발생했습니다.',
  myRequest: '내가 올린 요청',
  myApplication: '내가 지원한 요청',
  substituteRequests: '대타 구해요',
  history: '내역',
  noSubstituteRequests: '현재 올라온 대타 요청이 없습니다.',
  noHistory: '요청 또는 지원 내역이 없습니다.',
  todaySchedule: '오늘의 스케줄',
  morning: '오전',
  afternoon: '오후',
  closing: '마감',
  sun: '일',
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  selectEmployee: '직원을 선택해주세요.',
  editShiftSuccess: '근무 수정 완료',
  addShiftSuccess: '새 근무 추가 완료',
  deleteConfirmTitle: '삭제 확인',
  deleteConfirmMsg: '이 근무를 정말 삭제하시겠습니까?',
  deleteShiftSuccess: '근무 삭제 완료',
  editShift: '근무 수정',
  addShift: '새 근무 추가',
  selectEmployeePlaceholder: '직원을 선택하세요...',
  date: '날짜',
  startTime: '시작 시간',
  endTime: '종료 시간',
  save: '저장',
  approveRequestTitle: '요청 승인',
  approveRequestMsg: '이 요청을 승인하시겠습니까?',
  approve: '승인',
  approvalComplete: '승인 완료',
  denyRequestTitle: '요청 거절',
  denyRequestMsg: '이 요청을 거절하시겠습니까?',
  deny: '거절',
  denialComplete: '거절 처리 완료',
  leave: '휴무',
  substitute: '대타',
  employee: '직원',
  workTime: '근무 시간',
  reason: '사유',
  requestManagement: '요청 관리',
  noRequests: '처리할 요청이 없습니다.',
  badgeNew: '새글',
  badgeImportant: '중요',
  saveCompleteTitle: '저장 완료',
  saveCompleteMsg: '개인정보가 성공적으로 수정되었습니다.',
  editFailTitle: '수정 실패',
  editFailMsg: '개인정보 수정 중 오류가 발생했습니다.',
  accountInfoReadonly: '계정 정보 (수정 불가)',
  idLabel: '아이디',
  branchLabel: '근무 매장',
  roleLabel: '권한',
  adminRole: '관리자',
  staffRole: '직원',
  myInfoSection: '개인정보 수정',
  nameLabel: '이름',
  namePlaceholder: '이름을 입력하세요',
  phoneLabel: '전화번호',
  phonePlaceholder: '전화번호를 입력하세요',
  changePasswordSection: '비밀번호 변경',
  currentPasswordLabel: '현재 비밀번호',
  currentPasswordPlaceholder: '현재 비밀번호 입력',
  newPasswordLabel: '새 비밀번호',
  newPasswordPlaceholder: '새 비밀번호 입력',
  editCompleteBtn: '수정 완료',
  subReqConfirmTitle: '대타 신청 확인',
  subReqConfirmMsg: '이 근무에 대타 지원을 하시겠습니까?',
  subApplySuccessTitle: '지원 완료',
  subApplySuccessMsg: '대타 지원이 정상적으로 완료되었습니다.',
  subPointUnit: 'P',
  subPointTotal: '누적 포인트',
  subEmptyReq: '등록된 대타 요청이 없습니다.',
  subEmptyHist: '대타 내역이 존재하지 않습니다.',
  subTabRequest: '대타 요청',
  subTabHistory: '매칭 내역',
  valid: '유효함',
  pendingApproval: '승인 대기중',
  expired: '만료됨',
  needsRenewal: '갱신 필요',
  expiryDate: '만료일',
  uploadNew: '새로운 사진 업로드',
  workPlace: '근무지',
  startDate: '시작일',
  wage: '시급',
  boardTabAll: '전체',
  boardTabNotice: '공지사항',
  boardTabMenu: '건의사항',
  boardTabEvent: '자유게시판',
  boardTabManual: '매뉴얼',
  boardTabLost: '분실물',
  boardTabChecklist: '체크리스트',
  more: '더보기',
  substituteTitle: '대타 구하기',
};

export type Language = '한국어' | 'English' | '日本語';
type TranslationData = typeof ko;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('한국어');
  const [translations, setTranslations] = useState<{ [key: string]: Partial<TranslationData> }>({ ko });
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedVersion = await AsyncStorage.getItem('translation_version');
      if (savedVersion !== TRANSLATION_VERSION) {
        await AsyncStorage.removeItem('translations');
        await AsyncStorage.setItem('translation_version', TRANSLATION_VERSION);
        setTranslations({ ko });
      } else {
        const savedTranslations = await AsyncStorage.getItem('translations');
        if (savedTranslations) {
          setTranslations(JSON.parse(savedTranslations));
        }
      }
      
      const savedLang = await AsyncStorage.getItem('language') as Language | null;
      if (savedLang) {
        setLanguageState(savedLang);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    if (lang === language) return;

    const langCode = lang === 'English' ? 'en' : lang === '日本語' ? 'ja' : 'ko';

    if (langCode === 'ko') {
      setLanguageState('한국어');
      await AsyncStorage.setItem('language', '한국어');
      return;
    }

    if (translations[langCode] && Object.keys(translations[langCode]).length === Object.keys(ko).length) {
      setLanguageState(lang);
      await AsyncStorage.setItem('language', lang);
    } else {
      setIsTranslating(true);
      try {
        const keys = Object.keys(ko) as (keyof TranslationData)[];
        const values = keys.map(key => ko[key]);
        
        // 💡 [임시 주석 처리] 구글 번역 API 사용 비활성화 (향후 정적 i18n 리소스로 교체 예정)
        // const translatedValues = await translateTexts(values, langCode);
        const translatedValues = values; // 번역 대신 원본(한글) 값을 그대로 적용
        
        const newTranslation: Partial<TranslationData> = {};
        keys.forEach((key, index) => {
          newTranslation[key] = translatedValues[index];
        });

        const newTranslations = { ...translations, [langCode]: newTranslation };
        setTranslations(newTranslations);
        setLanguageState(lang);

        await AsyncStorage.setItem('translations', JSON.stringify(newTranslations));
        await AsyncStorage.setItem('language', lang);

      } catch (error: any) {
        console.error("언어 변경 오류:", error);
        Alert.alert(
          "번역 오류",
          `언어 변경 중 문제가 발생했습니다. API 키 또는 네트워크 연결을 확인해주세요.\n\n(${error.message})`
        );
        setLanguageState('한국어');
        await AsyncStorage.setItem('language', '한국어');
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const t = (key: any): string => {
    const langCode = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';
    const translationSet = (translations[langCode] || translations.ko) as any;
    return translationSet[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

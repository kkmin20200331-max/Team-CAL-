import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import { API_BASE } from "../../../lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Video,
  Brain,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  LineChart as LineChartIcon,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  FileText,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

type TabKey = "live" | "pattern" | "insight" | "schedule";

type PeopleLog = {
  id?: string | number;
  record_time?: string;
  recordTime?: string;
  people_count?: number;
  peopleCount?: number;
};

type CctvMetrics = {
  running?: boolean;
  processedFrames?: number;
  droppedFrames?: number;
  lastCustomerCount?: number;
  lastConfidenceAvg?: number;
  lastMeasuredAt?: string;
  queueSize?: number;
};

type CctvAggregate = {
  available?: boolean;
  aggregate?: {
    avgCustomerCount?: number;
    maxCustomerCount?: number;
    minCustomerCount?: number;
    lastCustomerCount?: number;
    sampleCount?: number;
    measuredAt?: string;
  };
};

type TrafficRow = {
  time: string;
  visitors: number;
  recommended: number;
  wait: number;
};

type WeeklyPatternRow = {
  day: string;
  morning: number;
  lunch: number;
  evening: number;
};

type AiInsightResponse = {
  summary?: {
    overallStatus?: string;
    mainMessage?: string;
    riskLevel?: string;
  };
  insights?: Array<{
    id?: string;
    type?: string;
    severity?: string;
    badge?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
    reason?: string;
  }>;
  scheduleRecommendations?: Array<{
    timeRange?: string;
    currentStaff?: number;
    recommendedStaff?: number;
    recommendedExtraStaff?: number;
    status?: string;
    reason?: string;
  }>;
  source?: "rule-based" | "dummy" | "llm" | "llm-fallback";
};

const AI_INSIGHT_API = `${API_BASE}/ai-insights`;

const branchNames: Record<string, string> = {
  migeum: "컴포즈 미금점",
  sunae: "컴포즈 수내점",
  dongcheon: "컴포즈 동천점",
};

const branchStoreIds: Record<string, number> = {
  migeum: 1,
  sunae: 2,
  dongcheon: 3,
};

const branchShiftStoreIds: Record<string, string> = {
  "1": "V1StGXR8_Z5jdHi6B-myT",
  migeum: "V1StGXR8_Z5jdHi6B-myT",
  "2": "N2xY8pQ3_a1BcDeFgH1jK",
  sunae: "N2xY8pQ3_a1BcDeFgH1jK",
  "3": "k9L0mN1o_P2qR3sT4uV5w",
  dongcheon: "k9L0mN1o_P2qR3sT4uV5w",
};

const fallbackTraffic: TrafficRow[] = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 8;
  return {
    time: `${String(hour).padStart(2, "0")}:00`,
    visitors: 0,
    recommended: 1,
    wait: 0,
  };
});

const fallbackWeeklyPattern: WeeklyPatternRow[] = [
  { day: "월", morning: 0, lunch: 0, evening: 0 },
  { day: "화", morning: 0, lunch: 0, evening: 0 },
  { day: "수", morning: 0, lunch: 0, evening: 0 },
  { day: "목", morning: 0, lunch: 0, evening: 0 },
  { day: "금", morning: 0, lunch: 0, evening: 0 },
  { day: "토", morning: 0, lunch: 0, evening: 0 },
  { day: "일", morning: 0, lunch: 0, evening: 0 },
];

const TAB_KEYS: TabKey[] = ["live", "pattern", "insight", "schedule"];

const resolveStoreId = (branchId?: string) => {
  if (!branchId) return 1;
  const numericId = Number(branchId);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return branchStoreIds[branchId] || 1;
};

const resolveShiftStoreId = (branchId?: string) => {
  if (!branchId) return "V1StGXR8_Z5jdHi6B-myT";
  return branchShiftStoreIds[branchId] || branchId;
};

const toDateText = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPeopleCount = (log: PeopleLog) =>
  Number(log.people_count ?? log.peopleCount ?? 0);

const getRecordTime = (log: PeopleLog) =>
  String(log.record_time ?? log.recordTime ?? "");

const getMinutesFromDateTime = (value?: string) => {
  const time = value?.includes(" ") ? value.split(" ")[1] : value;
  const [hour = "0", minute = "0"] = (time || "").split(":");
  return Number(hour) * 60 + Number(minute);
};

const buildTrafficByHour = (logs: PeopleLog[]): TrafficRow[] => {
  if (logs.length === 0) return fallbackTraffic;

  const latestByHour = new Map<number, number>();
  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(" ", "T")) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    latestByHour.set(date.getHours(), getPeopleCount(log));
  });

  return fallbackTraffic.map((row, index) => {
    const hour = index + 8;
    const visitors = latestByHour.get(hour) ?? 0;
    return {
      ...row,
      visitors,
      recommended: Math.max(1, Math.ceil(visitors / 25)),
      wait: Math.max(0, Math.ceil(visitors / 8)),
    };
  });
};

const buildWeeklyPattern = (logs: PeopleLog[]): WeeklyPatternRow[] => {
  if (logs.length === 0) return fallbackWeeklyPattern;

  const rows = fallbackWeeklyPattern.map((row) => ({ ...row }));

  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(" ", "T")) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const hour = date.getHours();
    const count = getPeopleCount(log);

    if (hour >= 9 && hour < 11) rows[dayIndex].morning += count;
    if (hour >= 11 && hour < 14) rows[dayIndex].lunch += count;
    if (hour >= 18 && hour <= 20) rows[dayIndex].evening += count;
  });

  return rows;
};

const riskLevel = (count: number) => {
  if (count >= 30) return "높음";
  if (count >= 15) return "주의";
  return "정상";
};

const severityClass = (severity?: string) => {
  if (severity === "HIGH" || severity === "높음" || severity === "긴급")
    return "bg-red-600";
  if (
    severity === "MEDIUM" ||
    severity === "주의" ||
    severity === "WATCH" ||
    severity === "보강"
  )
    return "bg-amber-500";
  return "bg-emerald-600";
};

export default function CustomerAnalytics() {
  const language = useLanguage();
  const t = translations.customerAnalytics[language];
  const aiTextTranslations: Record<string, Record<string, string>> = {
    '보건증을 네이버 OCR로 처리했습니다. 추출값은 관리자가 최종 확인해야 합니다.': {
      ko: '보건증을 네이버 OCR로 처리했습니다. 추출값은 관리자가 최종 확인해야 합니다.',
      en: 'Health certificate processed via Naver OCR. Extracted values must be reviewed by an administrator.',
      ja: '健康診断証明書はNaver OCRで処理されました。抽出値は管理者が最終確認する必要があります。',
    },
    '분석 실행 중': { ko: '분석 실행 중', en: 'Analysis running', ja: '分析実行中' },
    '분석 대기': { ko: '분석 대기', en: 'Analysis pending', ja: '分析待機' },
    '높음': { ko: '높음', en: 'High', ja: '高' },
    '주의': { ko: '주의', en: 'Watch', ja: '注意' },
    '정상': { ko: '정상', en: 'Normal', ja: '正常' },
    '실시간 분석 데이터를 불러오지 못했습니다.': { ko: '실시간 분석 데이터를 불러오지 못했습니다.', en: 'Failed to load live analysis data.', ja: 'リアルタイム分析データを読み込めませんでした。' },
    '처리 프레임': { ko: '처리 프레임', en: 'processed frames', ja: '処理フレーム' },
    '드롭 프레임': { ko: '드롭 프레임', en: 'dropped frames', ja: 'ドロップフレーム' },
    '큐': { ko: '큐', en: 'queue', ja: 'キュー' },
    '혼잡도': { ko: '혼잡도', en: 'Congestion', ja: '混雑度' },
    '분석 신뢰도': { ko: '분석 신뢰도', en: 'Analysis confidence', ja: '分析信頼度' },
    '전송 샘플': { ko: '전송 샘플', en: 'transmitted samples', ja: '送信サンプル' },
    'AI 분석 결과입니다.': { ko: 'AI 분석 결과입니다.', en: 'AI analysis result.', ja: 'AI分析の結果です。' },
    '현재 매장 위험도는': { ko: '현재 매장 위험도는', en: 'Current store risk level is', ja: '現在の店舗のリスクレベルは' },
    '최근 집계 평균은': { ko: '최근 집계 평균은', en: 'Recent average is', ja: '最近の集計平均は' },
    '최대 인원은': { ko: '최대 인원은', en: 'Maximum is', ja: '最大人数は' },
    '입니다': { ko: '입니다', en: '.', ja: '。' },
    'CCTV 분석 루프의 최신 값을 기준으로 판단했습니다.': { ko: 'CCTV 분석 루프의 최신 값을 기준으로 판단했습니다.', en: 'Judged based on the latest values from the CCTV analysis loop.', ja: 'CCTV分析ループの最新値に基づいて判断しました。' },
    '인력 배치 확인': { ko: '인력 배치 확인', en: 'Check staffing', ja: '人員配置を確認' },
    '현재 배치 유지': { ko: '현재 배치 유지', en: 'Keep current staffing', ja: '現在の配置を維持' },
    'OpenCV 분석이 실행 중입니다': { ko: 'OpenCV 분석이 실행 중입니다', en: 'OpenCV analysis is running', ja: 'OpenCV分析が実行中です' },
    'OpenCV 분석이 대기 중입니다': { ko: 'OpenCV 분석이 대기 중입니다', en: 'OpenCV analysis is pending', ja: 'OpenCV分析が待機中です' },
    '모니터링 계속': { ko: '모니터링 계속', en: 'Continue monitoring', ja: 'モニタリングを継続' },
    'CCTV 분석 시작': { ko: 'CCTV 분석 시작', en: 'Start CCTV analysis', ja: 'CCTV分析を開始' },
    '분석 상태': { ko: '분석 상태', en: 'Analysis status', ja: '分析状況' },
    '새로고침으로 분석': { ko: '새로고침으로 분석', en: 'Analyze by refresh', ja: 'リフレッシュで分析' },
    '실시간 분석 데이터 동기화 실패': { ko: '실시간 분석 데이터 동기화 실패', en: 'Live analysis data sync failed', ja: 'リアルタイム分析データの同期に失敗しました' },
    'OpenAI 분석': { ko: 'OpenAI 분석', en: 'OpenAI analysis', ja: 'OpenAI 分析' },
    'AI fallback 분석': { ko: 'AI fallback 분석', en: 'AI fallback analysis', ja: 'AIフォールバック分析' },
    'OpenAI 인사이트 분석 요청에 실패했습니다.': { ko: 'OpenAI 인사이트 분석 요청에 실패했습니다.', en: 'OpenAI insight analysis request failed.', ja: 'OpenAIインサイト分析リクエストに失敗しました。' },
    'OpenAI 인사이트 분석 실패': { ko: 'OpenAI 인사이트 분석 실패', en: 'OpenAI insight analysis failed', ja: 'OpenAIインサイト分析に失敗しました' },
    'AI 분석 중': { ko: 'AI 분석 중', en: 'AI analyzing...', ja: 'AI分析中' },
    '대기': { ko: '대기', en: 'Idle', ja: '待機中' },
    '최신 CCTV 집계 최대 인원은': { ko: '최신 CCTV 집계 최대 인원은', en: 'Latest CCTV max count is', ja: '最新CCTV集計の最大人数は' },
    '을 기준으로 계산했습니다.': { ko: '을 기준으로 계산했습니다.', en: ' calculated based on.', ja: 'を基準に算出しました。' },
    '예상 대기': { ko: '예상 대기', en: 'Estimated wait', ja: '推定待ち時間' },
    '명': { ko: '명', en: ' people', ja: '人' },
    'URGENT': { ko: '긴급', en: 'URGENT', ja: '緊急' },
    'WATCH': { ko: '주의', en: 'WATCH', ja: '注意' },
    'NORMAL': { ko: '정상', en: 'NORMAL', ja: '正常' },
  };

  const translateAiText = (text?: string) => {
    if (!text) return text || '';
    const m = aiTextTranslations[text];
    return m ? (m[language] || m['en']) : text;
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const contentBg = isDark ? '#141414' : '#fff';
  const [activeTab, setActiveTab] = useState<TabKey>("live");
  const [peopleLogs, setPeopleLogs] = useState<PeopleLog[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<PeopleLog[]>([]);
  const [metrics, setMetrics] = useState<CctvMetrics | null>(null);
  const [aggregate, setAggregate] = useState<CctvAggregate | null>(null);
  const [aiResult, setAiResult] = useState<AiInsightResponse | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState("-");
  const [syncError, setSyncError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#c8c8c8' : '#555';
  const cardBg = isDark ? '#141414' : 'rgba(230,245,200,0.35)';

  const currentBranch =
    stores.find((s) => s.id === selectedBranchId)?.name ||
    branchNames[selectedBranchId || "migeum"] ||
    sessionStorage.getItem("store_name") ||
    "선택 매장";

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : "/admin/branch-selection" },
  ];

  const storeId = resolveStoreId(selectedBranchId);
  const trafficByHour = useMemo(
    () => buildTrafficByHour(peopleLogs),
    [peopleLogs],
  );
  const weeklyPattern = useMemo(
    () => buildWeeklyPattern(weeklyLogs),
    [weeklyLogs],
  );
  const peakHour = useMemo(
    () =>
      trafficByHour.reduce(
        (max, row) => (row.visitors > max.visitors ? row : max),
        trafficByHour[0],
      ),
    [trafficByHour],
  );
  const todayTotalVisitors = useMemo(
    () => peopleLogs.reduce((sum, log) => sum + getPeopleCount(log), 0),
    [peopleLogs],
  );
  const currentCount =
    metrics?.lastCustomerCount ?? aggregate?.aggregate?.lastCustomerCount ?? 0;
  const avgCount = aggregate?.aggregate?.avgCustomerCount ?? 0;
  const maxCount = aggregate?.aggregate?.maxCustomerCount ?? peakHour.visitors;

  const fallbackInsights = [
    {
      label: translateAiText("혼잡도"),
      title: `${translateAiText('현재 매장 위험도는')} ${translateAiText(riskLevel(currentCount))}${translateAiText('입니다')}`,
      body: `${translateAiText('최근 집계 평균은')} ${avgCount}${translateAiText('명')}, ${translateAiText('최대 인원은')} ${maxCount}${translateAiText('명')}${translateAiText('입니다')} ${translateAiText('CCTV 분석 루프의 최신 값을 기준으로 판단했습니다.')}`,
      action: translateAiText(currentCount >= 15 ? "인력 배치 확인" : "현재 배치 유지"),
      impact: translateAiText(riskLevel(currentCount)),
    },
    {
      label: translateAiText("분석 상태"),
      title: metrics?.running
        ? translateAiText("OpenCV 분석이 실행 중입니다")
        : translateAiText("OpenCV 분석이 대기 중입니다"),
      body: `${translateAiText('처리 프레임')} ${metrics?.processedFrames ?? 0}, ${translateAiText('드롭 프레임')} ${metrics?.droppedFrames ?? 0}, ${translateAiText('큐')} ${metrics?.queueSize ?? 0}`,
      action: metrics?.running ? translateAiText("모니터링 계속") : translateAiText("CCTV 분석 시작"),
      impact: metrics?.running ? translateAiText("정상") : translateAiText("주의"),
    },
  ];

  const renderedInsights =
    aiResult?.insights?.map((insight) => ({
      label: translateAiText(insight.badge || insight.type || "AI"),
      title: translateAiText(insight.title || "-"),
      body: translateAiText(insight.message || insight.reason || "-"),
      action: translateAiText(insight.actionLabel || (language === 'ko' ? '확인' : language === 'ja' ? '確認' : 'Check')),
      impact: translateAiText(insight.severity || "LOW"),
    })) || fallbackInsights;

  const scheduleRecommendations = aiResult?.scheduleRecommendations?.map(
    (row) => ({
      time: row.timeRange || peakHour.time,
      current: row.currentStaff ?? currentCount,
      recommended:
        row.recommendedStaff ?? Math.max(1, Math.ceil(maxCount / 25)),
      status: row.status || "NORMAL",
      reason: translateAiText(row.reason || "AI 분석 결과입니다."),
    }),
  ) || [
    {
      time: peakHour.time,
      current: currentCount,
      recommended: Math.max(1, Math.ceil(maxCount / 25)),
      status: maxCount >= 30 ? "URGENT" : maxCount >= 15 ? "WATCH" : "NORMAL",
      reason: `${translateAiText('최신 CCTV 집계 최대 인원은')} ${maxCount}${translateAiText('명')}${translateAiText('을 기준으로 계산했습니다.')}`, 
    },
  ];

  const kpis = [
    {
      title: t.kpiStoreCount,
      value: `${currentCount}${translateAiText('명')}`,
      delta: `${translateAiText(metrics?.running ? "분석 실행 중" : "분석 대기")} | ${lastSyncedAt}`,
      icon: Users,
      tone: GREEN,
    },
    {
      title: t.kpiLogCount,
      value: `${todayTotalVisitors}${translateAiText('명')}`,
      delta: `people_log ${peopleLogs.length}건`,
      icon: Activity,
      tone: GREEN,
    },
    {
      title: t.kpiAiSource,
      value: aiResult?.source === "llm" ? translateAiText('OpenAI 분석') : (aiResult?.source ? translateAiText(aiResult.source) : translateAiText('대기')),
      delta: aiResult?.summary?.riskLevel
        ? `risk ${aiResult.summary.riskLevel}`
        : translateAiText("새로고침으로 분석"),
      icon: Brain,
      tone: '#F59E0B',
    },
    {
      title: t.kpiFrames,
      value: `${metrics?.processedFrames ?? 0}`,
      delta: `confidence ${metrics?.lastConfidenceAvg ?? 0}`,
      icon: Wallet,
      tone: '#8B5CF6',
    },
  ];

  const operatingMetrics = [
    {
      label: translateAiText("혼잡도"),
      value: translateAiText(riskLevel(currentCount)),
      width: `${Math.min(100, currentCount * 3)}%`,
      color: "#F97316",
    },
    {
      label: translateAiText("분석 신뢰도"),
      value: String(metrics?.lastConfidenceAvg ?? 0),
      width: `${Math.round((metrics?.lastConfidenceAvg ?? 0) * 100)}%`,
      color: "#3B82F6",
    },
    {
      label: translateAiText("처리 프레임"),
      value: String(metrics?.processedFrames ?? 0),
      width: `${Math.min(100, (metrics?.processedFrames ?? 0) / 10)}%`,
      color: GREEN,
    },
    {
      label: translateAiText("전송 샘플"),
      value: String(aggregate?.aggregate?.sampleCount ?? 0),
      width: `${Math.min(100, (aggregate?.aggregate?.sampleCount ?? 0) * 8)}%`,
      color: "#8B5CF6",
    },
  ];

  const loadLiveData = async () => {
    const today = toDateText(new Date());
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const query = new URLSearchParams({
      store_id: String(storeId),
      start_date: `${today} 00:00:00`,
      end_date: `${today} 23:59:59`,
    });
    const weeklyQuery = new URLSearchParams({
      store_id: String(storeId),
      start_date: `${toDateText(weekStart)} 00:00:00`,
      end_date: `${toDateText(weekEnd)} 23:59:59`,
    });
    const [logsRes, metricsRes, aggregateRes, weeklyLogsRes] =
      await Promise.all([
        fetch(`${API_BASE}/people_log?${query.toString()}`),
        fetch(`${API_BASE}/cctv/metrics`),
        fetch(`${API_BASE}/cctv/aggregate/latest`),
        fetch(`${API_BASE}/people_log?${weeklyQuery.toString()}`),
      ]);

    if (!logsRes.ok || !metricsRes.ok || !aggregateRes.ok || !weeklyLogsRes.ok) {
      throw new Error(translateAiText('실시간 분석 데이터를 불러오지 못했습니다.'));
    }

    const [logsData, metricsData, aggregateData, weeklyLogsData] =
      await Promise.all([
        logsRes.json(),
        metricsRes.json(),
        aggregateRes.json(),
        weeklyLogsRes.json(),
      ]);

    setPeopleLogs(Array.isArray(logsData) ? logsData : []);
    setWeeklyLogs(Array.isArray(weeklyLogsData) ? weeklyLogsData : []);
    setMetrics(metricsData);
    setAggregate(aggregateData);
    setLastSyncedAt(
      new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
    setSyncError("");

    return { logsData, metricsData, aggregateData };
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      await loadLiveData();
      const today = toDateText(new Date());
      const response = await fetch(`${API_BASE}/ai-insights/analyze/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: String(storeId),
          shift_store_id: resolveShiftStoreId(selectedBranchId),
          date: today,
          start_date: `${today} 00:00:00`,
          end_date: `${today} 23:59:59`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `${translateAiText('OpenAI 인사이트 분석 요청에 실패했습니다.')} (${response.status}) ${errorText}`,
        );
      }

      setAiResult(await response.json());
      setSyncError("");
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : translateAiText("OpenAI 인사이트 분석 실패"),
      );
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        await loadLiveData();
      } catch (error) {
        if (!cancelled) {
          setSyncError(
            error instanceof Error
              ? error.message
          : translateAiText("실시간 분석 데이터 동기화 실패"),
          );
        }
      }
    };

    sync();
    const intervalId = window.setInterval(sync, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [storeId]);

  return (
    <div style={{ minHeight: '100vh', background: pageBg, backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center', fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />

      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: sidebarBg,
          border: `1px solid ${sidebarBorder}`,
          borderRadius: 20, padding: '16px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          position: 'sticky', top: 140,
          maxHeight: 'calc(100vh - 160px)',
          overflowY: 'auto',
        }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#1a1a1a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: isDark ? '#0a0a0a' : '#fff',
                border: `1px solid ${isDark ? '#1a1a1a' : BORDER_GREEN}`,
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                {stores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sessionStorage.setItem('store_id', s.id);
                      sessionStorage.setItem('store_name', s.name);
                      setBranchDropdownOpen(false);
                      navigate(`/admin/dashboard/${s.id}`);
                    }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                      background: s.id === selectedBranchId ? (isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN) : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = LIGHT_GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = s.id === selectedBranchId ? LIGHT_GREEN : 'transparent'; }}
                  >
                    {s.name}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${isDark ? '#1a1a1a' : '#e5e7eb'}` }} />
                <button
                  onClick={() => { setBranchDropdownOpen(false); navigate('/admin/branch-selection'); }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#888' : '#c8c8c8', fontSize: 12 }}
                  onMouseOver={e => { e.currentTarget.style.background = isDark ? '#141414' : '#f5f5f5'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  + 지점 선택 페이지로
                </button>
              </div>
            )}
          </div>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px', marginBottom: 4,
                  background: isActive ? GREEN : 'transparent',
                  border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN),
                  fontSize: 14, fontWeight: 600, textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none',
                }}
                onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; } }}
                onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
              >
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main white card */}
        <div style={{
          flex: 1, minWidth: 0,
          background: mainBg,
          borderRadius: 24,
          padding: '28px 28px 32px',
          boxShadow: '0px 8px 40px rgba(0,0,0,0.18)',
          minHeight: 'calc(100vh - 120px)',
        }}>
          {/* Page title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> {t.backLabel}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Brain size={26} />{t.title}
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{t.subtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={runAiAnalysis}
                disabled={aiLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.7 : 1 }}
              >
                <RefreshCw size={16} style={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
                {aiLoading ? translateAiText('AI 분석 중') : t.refresh}
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Download size={16} />{t.report}
              </button>
            </div>
          </div>

          {/* Sync error */}
          {syncError && (
            <div style={{ marginBottom: 16, borderRadius: 12, border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fca5a5'}`, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', padding: '12px 16px', fontSize: 14, color: isDark ? '#f87171' : '#b91c1c' }}>
              {syncError}
            </div>
          )}

          {/* AI summary banner */}
          {aiResult?.summary && (
            <div style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff', padding: '12px 16px', fontSize: 14, color: '#1e40af' }}>
              <span style={{ fontWeight: 700 }}>{aiResult.source === "llm" ? translateAiText("OpenAI 분석") : translateAiText("AI fallback 분석")} : </span>
              {translateAiText(aiResult.summary.mainMessage)}
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {kpis.map((item) => (
              <div key={item.title} style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#9dc49d' : '#8BA68D', margin: '0 0 8px' }}>{item.title}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 6px' }}>{item.value}</p>
                    <p style={{ fontSize: 12, color: isDark ? '#9dc49d' : '#8BA68D', margin: 0 }}>{item.delta}</p>
                  </div>
                  <item.icon size={22} color={item.tone} style={{ flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Main charts area */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Traffic chart */}
            <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LineChartIcon size={18} color={isDark ? GREEN : DARK_GREEN} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, margin: 0 }}>{t.chartTitle}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: isDark ? '#1a2e1a' : LIGHT_GREEN, borderRadius: 10, padding: 4 }}>
                  {TAB_KEYS.map((value) => {
                    const tabLabelMap: Record<TabKey, string> = { live: t.tabLive, pattern: t.tabPattern, insight: t.tabInsight, schedule: t.tabSchedule };
                    return (
                    <button
                      key={value}
                      onClick={() => setActiveTab(value)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: activeTab === value ? (isDark ? '#2a2a2a' : '#fff') : 'transparent',
                        color: activeTab === value ? (isDark ? GREEN : DARK_GREEN) : (isDark ? '#9dc49d' : '#8BA68D'),
                        boxShadow: activeTab === value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {tabLabelMap[value]}
                    </button>
                  )})}
                </div>
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trafficByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke={LIGHT_GREEN} />
                    <XAxis dataKey="time" tick={{ fill: '#8BA68D', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#8BA68D', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="visitors" name={t.visitors} fill={GREEN} radius={[4, 4, 0, 0]} />
                    <Line dataKey="recommended" name={t.recommendedStaff} stroke="#F97316" strokeWidth={3} strokeDasharray="5 5" />
                    <Line dataKey="wait" name={translateAiText('예상 대기')} stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Current diagnosis */}
            <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={18} color="#F97316" />
                <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, margin: 0 }}>{t.diagnosisTitle}</p>
              </div>
              <div style={{ background: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(249,115,22,0.3)' : '#fed7aa'}`, padding: '14px 16px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#fb923c' : '#c2410c', marginBottom: 4 }}>{t.peakTimeTitle}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: isDark ? '#f97316' : '#7c2d12', margin: '0 0 8px' }}>{peakHour.time}</p>
                <p style={{ fontSize: 13, color: isDark ? '#fb923c' : '#c2410c', margin: 0 }}>
                  {t.peakDesc(peakHour.visitors, peakHour.recommended, peakHour.wait)}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
                  <Calendar size={18} color={DARK_GREEN} style={{ marginBottom: 6 }} />
                  <p style={{ fontSize: 12, color: '#8BA68D', margin: '0 0 4px' }}>{t.lastAnalysis}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: textColor, margin: 0 }}>
                    {metrics?.lastMeasuredAt ? metrics.lastMeasuredAt.slice(11, 19) : "-"}
                  </p>
                </div>
                <div style={{ background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
                  <Wallet size={18} color={DARK_GREEN} style={{ marginBottom: 6 }} />
                  <p style={{ fontSize: 12, color: '#8BA68D', margin: '0 0 4px' }}>{t.aiSourceLabel}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: textColor, margin: 0 }}>{aiResult?.source === "llm" ? translateAiText('OpenAI 분석') : (aiResult?.source ? translateAiText(aiResult.source) : translateAiText('대기'))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly pattern tab */}
          {activeTab === "pattern" && (
            <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, marginBottom: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, marginBottom: 16 }}>{t.weeklyPatternTitle}</p>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyPattern}>
                    <CartesianGrid strokeDasharray="3 3" stroke={LIGHT_GREEN} />
                    <XAxis dataKey="day" tick={{ fill: '#8BA68D' }} />
                    <YAxis tick={{ fill: '#8BA68D' }} />
                    <Tooltip />
                    <Area dataKey="morning" stackId="1" name={t.morning} stroke="#60a5fa" fill="#93c5fd" />
                    <Area dataKey="lunch" stackId="1" name={t.lunch} stroke="#22c55e" fill="#86efac" />
                    <Area dataKey="evening" stackId="1" name={t.evening} stroke="#f97316" fill="#fdba74" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Insights + Operating Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={18} color={isDark ? GREEN : DARK_GREEN} />
                <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, margin: 0 }}>{t.aiInsightTitle}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {renderedInsights.map((insight) => (
                  <div key={insight.title} style={{ background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <Badge variant="outline">{insight.label}</Badge>
                          <Badge className={severityClass(insight.impact)}>{insight.impact}</Badge>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: textColor, margin: '0 0 4px' }}>{insight.title}</p>
                        <p style={{ fontSize: 13, color: '#8BA68D', margin: 0, lineHeight: 1.5 }}>{insight.body}</p>
                      </div>
                      <Button variant="outline" style={{ border: `1px solid ${BORDER_GREEN}`, color: isDark ? GREEN : DARK_GREEN, borderRadius: 8, fontSize: 13, flexShrink: 0 }}>
                        <CheckCircle2 size={14} style={{ marginRight: 4 }} />
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={18} color={GREEN} />
                <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, margin: 0 }}>{t.operatingMetricsTitle}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {operatingMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: '#8BA68D' }}>{metric.label}</span>
                      <span style={{ fontWeight: 700, color: textColor }}>{metric.value}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: isDark ? '#1a2e1a' : LIGHT_GREEN }}>
                      <div style={{ height: 8, borderRadius: 999, background: metric.color, width: metric.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Recommendations Table */}
          <div style={{ background: isDark ? cardBg : 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${isDark ? '#2a2a2a' : LIGHT_GREEN}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={18} color="#F97316" />
              <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN, margin: 0 }}>{t.scheduleRecommendTitle}</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: isDark ? 'rgba(24,160,34,0.1)' : LIGHT_GREEN }}>
                    {[t.colTime, t.colCurrent, t.colRecommended, t.colStatus, t.colReason].map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleRecommendations.map((row, idx) => (
                    <tr key={row.time} style={{ borderBottom: `1px solid ${isDark ? '#1a1a1a' : LIGHT_GREEN}`, background: idx % 2 === 0 ? (isDark ? 'rgba(24,160,34,0.05)' : 'rgba(230,245,200,0.2)') : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: textColor, textAlign: 'center' }}>{row.time}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#8BA68D', textAlign: 'center' }}>{row.current}{translateAiText('명')}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: textColor, fontWeight: 600, textAlign: 'center' }}>{row.recommended}{translateAiText('명')}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Badge className={severityClass(row.status)}>{translateAiText(row.status)}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#8BA68D', textAlign: 'center' }}>{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

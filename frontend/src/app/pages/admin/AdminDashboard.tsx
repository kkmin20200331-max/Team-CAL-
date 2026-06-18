import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  CalendarDays,
  Calendar,
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Loader2,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const API = axios.create({ baseURL: "http://localhost:8080/api" });
const AI_INSIGHT_API = "http://localhost:8080/api/ai-insights";

// ── 유틸 ──
const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** "yyyy-MM-dd HH:mm:ss" → "HH:mm" */
const fmt = (s: string) => {
  if (!s) return "";
  const part = s.includes(" ") ? s.split(" ")[1] : s;
  return part.substring(0, 5);
};

/** 근무 시간 계산 (시간) */
const calcHours = (startAt: string, endAt: string): number => {
  const t1 = (startAt?.split(" ")[1] || "00:00:00").split(":").map(Number);
  const t2 = (endAt?.split(" ")[1] || "00:00:00").split(":").map(Number);
  return Math.max(0, (t2[0] * 60 + t2[1] - t1[0] * 60 - t1[1]) / 60);
};

// ── 인터페이스 ──
interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface UserVO {
  id: string;
  name: string;
  role: string;
  username: string;
}

interface PayInfo {
  pay_type: string; // 'HOURLY' | 'MONTHLY'
  pay_amount: number;
}

interface PeopleLog {
  record_time?: string;
  recordTime?: string;
  people_count?: number;
  peopleCount?: number;
}

interface CustomerTrendRow {
  time: string;
  customers: number;
  staff: number;
}

interface OperationRecommendation {
  title: string;
  body: string;
  actionLabel?: string;
  primary?: boolean;
}

interface AiInsightResponse {
  insights?: Array<{
    type?: string;
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
    reason?: string;
  }>;
}

interface DashboardOperationContext {
  rows: CustomerTrendRow[];
  todayShifts: ShiftVO[];
  totalEmployees: number;
  checkedIn: number;
  substituteCount: number;
  estimatedPay: number;
}

// Dashboard chart base time axis
const customerData = [
  { time: "09:00", customers: 5, staff: 1 },
  { time: "10:00", customers: 8, staff: 1 },
  { time: "11:00", customers: 12, staff: 2 },
  { time: "12:00", customers: 25, staff: 3 },
  { time: "13:00", customers: 28, staff: 3 },
  { time: "14:00", customers: 18, staff: 3 },
  { time: "15:00", customers: 15, staff: 2 },
  { time: "16:00", customers: 12, staff: 2 },
  { time: "17:00", customers: 20, staff: 2 },
  { time: "18:00", customers: 32, staff: 2 },
  { time: "19:00", customers: 28, staff: 2 },
  { time: "20:00", customers: 22, staff: 2 },
];

const branchStoreIds: Record<string, number> = {
  migeum: 1,
  sunae: 2,
  dongcheon: 3,
};

const resolveStoreId = (branchId?: string) => {
  if (!branchId) return 1;
  const numericId = Number(branchId);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return branchStoreIds[branchId] || 1;
};

const getPeopleCount = (log: PeopleLog) =>
  Number(log.people_count ?? log.peopleCount ?? 0);

const getRecordTime = (log: PeopleLog) =>
  String(log.record_time ?? log.recordTime ?? "");

const getMinutesFromDateTime = (value: string) => {
  const time = value?.includes(" ") ? value.split(" ")[1] : value;
  const [hour = "0", minute = "0"] = (time || "").split(":");
  return Number(hour) * 60 + Number(minute);
};

const buildCustomerTrend = (
  logs: PeopleLog[],
  shifts: ShiftVO[],
): CustomerTrendRow[] => {
  const latestCustomersByHour = new Map<number, number>();

  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(" ", "T")) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    latestCustomersByHour.set(date.getHours(), getPeopleCount(log));
  });

  return customerData.map((row) => {
    const hour = Number(row.time.slice(0, 2));
    const hourStart = hour * 60;
    const hourEnd = hourStart + 60;
    const staff = shifts.filter((shift) => {
      const start = getMinutesFromDateTime(shift.start_at);
      const end = getMinutesFromDateTime(shift.end_at);
      return start < hourEnd && end > hourStart;
    }).length;

    return {
      time: row.time,
      customers: latestCustomersByHour.get(hour) ?? 0,
      staff,
    };
  });
};

const getPeakRow = (rows: CustomerTrendRow[]) =>
  rows.reduce(
    (max, row) => (row.customers > max.customers ? row : max),
    rows[0],
  );

const getIdleRow = (rows: CustomerTrendRow[]) =>
  rows.reduce(
    (min, row) => (row.customers < min.customers ? row : min),
    rows[0],
  );

const getKoreanWeekday = () =>
  new Date().toLocaleDateString("ko-KR", { weekday: "long" });

/*
Previous client-side dashboard AI payload builder removed.
const legacyDashboardAiPayload = (context: DashboardOperationContext, storeId: number, storeName: string) => {
  const rows = context.rows;
  const peak = getPeakRow(rows);
  const totalVisitors = rows.reduce((sum, row) => sum + row.customers, 0);
  const maxCustomers = Math.max(...rows.map((row) => row.customers), 0);
  const avgCustomers = Math.max(1, Math.round(totalVisitors / Math.max(rows.length, 1)));

  return {
    storeId,
    storeName,
    storeType: 'CAFE',
    storeTypeLabel: '카페',
    date: toDateStr(new Date()),
    current: {
      currentCustomerCount: peak.customers,
      todayTotalVisitors: totalVisitors,
      conversionRate: 0,
      processedFrames: 0,
      confidenceAvg: 0
    },
    cameraAggregates: rows.map((row) => ({
      time: row.time,
      avgCustomerCount: row.customers,
      maxCustomerCount: row.customers,
      minCustomerCount: Math.max(0, row.customers - 2),
      lastCustomerCount: row.customers,
      workingStaffCount: row.staff,
      recommendedStaffCount: Math.max(1, Math.ceil(row.customers / 15)),
      waitMinutes: Math.max(0, Math.ceil(row.customers / 8))
    })),
    historicalBaseline: {
      sameDayAverageVisitors: Math.max(totalVisitors, 1),
      averagePeakCustomerCount: Math.max(maxCustomers, avgCustomers)
    },
    pos: {
      conversionRate: 0,
      hourlyOrders: rows.map((row) => ({
        time: row.time,
        orderCount: 0,
        conversionRate: 0
      }))
    },
    staffSchedule: rows.map((row) => {
      const hour = Number(row.time.slice(0, 2));
      return {
        timeRange: `${row.time}-${String(hour + 1).padStart(2, '0')}:00`,
        currentStaff: row.staff
      };
    }),
    externalFactors: {
      source: 'admin-dashboard',
      dashboardSummary: {
        totalEmployees: context.totalEmployees,
        todayShiftCount: context.todayShifts.length,
        checkedIn: context.checkedIn,
        substituteCount: context.substituteCount,
        estimatedPay: context.estimatedPay
      }
    }
  };
};

*/
const buildFallbackRecommendations = (
  context: DashboardOperationContext,
): OperationRecommendation[] => {
  const rows = context.rows;
  const peak = getPeakRow(rows);
  const idle = getIdleRow(rows);
  const avgCustomers = Math.round(
    rows.reduce((sum, row) => sum + row.customers, 0) /
      Math.max(rows.length, 1),
  );
  const recommendedStaff = Math.max(1, Math.ceil(peak.customers / 15));
  const extraStaff = Math.max(0, recommendedStaff - peak.staff);
  const nextHour = `${String(Number(peak.time.slice(0, 2)) + 1).padStart(2, "0")}:00`;
  const idleNextHour = `${String(Number(idle.time.slice(0, 2)) + 1).padStart(2, "0")}:00`;
  const increaseRate =
    avgCustomers > 0
      ? Math.round(((peak.customers - avgCustomers) / avgCustomers) * 100)
      : 0;

  return [
    {
      title: "인력 배치 추천",
      body: `${peak.time}~${nextHour} 고객 수가 평균보다 ${Math.max(0, increaseRate)}% 높습니다. 오늘 근무 ${context.todayShifts.length}명, 출근 완료 ${context.checkedIn}명, 현재 해당 시간대 ${peak.staff}명 기준으로 ${extraStaff > 0 ? `대타 ${extraStaff}명 추가 배치` : "현재 배치 유지"}를 권장합니다.`,
      actionLabel: extraStaff > 0 ? "대타 모집하기" : "근무표 확인",
      primary: true,
    },
    {
      title: "피크 운영 액션",
      body: `${peak.time} 전후 방문 흐름이 가장 높고 직원 1명당 약 ${peak.staff > 0 ? Math.round(peak.customers / peak.staff) : peak.customers}명을 대응해야 합니다. 주문/응대 동선을 단순화하고, 피크 전 재고 보충과 포장 준비를 먼저 배정하는 것을 추천합니다.`,
    },
    {
      title: "유휴 시간 업무",
      body: `${getKoreanWeekday()} ${idle.time}~${idleNextHour}는 저혼잡 시간대입니다. 예상 인건비 ${context.estimatedPay.toLocaleString("ko-KR")}원과 현재 대타 모집 ${context.substituteCount}건을 함께 고려해 재고 정리와 청소 체크리스트 배정을 추천합니다.`,
    },
  ];
};

const mapAiRecommendations = (
  aiResult: AiInsightResponse | null,
  fallback: OperationRecommendation[],
): OperationRecommendation[] => {
  if (!aiResult) return fallback;

  const schedule = aiResult.scheduleRecommendations?.[0];
  const staffingInsight = aiResult.insights?.find(
    (item) => item.type === "STAFFING" || item.type === "CONGESTION",
  );

  return [
    {
      title: "인력 배치 추천",
      body: schedule
        ? `${schedule.timeRange || fallback[0].title} 현재 ${schedule.currentStaff ?? 0}명 근무 중입니다. ${schedule.reason || `${schedule.recommendedExtraStaff ?? 0}명 추가 배치를 권장합니다.`}`
        : staffingInsight?.message ||
          staffingInsight?.reason ||
          fallback[0].body,
      actionLabel:
        (schedule?.recommendedExtraStaff ?? 0) > 0
          ? "대타 모집하기"
          : "근무표 확인",
      primary: true,
    },
    fallback[1],
    fallback[2],
  ];
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.adminDashboard[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const currentBranch = sessionStorage.getItem("store_name") || "지점 선택";

  // ── 상태 ──
  const [loading, setLoading] = useState(true);
  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, UserVO>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [payMap, setPayMap] = useState<Record<string, PayInfo>>({});
  const [substituteCount, setSubstituteCount] = useState(0);
  const [customerTrendData, setCustomerTrendData] =
    useState<CustomerTrendRow[]>(customerData);
  const [customerTrendSyncedAt, setCustomerTrendSyncedAt] = useState("");
  const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        const today = toDateStr(new Date());

        const [shiftRes, userRes, subRes, peopleLogRes] =
          await Promise.allSettled([
            API.get("/shift", {
              params: {
                store_id: branchId,
                start_date: today,
                end_date: today,
              },
            }),
            API.get("/users", { params: { store_id: branchId } }),
            API.get("/substitute", { params: { store_id: branchId } }),
            API.get("/people_log", {
              params: {
                store_id: resolveStoreId(branchId),
                start_date: `${today} 00:00:00`,
                end_date: `${today} 23:59:59`,
              },
            }),
          ]);

        // 오늘 근무표
        const shifts: ShiftVO[] =
          shiftRes.status === "fulfilled" && Array.isArray(shiftRes.value.data)
            ? shiftRes.value.data
            : [];
        setTodayShifts(shifts);

        // 직원 맵
        const users: UserVO[] =
          userRes.status === "fulfilled" && Array.isArray(userRes.value.data)
            ? userRes.value.data
            : [];
        setTotalEmployees(users.length);
        const empMap: Record<string, UserVO> = {};
        users.forEach((u) => {
          empMap[u.id] = u;
        });
        setEmployeeMap(empMap);

        // 대타 오픈 건수
        const subs =
          subRes.status === "fulfilled" && Array.isArray(subRes.value.data)
            ? subRes.value.data
            : [];
        setSubstituteCount(
          subs.filter((s: any) => (s.status || "").toLowerCase() === "open")
            .length,
        );

        const peopleLogs: PeopleLog[] =
          peopleLogRes.status === "fulfilled" &&
          Array.isArray(peopleLogRes.value.data)
            ? peopleLogRes.value.data
            : [];
        setCustomerTrendData(buildCustomerTrend(peopleLogs, shifts));
        setCustomerTrendSyncedAt(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );

        // 시급/급여 조회 (오늘 근무자 한정)
        const uniqueIds = [...new Set(shifts.map((s) => s.user_id))];
        if (uniqueIds.length > 0) {
          const payResults = await Promise.allSettled(
            uniqueIds.map((uid) =>
              API.get("/store_member/pay", {
                params: { user_id: uid, store_id: branchId },
              }).then((r) => ({ uid, data: r.data as PayInfo })),
            ),
          );
          const pm: Record<string, PayInfo> = {};
          payResults.forEach((r) => {
            if (r.status === "fulfilled" && r.value.data)
              pm[r.value.uid] = r.value.data;
          });
          setPayMap(pm);
        }
      } catch (err) {
        console.error("[AdminDashboard] 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    const refreshCustomerTrend = async () => {
      try {
        const today = toDateStr(new Date());
        const [shiftRes, peopleLogRes] = await Promise.allSettled([
          API.get("/shift", {
            params: { store_id: branchId, start_date: today, end_date: today },
          }),
          API.get("/people_log", {
            params: {
              store_id: resolveStoreId(branchId),
              start_date: `${today} 00:00:00`,
              end_date: `${today} 23:59:59`,
            },
          }),
        ]);

        const shifts: ShiftVO[] =
          shiftRes.status === "fulfilled" && Array.isArray(shiftRes.value.data)
            ? shiftRes.value.data
            : [];
        const peopleLogs: PeopleLog[] =
          peopleLogRes.status === "fulfilled" &&
          Array.isArray(peopleLogRes.value.data)
            ? peopleLogRes.value.data
            : [];

        setTodayShifts(shifts);
        setCustomerTrendData(buildCustomerTrend(peopleLogs, shifts));
        setCustomerTrendSyncedAt(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch (err) {
        console.error("[AdminDashboard] customer trend refresh failed:", err);
      }
    };

    load();
    const intervalId = window.setInterval(refreshCustomerTrend, 5000);

    return () => window.clearInterval(intervalId);
  }, [branchId]);

  // ── 파생 값 ──
  const checkedIn = todayShifts.filter(
    (s) => (s.status || "").toUpperCase() === "CHECKED_IN",
  ).length;

  const estimatedPay = todayShifts.reduce((sum, shift) => {
    const pay = payMap[shift.user_id];
    if (!pay || pay.pay_type !== "HOURLY") return sum;
    return sum + pay.pay_amount * calcHours(shift.start_at, shift.end_at);
  }, 0);

  const operationContext: DashboardOperationContext = {
    rows: customerTrendData,
    todayShifts,
    totalEmployees,
    checkedIn,
    substituteCount,
    estimatedPay,
  };

  useEffect(() => {
    if (!branchId || customerTrendData.length === 0) return;

    let cancelled = false;

    const loadAiInsight = async () => {
      try {
        const today = toDateStr(new Date());
        const response = await fetch(`${AI_INSIGHT_API}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: String(resolveStoreId(branchId)),
            shift_store_id: branchId,
            date: today,
            start_date: `${today} 00:00:00`,
            end_date: `${today} 23:59:59`,
            mode: "dashboard",
          }),
        });

        if (!response.ok) {
          throw new Error("AI insight request failed");
        }

        const data = await response.json();
        if (!cancelled) setAiInsight(data);
      } catch (err) {
        if (!cancelled) {
          setAiInsight(null);
          console.error("[AdminDashboard] AI insight load failed:", err);
        }
      }
    };

    loadAiInsight();

    return () => {
      cancelled = true;
    };
  }, [
    branchId,
    currentBranch,
    customerTrendData,
    todayShifts,
    totalEmployees,
    checkedIn,
    substituteCount,
    estimatedPay,
  ]);

  const fallbackRecommendations =
    buildFallbackRecommendations(operationContext);
  const operationRecommendations = mapAiRecommendations(
    aiInsight,
    fallbackRecommendations,
  );

  const getStatusLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_IN') return t.statusCheckedIn;
    if (s === 'CHECKED_OUT') return t.statusCheckedOut;
    if (s === 'ABSENT') return t.statusAbsent;
    return t.statusBeforeWork;
  };

  const pageBg = isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg = isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "CHECKED_IN") return { background: LIGHT_GREEN, color: DARK_GREEN };
    if (s === "ABSENT") return { background: '#fee2e2', color: '#ef4444' };
    if (s === "CHECKED_OUT") return { background: '#dbeafe', color: '#1d4ed8' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const menuItems = [
    { icon: Calendar, label: t.menuItems.scheduleManagement, path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: t.menuItems.substituteRecruitment, path: `/admin/substitute/${branchId}` },
    { icon: Users, label: t.menuItems.employeeManagement, path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: t.menuItems.payrollManagement, path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: t.menuItems.documentManagement, path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: t.menuItems.board, path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: t.menuItems.aiAnalytics, path: `/admin/analytics/${branchId}` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.mainDashboard}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
      </AdminHeader>

      {/* Nav shortcuts */}
      <div style={{ background: isDark ? '#2c2c2e' : 'rgba(255,255,255,0.7)', borderBottom: `1px solid ${BORDER_GREEN}`, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: DARK_GREEN, whiteSpace: 'nowrap' }}>
              <item.icon size={15} />{item.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 40px' }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: t.todayStaff, value: loading ? null : todayShifts.length, sub: loading ? null : t.checkedInCount(checkedIn), icon: <Users size={18} color={GREEN} />, subColor: subTextColor },
            { label: t.registeredStaff, value: loading ? null : totalEmployees, sub: loading ? null : t.allStaffThisBranch, icon: <TrendingUp size={18} color={GREEN} />, subColor: GREEN },
            { label: t.substituteRecruiting, value: loading ? null : substituteCount, sub: loading ? null : (substituteCount > 0 ? t.waitingForApplicants : t.noOpenings), icon: <AlertCircle size={18} color={substituteCount > 0 ? '#f59e0b' : GREEN} />, subColor: subTextColor },
            { label: t.estimatedLaborCost, value: loading ? null : `₩${estimatedPay.toLocaleString("ko-KR")}`, sub: loading ? null : t.hourlyBasis, icon: <DollarSign size={18} color={DARK_GREEN} />, subColor: subTextColor },
          ].map(({ label, value, sub, icon, subColor }) => (
            <div key={label} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, padding: '16px 20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: subTextColor }}>{label}</p>
                {icon}
              </div>
              {value === null ? <Loader2 size={18} style={{ color: subTextColor }} /> : (
                <>
                  <p style={{ fontSize: 24, fontWeight: 700, color: textColor }}>{value}</p>
                  <p style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{sub}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* 실시간 추이 */}
          <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, fontWeight: 700, color: textColor }}>
              {t.realtimeTrend}
              <span style={{ fontSize: 11, color: subTextColor, fontWeight: 400 }}>{t.sampleData}</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={customerTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3a3a3c' : '#e5e7eb'} />
                <XAxis dataKey="time" tick={{ fill: subTextColor, fontSize: 11 }} />
                <YAxis tick={{ fill: subTextColor, fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="customers" stroke={GREEN} name={t.customers} strokeWidth={2} />
                <Line type="monotone" dataKey="staff" stroke={DARK_GREEN} name={t.workingStaff} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 운영 알림 */}
          <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 14 }}>{t.todayAlerts}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!loading && substituteCount > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#fef3c7', border: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>{t.substituteAlert(substituteCount)}</p>
                  <p style={{ fontSize: 11, color: '#b45309' }}>{t.checkApplicants}</p>
                </div>
              )}
              {!loading && checkedIn < todayShifts.length && todayShifts.length > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, marginBottom: 2 }}>{t.absentAlert(todayShifts.length - checkedIn)}</p>
                  <p style={{ fontSize: 11, color: DARK_GREEN }}>{t.checkAttendance}</p>
                </div>
              )}
              {!loading && todayShifts.length === 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: isDark ? '#3a3a3c' : '#f9fafb', border: `1px solid ${isDark ? '#555' : '#e5e7eb'}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: textColor, marginBottom: 2 }}>{t.noWorkToday}</p>
                  <p style={{ fontSize: 11, color: subTextColor }}>{t.checkSchedule}</p>
                </div>
              )}
              <div style={{ padding: '10px 14px', borderRadius: 12, background: '#fef3c7', border: '1px solid #fcd34d' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>{t.healthCertExpiry}</p>
                <p style={{ fontSize: 11, color: '#b45309' }}>{t.checkDocuments}</p>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, marginBottom: 2 }}>{t.nextWeekSchedule}</p>
                <p style={{ fontSize: 11, color: DARK_GREEN }}>{t.writeInSchedule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘 근무자 + AI 추천 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 14 }}>{t.todayWorkerList}</p>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Loader2 size={24} style={{ color: subTextColor }} /></div>
            ) : todayShifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: subTextColor, fontSize: 13 }}>{t.noWorkersToday}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayShifts.map((shift) => {
                  const emp = employeeMap[shift.user_id];
                  const name = emp?.name || t.unknown;
                  const bs = getStatusBadgeStyle(shift.status);
                  return (
                    <div key={shift.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? '#3a3a3c' : LIGHT_GREEN, borderRadius: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{name[0]}</div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13, color: textColor }}>{name}</p>
                          <p style={{ fontSize: 11, color: subTextColor, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{fmt(shift.start_at)} ~ {fmt(shift.end_at)}</p>
                        </div>
                      </div>
                      <span style={{ ...bs, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{getStatusLabel(shift.status)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI 운영 추천 */}
          <div style={{ background: isDark ? '#2c2c2e' : 'rgba(230,245,200,0.5)', border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 16, fontWeight: 700, color: textColor }}>
              <BarChart3 size={18} color={DARK_GREEN} />{t.aiRecommendation}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: isDark ? '#3a3a3c' : '#fff', borderRadius: 14, padding: '14px', border: `2px solid ${DARK_GREEN}` }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: DARK_GREEN, marginBottom: 6 }}>{t.staffingRecommendation}</h4>
                <p style={{ fontSize: 12, color: subTextColor, marginBottom: 10 }}>{t.staffingBody}</p>
                <button onClick={() => navigate(`/admin/substitute/${branchId}`)} style={{ width: '100%', padding: '8px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t.recruitSubstitute}</button>
              </div>
              <div style={{ background: isDark ? '#3a3a3c' : '#fff', borderRadius: 14, padding: '14px', border: `1px solid ${BORDER_GREEN}` }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: textColor, marginBottom: 6 }}>{t.menuRecommendation}</h4>
                <p style={{ fontSize: 12, color: subTextColor }}>{t.menuBody}</p>
              </div>
              <div style={{ background: isDark ? '#3a3a3c' : '#fff', borderRadius: 14, padding: '14px', border: `1px solid ${BORDER_GREEN}` }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: textColor, marginBottom: 6 }}>{t.idleTimeTask}</h4>
                <p style={{ fontSize: 12, color: subTextColor }}>{t.idleBody}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { icon: CalendarDays, label: t.viewSchedule, path: `/admin/schedule/monthly/${branchId}` },
            { icon: UserPlus, label: t.recruitSubNav, path: `/admin/substitute/${branchId}` },
            { icon: BarChart3, label: t.customerAnalytics, path: `/admin/analytics/${branchId}` },
            { icon: Wallet, label: t.payrollManagement, path: `/admin/cctv/${branchId}` },
          ].map(({ icon: Icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{ height: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: DARK_GREEN, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
              <Icon size={22} color={GREEN} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

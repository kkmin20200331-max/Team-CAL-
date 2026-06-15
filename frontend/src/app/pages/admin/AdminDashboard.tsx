import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  FileWarning,
  CalendarDays,
  Menu,
  Home,
  Calendar,
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Camera,
  Settings,
  ChevronRight,
  Store,
  Loader2
} from 'lucide-react';
import ProfilePanel from '../../components/admin/ProfilePanel';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });
const AI_INSIGHT_API = 'http://localhost:8000/api/v1/ai-insights';

// ── 유틸 ──
const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** "yyyy-MM-dd HH:mm:ss" → "HH:mm" */
const fmt = (s: string) => {
  if (!s) return '';
  const part = s.includes(' ') ? s.split(' ')[1] : s;
  return part.substring(0, 5);
};

/** 근무 시간 계산 (시간) */
const calcHours = (startAt: string, endAt: string): number => {
  const t1 = (startAt?.split(' ')[1] || '00:00:00').split(':').map(Number);
  const t2 = (endAt?.split(' ')[1] || '00:00:00').split(':').map(Number);
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
  pay_type: string;   // 'HOURLY' | 'MONTHLY'
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
  { time: '09:00', customers: 5, staff: 1 },
  { time: '10:00', customers: 8, staff: 1 },
  { time: '11:00', customers: 12, staff: 2 },
  { time: '12:00', customers: 25, staff: 3 },
  { time: '13:00', customers: 28, staff: 3 },
  { time: '14:00', customers: 18, staff: 3 },
  { time: '15:00', customers: 15, staff: 2 },
  { time: '16:00', customers: 12, staff: 2 },
  { time: '17:00', customers: 20, staff: 2 },
  { time: '18:00', customers: 32, staff: 2 },
  { time: '19:00', customers: 28, staff: 2 },
  { time: '20:00', customers: 22, staff: 2 },
];

const branchStoreIds: Record<string, number> = {
  migeum: 1,
  sunae: 2,
  dongcheon: 3
};

const resolveStoreId = (branchId?: string) => {
  if (!branchId) return 1;
  const numericId = Number(branchId);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return branchStoreIds[branchId] || 1;
};

const getPeopleCount = (log: PeopleLog) => Number(log.people_count ?? log.peopleCount ?? 0);

const getRecordTime = (log: PeopleLog) => String(log.record_time ?? log.recordTime ?? '');

const getMinutesFromDateTime = (value: string) => {
  const time = value?.includes(' ') ? value.split(' ')[1] : value;
  const [hour = '0', minute = '0'] = (time || '').split(':');
  return Number(hour) * 60 + Number(minute);
};

const buildCustomerTrend = (logs: PeopleLog[], shifts: ShiftVO[]): CustomerTrendRow[] => {
  const latestCustomersByHour = new Map<number, number>();

  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(' ', 'T')) : null;
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
      staff
    };
  });
};

const getPeakRow = (rows: CustomerTrendRow[]) =>
  rows.reduce((max, row) => (row.customers > max.customers ? row : max), rows[0]);

const getIdleRow = (rows: CustomerTrendRow[]) =>
  rows.reduce((min, row) => (row.customers < min.customers ? row : min), rows[0]);

const getKoreanWeekday = () =>
  new Date().toLocaleDateString('ko-KR', { weekday: 'long' });

const buildAiPayload = (context: DashboardOperationContext, storeId: number, storeName: string) => {
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

const buildFallbackRecommendations = (context: DashboardOperationContext): OperationRecommendation[] => {
  const rows = context.rows;
  const peak = getPeakRow(rows);
  const idle = getIdleRow(rows);
  const avgCustomers = Math.round(rows.reduce((sum, row) => sum + row.customers, 0) / Math.max(rows.length, 1));
  const recommendedStaff = Math.max(1, Math.ceil(peak.customers / 15));
  const extraStaff = Math.max(0, recommendedStaff - peak.staff);
  const nextHour = `${String(Number(peak.time.slice(0, 2)) + 1).padStart(2, '0')}:00`;
  const idleNextHour = `${String(Number(idle.time.slice(0, 2)) + 1).padStart(2, '0')}:00`;
  const increaseRate = avgCustomers > 0 ? Math.round(((peak.customers - avgCustomers) / avgCustomers) * 100) : 0;

  return [
    {
      title: '인력 배치 추천',
      body: `${peak.time}~${nextHour} 고객 수가 평균보다 ${Math.max(0, increaseRate)}% 높습니다. 오늘 근무 ${context.todayShifts.length}명, 출근 완료 ${context.checkedIn}명, 현재 해당 시간대 ${peak.staff}명 기준으로 ${extraStaff > 0 ? `대타 ${extraStaff}명 추가 배치` : '현재 배치 유지'}를 권장합니다.`,
      actionLabel: extraStaff > 0 ? '대타 모집하기' : '근무표 확인',
      primary: true
    },
    {
      title: '피크 운영 액션',
      body: `${peak.time} 전후 방문 흐름이 가장 높고 직원 1명당 약 ${peak.staff > 0 ? Math.round(peak.customers / peak.staff) : peak.customers}명을 대응해야 합니다. 주문/응대 동선을 단순화하고, 피크 전 재고 보충과 포장 준비를 먼저 배정하는 것을 추천합니다.`
    },
    {
      title: '유휴 시간 업무',
      body: `${getKoreanWeekday()} ${idle.time}~${idleNextHour}는 저혼잡 시간대입니다. 예상 인건비 ${context.estimatedPay.toLocaleString('ko-KR')}원과 현재 대타 모집 ${context.substituteCount}건을 함께 고려해 재고 정리와 청소 체크리스트 배정을 추천합니다.`
    }
  ];
};

const mapAiRecommendations = (
  aiResult: AiInsightResponse | null,
  fallback: OperationRecommendation[]
): OperationRecommendation[] => {
  if (!aiResult) return fallback;

  const schedule = aiResult.scheduleRecommendations?.[0];
  const staffingInsight = aiResult.insights?.find((item) => item.type === 'STAFFING' || item.type === 'CONGESTION');

  return [
    {
      title: '인력 배치 추천',
      body: schedule
        ? `${schedule.timeRange || fallback[0].title} 현재 ${schedule.currentStaff ?? 0}명 근무 중입니다. ${schedule.reason || `${schedule.recommendedExtraStaff ?? 0}명 추가 배치를 권장합니다.`}`
        : staffingInsight?.message || staffingInsight?.reason || fallback[0].body,
      actionLabel: (schedule?.recommendedExtraStaff ?? 0) > 0 ? '대타 모집하기' : '근무표 확인',
      primary: true
    },
    fallback[1],
    fallback[2]
  ];
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { branchId } = useParams();

  const currentBranch = localStorage.getItem('store_name') || '지점 선택';

  // ── 상태 ──
  const [loading, setLoading] = useState(true);
  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, UserVO>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [payMap, setPayMap] = useState<Record<string, PayInfo>>({});
  const [substituteCount, setSubstituteCount] = useState(0);
  const [customerTrendData, setCustomerTrendData] = useState<CustomerTrendRow[]>(customerData);
  const [customerTrendSyncedAt, setCustomerTrendSyncedAt] = useState('');
  const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        const today = toDateStr(new Date());

        const [shiftRes, userRes, subRes, peopleLogRes] = await Promise.allSettled([
          API.get('/shift', { params: { store_id: branchId, start_date: today, end_date: today } }),
          API.get('/users', { params: { store_id: branchId } }),
          API.get('/substitute', { params: { store_id: branchId } }),
          API.get('/people_log', {
            params: {
              store_id: resolveStoreId(branchId),
              start_date: `${today} 00:00:00`,
              end_date: `${today} 23:59:59`
            }
          }),
        ]);

        // 오늘 근무표
        const shifts: ShiftVO[] =
          shiftRes.status === 'fulfilled' && Array.isArray(shiftRes.value.data)
            ? shiftRes.value.data : [];
        setTodayShifts(shifts);

        // 직원 맵
        const users: UserVO[] =
          userRes.status === 'fulfilled' && Array.isArray(userRes.value.data)
            ? userRes.value.data : [];
        setTotalEmployees(users.length);
        const empMap: Record<string, UserVO> = {};
        users.forEach(u => { empMap[u.id] = u; });
        setEmployeeMap(empMap);

        // 대타 오픈 건수
        const subs =
          subRes.status === 'fulfilled' && Array.isArray(subRes.value.data)
            ? subRes.value.data : [];
        setSubstituteCount(
          subs.filter((s: any) => (s.status || '').toLowerCase() === 'open').length
        );

        const peopleLogs: PeopleLog[] =
          peopleLogRes.status === 'fulfilled' && Array.isArray(peopleLogRes.value.data)
            ? peopleLogRes.value.data : [];
        setCustomerTrendData(buildCustomerTrend(peopleLogs, shifts));
        setCustomerTrendSyncedAt(
          new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );

        // 시급/급여 조회 (오늘 근무자 한정)
        const uniqueIds = [...new Set(shifts.map(s => s.user_id))];
        if (uniqueIds.length > 0) {
          const payResults = await Promise.allSettled(
            uniqueIds.map(uid =>
              API.get('/store_member/pay', { params: { user_id: uid, store_id: branchId } })
                .then(r => ({ uid, data: r.data as PayInfo }))
            )
          );
          const pm: Record<string, PayInfo> = {};
          payResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value.data) pm[r.value.uid] = r.value.data;
          });
          setPayMap(pm);
        }
      } catch (err) {
        console.error('[AdminDashboard] 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    const refreshCustomerTrend = async () => {
      try {
        const today = toDateStr(new Date());
        const [shiftRes, peopleLogRes] = await Promise.allSettled([
          API.get('/shift', { params: { store_id: branchId, start_date: today, end_date: today } }),
          API.get('/people_log', {
            params: {
              store_id: resolveStoreId(branchId),
              start_date: `${today} 00:00:00`,
              end_date: `${today} 23:59:59`
            }
          }),
        ]);

        const shifts: ShiftVO[] =
          shiftRes.status === 'fulfilled' && Array.isArray(shiftRes.value.data)
            ? shiftRes.value.data : [];
        const peopleLogs: PeopleLog[] =
          peopleLogRes.status === 'fulfilled' && Array.isArray(peopleLogRes.value.data)
            ? peopleLogRes.value.data : [];

        setTodayShifts(shifts);
        setCustomerTrendData(buildCustomerTrend(peopleLogs, shifts));
        setCustomerTrendSyncedAt(
          new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      } catch (err) {
        console.error('[AdminDashboard] customer trend refresh failed:', err);
      }
    };

    load();
    const intervalId = window.setInterval(refreshCustomerTrend, 5000);

    return () => window.clearInterval(intervalId);
  }, [branchId]);

  // ── 파생 값 ──
  const checkedIn = todayShifts.filter(s =>
    (s.status || '').toUpperCase() === 'CHECKED_IN'
  ).length;

  const estimatedPay = todayShifts.reduce((sum, shift) => {
    const pay = payMap[shift.user_id];
    if (!pay || pay.pay_type !== 'HOURLY') return sum;
    return sum + pay.pay_amount * calcHours(shift.start_at, shift.end_at);
  }, 0);

  const operationContext: DashboardOperationContext = {
    rows: customerTrendData,
    todayShifts,
    totalEmployees,
    checkedIn,
    substituteCount,
    estimatedPay
  };

  useEffect(() => {
    if (!branchId || customerTrendData.length === 0) return;

    let cancelled = false;

    const loadAiInsight = async () => {
      try {
        const response = await fetch(`${AI_INSIGHT_API}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildAiPayload(operationContext, resolveStoreId(branchId), currentBranch))
        });

        if (!response.ok) {
          throw new Error('AI insight request failed');
        }

        const data = await response.json();
        if (!cancelled) setAiInsight(data);
      } catch (err) {
        if (!cancelled) {
          setAiInsight(null);
          console.error('[AdminDashboard] AI insight load failed:', err);
        }
      }
    };

    loadAiInsight();

    return () => {
      cancelled = true;
    };
  }, [branchId, currentBranch, customerTrendData, todayShifts, totalEmployees, checkedIn, substituteCount, estimatedPay]);

  const fallbackRecommendations = buildFallbackRecommendations(operationContext);
  const operationRecommendations = mapAiRecommendations(aiInsight, fallbackRecommendations);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_IN') return '출근 완료';
    if (s === 'CHECKED_OUT') return '퇴근';
    if (s === 'ABSENT') return '결근';
    return '출근 전';
  };

  const getStatusClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_IN') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (s === 'ABSENT') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (s === 'CHECKED_OUT') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const menuItems = [
    { icon: Home, label: '대시보드', path: `/admin/dashboard/${branchId}`, active: true },
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
    { icon: Camera, label: 'CCTV 분석', path: `/admin/cctv/${branchId}` },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">ShiftOps AI</h1>
          </div>
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/admin/branch-selection')}
            >
              <span className="truncate">{currentBranch}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">메인 대시보드</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                })}
              </p>
            </div>
          </div>
          <ProfilePanel />
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 오늘 근무 인원 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 근무 인원
                </CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{todayShifts.length}명</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      출근 완료 {checkedIn}명
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 등록 직원 수 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  등록 직원 수
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{totalEmployees}명</div>
                    <p className="text-xs text-green-600 mt-1">이 지점 전체 직원</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 대타 모집 중 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  대타 모집 중
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${substituteCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {substituteCount}건
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {substituteCount > 0 ? '지원자를 기다리는 중' : '모집 중인 공고 없음'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 오늘 예상 인건비 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 예상 인건비
                </CardTitle>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ₩{estimatedPay.toLocaleString('ko-KR')}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      시급제 직원 기준
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 실시간 매장 인원 추이 (목업 유지 - 고객 DB 미연결) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  실시간 매장 인원 추이
                  <span className="text-xs font-normal text-gray-400">
                    {customerTrendSyncedAt ? `실시간 연동 ${customerTrendSyncedAt}` : '실시간 연동'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke="#3b82f6" name="고객 수" strokeWidth={2} />
                    <Line type="monotone" dataKey="staff" stroke="#10b981" name="근무 인원" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 오늘의 운영 알림 */}
            <Card>
              <CardHeader>
                <CardTitle>오늘의 운영 알림</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!loading && substituteCount > 0 && (
                  <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                    <p className="text-sm font-medium mb-1">대타 모집 중 {substituteCount}건</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">지원자 확인 필요</p>
                  </div>
                )}
                {!loading && checkedIn < todayShifts.length && todayShifts.length > 0 && (
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <p className="text-sm font-medium mb-1">
                      미출근 {todayShifts.length - checkedIn}명
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">출근 확인 필요</p>
                  </div>
                )}
                {!loading && todayShifts.length === 0 && (
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700">
                    <p className="text-sm font-medium mb-1">오늘 근무 없음</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">근무표를 확인하세요</p>
                  </div>
                )}
                <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                  <p className="text-sm font-medium mb-1">보건증 만료 예정 확인</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">문서 관리에서 확인</p>
                </div>
                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="text-sm font-medium mb-1">다음 주 근무표 작성</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">근무표 관리에서 작성</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── 오늘 근무자 + AI 추천 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* 오늘 근무자 목록 (DB 연결) */}
            <Card>
              <CardHeader>
                <CardTitle>오늘 근무자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : todayShifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    오늘 등록된 근무자가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayShifts.map(shift => {
                      const emp = employeeMap[shift.user_id];
                      const name = emp?.name || '알 수 없음';
                      const startTime = fmt(shift.start_at);
                      const endTime = fmt(shift.end_at);
                      return (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {startTime} ~ {endTime}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusClass(shift.status)}>
                            {getStatusLabel(shift.status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI 운영 추천 */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  AI 운영 추천
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {operationRecommendations.map((recommendation) => (
                  <div
                    key={recommendation.title}
                    className={`p-4 bg-white dark:bg-gray-800 rounded-lg ${
                      recommendation.primary
                        ? 'border-2 border-purple-200 dark:border-purple-700'
                        : 'border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-2 ${
                        recommendation.primary ? 'text-purple-900 dark:text-purple-200' : ''
                      }`}
                    >
                      {recommendation.title}
                    </h4>
                    <p className={`text-sm text-gray-700 dark:text-gray-300 ${recommendation.actionLabel ? 'mb-3' : ''}`}>
                      {recommendation.body}
                    </p>
                    {recommendation.actionLabel && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/admin/substitute/${branchId}`)}
                      >
                        {recommendation.actionLabel}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/schedule/monthly/${branchId}`)}
            >
              <CalendarDays className="w-6 h-6" />
              <span>근무표 보기</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/substitute/${branchId}`)}
            >
              <UserPlus className="w-6 h-6" />
              <span>대타 모집</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/analytics/${branchId}`)}
            >
              <BarChart3 className="w-6 h-6" />
              <span>고객 분석</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/cctv/${branchId}`)}
            >
              <Camera className="w-6 h-6" />
              <span>CCTV 분석</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

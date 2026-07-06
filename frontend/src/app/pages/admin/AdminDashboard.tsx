import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import {
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  CalendarDays,
  Calendar,
  ClipboardCheck,
  UserPlus,
  Wallet,
  Video,
  FileText,
  MessageSquare,
  BarChart3,
  Loader2,
  QrCode,
} from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";
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

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const BORDER_GREEN = "#00A200";
const LIGHT_GREEN = "#E6F5C8";


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
  let diff = (t2[0] * 60 + t2[1]) - (t1[0] * 60 + t1[1]);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
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

interface AttendanceQr {
  qr_token: string;
  store_id: string;
  created_at: string;
  expired_at: string;
  is_active: string;
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

const customerTrendTimeAxis = [
  { time: "09:00", customers: 0, staff: 0 },
  { time: "10:00", customers: 0, staff: 0 },
  { time: "11:00", customers: 0, staff: 0 },
  { time: "12:00", customers: 0, staff: 0 },
  { time: "13:00", customers: 0, staff: 0 },
  { time: "14:00", customers: 0, staff: 0 },
  { time: "15:00", customers: 0, staff: 0 },
  { time: "16:00", customers: 0, staff: 0 },
  { time: "17:00", customers: 0, staff: 0 },
  { time: "18:00", customers: 0, staff: 0 },
  { time: "19:00", customers: 0, staff: 0 },
  { time: "20:00", customers: 0, staff: 0 },
];

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

  return customerTrendTimeAxis.map((row) => {
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
  const location = useLocation();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.adminDashboard[language];
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const currentBranch = sessionStorage.getItem("store_name") || "지점 선택";
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  // ── 상태 ──
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, UserVO>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [payMap, setPayMap] = useState<Record<string, PayInfo>>({});
  const [substituteCount, setSubstituteCount] = useState(0);
  const [customerTrendData, setCustomerTrendData] =
    useState<CustomerTrendRow[]>(customerTrendTimeAxis);
  const [customerTrendSyncedAt, setCustomerTrendSyncedAt] = useState("");
  const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);
  const [attendanceQr, setAttendanceQr] = useState<AttendanceQr | null>(null);
  const [qrRemainSeconds, setQrRemainSeconds] = useState(30);
  const [qrError, setQrError] = useState("");
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  // 관리 매장 목록 (드롭다운용)
  useEffect(() => {
    if (!currentUser?.id) return;
    axiosInstance.get("/store", { params: { user_id: currentUser.id } })
      .then((res) =>
        setStores(
          Array.isArray(res.data)
            ? res.data.map((s: any) => ({ id: s.id, name: s.name }))
            : [],
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;

    const load = async () => {
      try {
        const today = toDateStr(new Date());

        const [shiftRes, userRes, subRes, peopleLogRes] =
          await Promise.allSettled([
            axiosInstance.get("/shift", {
              params: {
                store_id: selectedBranchId,
                start_date: today,
                end_date: today,
              },
            }),
            axiosInstance.get("/users", { params: { store_id: selectedBranchId } }),
            axiosInstance.get("/substitute", { params: { store_id: selectedBranchId } }),
            axiosInstance.get("/people_log", {
              params: {
                store_id: selectedBranchId,
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
              axiosInstance.get("/store_member/pay", {
                params: { user_id: uid, store_id: selectedBranchId },
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
          axiosInstance.get("/shift", {
            params: { store_id: selectedBranchId, start_date: today, end_date: today },
          }),
          axiosInstance.get("/people_log", {
            params: {
              store_id: selectedBranchId,
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
  }, [selectedBranchId]);

  useEffect(() => {
    if (!branchId) return;

    let cancelled = false;

    const generateQr = async () => {
      try {
        const response = await axiosInstance.post(`/attendance/qr/${branchId}`);
        if (cancelled) return;

        setAttendanceQr(response.data);
        setQrRemainSeconds(30);
        setQrError("");
      } catch (err) {
        if (cancelled) return;
        console.error("[AdminDashboard] QR generation failed:", err);
        setAttendanceQr(null);
        setQrError("QR 코드를 발급하지 못했습니다.");
      }
    };

    generateQr();
    const refreshId = window.setInterval(generateQr, 30000);
    const countdownId = window.setInterval(() => {
      setQrRemainSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
      window.clearInterval(countdownId);
    };
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

  const attendanceQrPayload = attendanceQr
    ? `${window.location.origin}/employee/checkin?token=${encodeURIComponent(attendanceQr.qr_token)}`
    : "";

  const attendanceQrImageUrl = attendanceQrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(attendanceQrPayload)}`
    : "";

  useEffect(() => {
    if (!selectedBranchId || customerTrendData.length === 0) return;

    let cancelled = false;

    const loadAiInsight = async () => {
      try {
        const today = toDateStr(new Date());
        const response = await fetch(`${API_BASE}/ai-insights/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: selectedBranchId,
            shift_store_id: selectedBranchId,
            date: today,
            start_date: `${today} 00:00:00`,
            end_date: `${today} 23:59:59`,
            mode: "dashboard",
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(
            `AI insight request failed (${response.status}): ${detail || response.statusText}`,
          );
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
    selectedBranchId,
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
    const s = (status || "").toUpperCase();
    if (s === "CHECKED_IN") return t.statusCheckedIn;
    if (s === "CHECKED_OUT") return t.statusCheckedOut;
    if (s === "ABSENT") return t.statusAbsent;
    return t.statusBeforeWork;
  };

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const subTextColor = isDark ? "#c8c8c8" : "#666";
  const sidebarBg = isDark ? "rgba(8,8,8,0.97)" : "rgba(255,255,255,0.85)";
  const sidebarBorder = isDark ? "#1a1a1a" : BORDER_GREEN;
  const contentBg = isDark ? '#141414' : '#fff';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? "rgba(20,20,20,0.7)" : "rgba(230,245,200,0.35)";

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "CHECKED_IN")
      return { background: isDark ? "rgba(24,160,34,0.15)" : LIGHT_GREEN, color: isDark ? "#4cd964" : DARK_GREEN };
    if (s === "ABSENT") return { background: "#fee2e2", color: "#ef4444" };
    if (s === "CHECKED_OUT") return { background: "#dbeafe", color: "#1d4ed8" };
    return { background: "#f3f4f6", color: "#6b7280" };
  };

  const menuItems = [
    {
      icon: Calendar,
      label: t.menuItems.scheduleManagement,
      path: selectedBranchId
        ? `/admin/schedule/monthly/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: ClipboardCheck,
      label: t.menuItems.attendanceManagement,
      path: selectedBranchId
        ? `/admin/attendance/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: UserPlus,
      label: t.menuItems.substituteRecruitment,
      path: selectedBranchId
        ? `/admin/substitute/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: Users,
      label: t.menuItems.employeeManagement,
      path: selectedBranchId
        ? `/admin/employees/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: Wallet,
      label: t.menuItems.payrollManagement,
      path: selectedBranchId
        ? `/admin/payroll/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: FileText,
      label: t.menuItems.documentManagement,
      path: selectedBranchId
        ? `/admin/documents/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: MessageSquare,
      label: t.menuItems.board,
      path: selectedBranchId
        ? `/admin/board/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: BarChart3,
      label: t.menuItems.aiAnalytics,
      path: selectedBranchId
        ? `/admin/analytics/${selectedBranchId}`
        : "/admin/branch-selection",
    },
    {
      icon: Video,
      label: t.menuItems.cctvAnalysis,
      path: selectedBranchId
        ? `/admin/cctv/${selectedBranchId}`
        : "/admin/branch-selection",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif",
      }}
    >
      <AdminHeader />

      {/* ── 바디: 사이드바 + 메인 카드 ── */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "24px 40px 40px",
          alignItems: "flex-start",
        }}
      >
        {/* ── 사이드바 ── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            background: sidebarBg,
            border: `1px solid ${sidebarBorder}`,
            borderRadius: 20,
            padding: "16px 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            position: "sticky",
            top: 140,
            maxHeight: "calc(100vh - 160px)",
            overflowY: "auto",
          }}
        >
          {/* 지점 드롭다운 */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <button
              onClick={() => setBranchDropdownOpen((o) => !o)}
              style={{ width: "100%", padding: "10px 14px", background: isDark ? "#1a1a1a" : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 13, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentBranch}
              </span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? "▲" : "▼"}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: isDark ? "#0a0a0a" : "#fff",
                  border: `1px solid ${isDark ? "#1a1a1a" : BORDER_GREEN}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
              >
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sessionStorage.setItem("store_id", s.id);
                      sessionStorage.setItem("store_name", s.name);
                      setBranchDropdownOpen(false);
                      navigate(`/admin/dashboard/${s.id}`);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background:
                        s.id === branchId ? (isDark ? "rgba(24,160,34,0.15)" : LIGHT_GREEN) : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: isDark ? "#fff" : DARK_GREEN,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        s.id === branchId ? (isDark ? "rgba(24,160,34,0.15)" : LIGHT_GREEN) : "transparent";
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <div
                  style={{
                    borderTop: `1px solid ${isDark ? "#1a1a1a" : "#e5e7eb"}`,
                  }}
                />
                <button
                  onClick={() => {
                    setBranchDropdownOpen(false);
                    navigate("/admin/branch-selection");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: isDark ? "#888" : "#c8c8c8",
                    fontSize: 12,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = isDark
                      ? "#141414"
                      : "#f5f5f5";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "11px 14px",
                  marginBottom: 4,
                  background: isActive ? GREEN : "transparent",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  color: isActive ? "#fff" : isDark ? "#ccc" : DARK_GREEN,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.15s",
                  boxShadow: isActive
                    ? "0 2px 8px rgba(24,160,34,0.3)"
                    : "none",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.08)"
                      : LIGHT_GREEN;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <item.icon size={16} color={isActive ? "#fff" : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* ── 메인: 하나의 큰 흰 카드 ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: mainBg,
            borderRadius: 24,
            padding: "28px 28px 32px",
            boxShadow: "0px 8px 40px rgba(0,0,0,0.18)",
            minHeight: "calc(100vh - 120px)",
          }}
        >
          {/* 타이틀 행 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: isDark ? GREEN : DARK_GREEN,
                margin: 0,
              }}
            >
              {t.mainDashboard}
            </h1>
            <span style={{ fontSize: 15, color: "#8BA68D", fontWeight: 500 }}>
              {new Date().toLocaleDateString(t.dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </span>
          </div>

          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: t.todayStaff,
                value: loading ? null : todayShifts.length,
                sub: loading ? null : t.checkedInCount(checkedIn),
                icon: <Users size={20} color={GREEN} />,
                subColor: GREEN,
                isAlert: false,
              },
              {
                label: t.registeredStaff,
                value: loading ? null : totalEmployees,
                sub: loading ? null : t.allStaffThisBranch,
                icon: <TrendingUp size={20} color={GREEN} />,
                subColor: GREEN,
                isAlert: false,
              },
              {
                label: t.substituteRecruiting,
                value: loading ? null : substituteCount,
                sub: loading
                  ? null
                  : substituteCount > 0
                    ? t.waitingForApplicants
                    : t.noOpenings,
                icon: (
                  <AlertCircle
                    size={20}
                    color={substituteCount > 0 ? "#A20000" : GREEN}
                  />
                ),
                subColor: substituteCount > 0 ? "#A20000" : subTextColor,
                isAlert: substituteCount > 0,
              },
              {
                label: t.estimatedLaborCost,
                value: loading
                  ? null
                  : `₩${estimatedPay.toLocaleString("ko-KR")}`,
                sub: loading ? null : t.hourlyBasis,
                icon: <DollarSign size={20} color={GREEN} />,
                subColor: subTextColor,
                isAlert: false,
              },
            ].map(({ label, value, sub, icon, subColor, isAlert }) => (
              <div
                key={label}
                style={{
                  background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{ fontSize: 13, fontWeight: 600, color: "#8BA68D" }}
                  >
                    {label}
                  </p>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "transparent",
                      border: `1.5px solid ${isAlert ? "#A20000" : BORDER_GREEN}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </div>
                </div>
                {value === null ? (
                  <Loader2 size={20} style={{ color: subTextColor }} />
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: isAlert ? "#A20000" : DARK_GREEN,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </p>
                    <p style={{ fontSize: 13, color: subColor, marginTop: 6 }}>
                      {sub}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 출퇴근 QR */}
          <div
            style={{
              background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
              borderRadius: 18,
              padding: "22px",
              border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
              marginBottom: 14,
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 16,
                background: "#fff",
                border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {attendanceQrImageUrl ? (
                <img
                  src={attendanceQrImageUrl}
                  alt={t.qrAlt}
                  style={{ width: 220, height: 220, display: "block" }}
                />
              ) : (
                <Loader2 size={32} color={DARK_GREEN} />
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <QrCode size={24} color={DARK_GREEN} />
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN }}>
                  {t.qrTitle}
                </h2>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 15, color: "#5f7f61", fontWeight: 600 }}>
                {t.qrDesc}
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "#8BA68D" }}>
                {t.qrExpiry}
              </p>
              {qrError ? (
                <div style={{ color: "#dc2626", fontSize: 14, fontWeight: 700 }}>
                  {qrError}
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#fff",
                    border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                    color: isDark ? GREEN : DARK_GREEN,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  <Clock size={16} />
                  {t.qrRefresh(qrRemainSeconds)}
                </div>
              )}
            </div>
          </div>

          {/* 차트 — 단독 행 */}
          <div
            style={{
              background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
              borderRadius: 18,
              padding: "22px",
              border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN }}
              >
                {t.realtimeTrend}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#8BA68D",
                  background: isDark ? "rgba(24,160,34,0.15)" : LIGHT_GREEN,
                  padding: "3px 12px",
                  borderRadius: 20,
                }}
              >
                {customerTrendSyncedAt
                  ? `실시간 연동 ${customerTrendSyncedAt}`
                  : "실시간 연동"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={customerTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4e8d4" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#8BA68D", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#8BA68D", fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke={GREEN}
                  name={t.customers}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="staff"
                  stroke={DARK_GREEN}
                  name={t.workingStaff}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 오늘의 운영 알림 — 단독 행, 가로 나열 */}
          <div
            style={{
              background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
              borderRadius: 18,
              padding: "20px 22px",
              border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark ? GREEN : DARK_GREEN,
                marginBottom: 14,
              }}
            >
              {t.todayAlerts}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {!loading && substituteCount > 0 && (
                <div
                  style={{
                    padding: "13px 16px",
                    borderRadius: 12,
                    background: isDark ? "rgba(162,0,0,0.12)" : "rgba(255,255,255,0.7)",
                    border: `1.5px solid #A20000`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#A20000",
                      marginBottom: 4,
                    }}
                  >
                    {t.substituteAlert(substituteCount)}
                  </p>
                  <p style={{ fontSize: 13, color: "#8BA68D" }}>
                    {t.checkApplicants}
                  </p>
                </div>
              )}
              {!loading &&
                checkedIn < todayShifts.length &&
                todayShifts.length > 0 && (
                  <div
                    style={{
                      padding: "13px 16px",
                      borderRadius: 12,
                      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                      border: `1.5px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isDark ? GREEN : DARK_GREEN,
                        marginBottom: 4,
                      }}
                    >
                      {t.absentAlert(todayShifts.length - checkedIn)}
                    </p>
                    <p style={{ fontSize: 13, color: "#8BA68D" }}>
                      {t.checkAttendance}
                    </p>
                  </div>
                )}
              {!loading && todayShifts.length === 0 && (
                <div
                  style={{
                    padding: "13px 16px",
                    borderRadius: 12,
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                    border: `1.5px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isDark ? GREEN : DARK_GREEN,
                      marginBottom: 4,
                    }}
                  >
                    {t.noWorkToday}
                  </p>
                  <p style={{ fontSize: 13, color: "#8BA68D" }}>
                    {t.checkSchedule}
                  </p>
                </div>
              )}
              <div
                style={{
                  padding: "13px 16px",
                  borderRadius: 12,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                  border: `1.5px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isDark ? GREEN : DARK_GREEN,
                    marginBottom: 4,
                  }}
                >
                  {t.healthCertExpiry}
                </p>
                <p style={{ fontSize: 13, color: "#8BA68D" }}>
                  {t.checkDocuments}
                </p>
              </div>
              <div
                style={{
                  padding: "13px 16px",
                  borderRadius: 12,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                  border: `1.5px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isDark ? GREEN : DARK_GREEN,
                    marginBottom: 4,
                  }}
                >
                  {t.nextWeekSchedule}
                </p>
                <p style={{ fontSize: 13, color: "#8BA68D" }}>
                  {t.writeInSchedule}
                </p>
              </div>
            </div>
          </div>

          {/* 오늘 근무자 + AI 추천 */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div
              style={{
                background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
                borderRadius: 18,
                padding: "22px",
                border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isDark ? GREEN : DARK_GREEN,
                  marginBottom: 14,
                }}
              >
                {t.todayWorkerList}
              </p>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "32px 0",
                  }}
                >
                  <Loader2 size={24} style={{ color: "#8BA68D" }} />
                </div>
              ) : todayShifts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#8BA68D",
                    fontSize: 15,
                  }}
                >
                  {t.noWorkersToday}
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {todayShifts.map((shift) => {
                    const emp = employeeMap[shift.user_id];
                    const name = emp?.name || t.unknown;
                    const bs = getStatusBadgeStyle(shift.status);
                    return (
                      <div
                        key={shift.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "11px 14px",
                          background: isDark ? "#1e1e1e" : "rgba(230,245,200,0.5)",
                          borderRadius: 14,
                          border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 15,
                              flexShrink: 0,
                            }}
                          >
                            {name[0]}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: isDark ? GREEN : DARK_GREEN,
                              }}
                            >
                              {name}
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#8BA68D",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Clock size={11} />
                              {fmt(shift.start_at)} ~ {fmt(shift.end_at)}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            ...bs,
                            padding: "4px 11px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                background: isDark ? "#141414" : "rgba(230,245,200,0.35)",
                borderRadius: 18,
                padding: "22px",
                border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "transparent",
                    border: `1.5px solid ${BORDER_GREEN}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={17} color={GREEN} />
                </div>
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN }}
                >
                  {t.aiRecommendation}
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    padding: "15px",
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(230,245,200,0.6)",
                    border: `1.5px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                  }}
                >
                  <h4
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isDark ? GREEN : DARK_GREEN,
                      marginBottom: 6,
                    }}
                  >
                    {t.staffingRecommendation}
                  </h4>
                  <p
                    style={{ fontSize: 13, color: "#8BA68D", marginBottom: 11 }}
                  >
                    {t.staffingBody}
                  </p>
                  <button
                    onClick={() => navigate(selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection')}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: GREEN,
                      border: "none",
                      borderRadius: 50,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t.recruitSubstitute}
                  </button>
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    padding: "15px",
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(230,245,200,0.3)",
                    border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                  }}
                >
                  <h4
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isDark ? GREEN : DARK_GREEN,
                      marginBottom: 5,
                    }}
                  >
                    {t.menuRecommendation}
                  </h4>
                  <p style={{ fontSize: 13, color: "#8BA68D" }}>{t.menuBody}</p>
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    padding: "15px",
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(230,245,200,0.3)",
                    border: `1px solid ${isDark ? "#2a2a2a" : BORDER_GREEN}`,
                  }}
                >
                  <h4
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isDark ? GREEN : DARK_GREEN,
                      marginBottom: 5,
                    }}
                  >
                    {t.idleTimeTask}
                  </h4>
                  <p style={{ fontSize: 13, color: "#8BA68D" }}>{t.idleBody}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeHeader from "../../components/employee/EmployeeHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  Banknote,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";

const API = axios.create({ baseURL: "http://localhost:8080/api" });

interface PayrollResult {
  basePay: number;
  overtimePay: number;
  nightPay: number;
  weeklyPay: number;
  totalPay: number;
}
interface ShiftVO {
  id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}
interface MemberInfo {
  pay_type: string | null;
  pay_amount: number | null;
}
interface HistoryItem {
  label: string;
  data: PayrollResult;
  shifts: ShiftVO[];
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const getDatePart = (s: string) =>
  !s ? "" : s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
const getTimePart = (s: string) => {
  if (!s) return "";
  const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
  return t ? t.substring(0, 5) : "";
};
const DAY = ["일", "월", "화", "수", "목", "금", "토"];
const getDayName = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return DAY[new Date(y, m - 1, dd).getDay()];
};
const calcHours = (start: string, end: string) => {
  const getMin = (s: string) => {
    const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  return Math.max(0, (getMin(end) - getMin(start)) / 60);
};
const fmtW = (n: number) => Math.round(n).toLocaleString() + "원";
const fmtM = (n: number) => (Math.round(n) / 10000).toFixed(1) + "만원";

// ISO 주의 월요일 날짜 구하기
const getIsoMonday = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0=일, 1=월 ...
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() + diff);
  return toDateStr(mon);
};

export default function EmployeePayroll() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(sessionStorage.getItem("user") || "{}"),
    [],
  );

  const [storeId, setStoreId] = useState(
    sessionStorage.getItem("store_id") || "",
  );
  const storeName = sessionStorage.getItem("store_name") || "";
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [payroll, setPayroll] = useState<PayrollResult | null>(null);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyView, setHistoryView] = useState<
    "monthly" | "weekly" | "daily"
  >("monthly");
  const [requesting, setRequesting] = useState(false);
  // TODO: DB 연동 - GET /api/weekly_pay_request?user_id= 로 신청 상태 조회

  // store_id 없으면 조회
  useEffect(() => {
    if (storeId || !user.id) return;
    API.get("/store/my", { params: { user_id: user.id } })
      .then((res) => {
        if (res.data?.id) {
          setStoreId(res.data.id);
          sessionStorage.setItem("store_id", res.data.id);
        }
      })
      .catch(() => {});
  }, []);

  // 시급/월급 정보
  useEffect(() => {
    if (!user.id || !storeId) return;
    API.get("/store_member/pay", {
      params: { user_id: user.id, store_id: storeId },
    })
      .then((res) => {
        if (res.data) setMemberInfo(res.data);
      })
      .catch(() => {});
  }, [storeId]);

  // 선택 달 급여 + 근무
  useEffect(() => {
    if (!user.id || !storeId) return;
    setLoadingPayroll(true);
    const start = toDateStr(startOfMonth(selectedMonth));
    const end = toDateStr(endOfMonth(selectedMonth));
    Promise.all([
      API.get("/payroll", {
        params: {
          user_id: user.id,
          store_id: storeId,
          start_date: start,
          end_date: end,
        },
      }),
      API.get("/shift/staff", {
        params: { user_id: user.id, start_date: start, end_date: end },
      }),
    ])
      .then(([p, s]) => {
        setPayroll(p.data);
        setShifts(Array.isArray(s.data) ? s.data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingPayroll(false));
  }, [storeId, selectedMonth]);

  // 년도별 내역 (이번달 제외)
  useEffect(() => {
    if (!user.id || !storeId) return;
    setLoadingHistory(true);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const months: Date[] = [];
    for (let i = 0; i < 12; i++) {
      const m = new Date(historyYear, i, 1);
      if (m < thisMonth) months.push(m);
    }

    Promise.all(
      months.map((m) => {
        const start = toDateStr(startOfMonth(m)),
          end = toDateStr(endOfMonth(m));
        return Promise.all([
          API.get("/payroll", {
            params: {
              user_id: user.id,
              store_id: storeId,
              start_date: start,
              end_date: end,
            },
          }),
          API.get("/shift/staff", {
            params: { user_id: user.id, start_date: start, end_date: end },
          }),
        ]).then(([p, s]) => ({
          label: format(m, "M월", { locale: ko }),
          data: p.data as PayrollResult,
          shifts: Array.isArray(s.data) ? (s.data as ShiftVO[]) : [],
        }));
      }),
    )
      .then((r) => setHistory(r.reverse()))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [storeId, historyYear]);

  const today = useMemo(() => toDateStr(new Date()), []);
  const assignedShifts = useMemo(
    () =>
      shifts.filter((s) => s.status !== "VACANT" && s.status !== "CANCELLED"),
    [shifts],
  );
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  }, [selectedMonth]);
  const isCurrentYear = historyYear >= new Date().getFullYear();

  // 이번 주 예상 급여 (HOURLY + 현재 달 선택 시)
  const thisWeekPay = useMemo(() => {
    if (!memberInfo?.pay_amount || memberInfo.pay_type !== "HOURLY") return 0;
    if (!isCurrentMonth) return 0;
    const now = new Date();
    const dayNum = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (dayNum === 0 ? 6 : dayNum - 1));
    mon.setHours(0, 0, 0, 0);
    const monStr = toDateStr(mon);
    const sunStr = toDateStr(new Date(mon.getTime() + 6 * 86400000));
    return assignedShifts
      .filter((s) => {
        const d = getDatePart(s.work_date);
        return d >= monStr && d <= sunStr;
      })
      .reduce(
        (sum, s) =>
          sum + calcHours(s.start_at, s.end_at) * memberInfo.pay_amount!,
        0,
      );
  }, [assignedShifts, memberInfo, isCurrentMonth]);

  // 주급 신청 핸들러 (TODO: DB 연동)
  const handleWeeklyRequest = async () => {
    setRequesting(true);
    // TODO: DB 연동 - POST /api/weekly_pay_request { user_id, store_id, request_amount: thisWeekPay }
    await new Promise((r) => setTimeout(r, 600));
    alert(
      `주급 신청이 완료되었습니다.\n신청 금액: ${fmtW(thisWeekPay)}\n\n(TODO: DB 연동 필요)`,
    );
    setRequesting(false);
  };

  // 일별 내역 (history 전체 flatten)
  const dailyHistory = useMemo(
    () =>
      history
        .flatMap((item) =>
          item.shifts
            .filter((s) => s.status !== "VACANT" && s.status !== "CANCELLED")
            .map((s) => ({
              ...s,
              monthLabel: item.label,
              pay:
                calcHours(s.start_at, s.end_at) * (memberInfo?.pay_amount || 0),
            })),
        )
        .sort((a, b) =>
          getDatePart(b.work_date).localeCompare(getDatePart(a.work_date)),
        ),
    [history, memberInfo],
  );

  // 주별 내역 (ISO week 기준)
  const weeklyHistory = useMemo(() => {
    const map: Record<
      string,
      { weekLabel: string; total: number; hours: number; count: number }
    > = {};
    dailyHistory.forEach((s) => {
      const dateStr = getDatePart(s.work_date);
      const monStr = getIsoMonday(dateStr);
      const [y, m, d] = monStr.split("-").map(Number);
      const sunDt = new Date(y, m - 1, d + 6);
      const weekLabel = `${monStr.slice(5).replace("-", "/")} ~ ${toDateStr(sunDt).slice(5).replace("-", "/")}`;
      if (!map[monStr])
        map[monStr] = { weekLabel, total: 0, hours: 0, count: 0 };
      map[monStr].total += s.pay;
      map[monStr].hours += calcHours(s.start_at, s.end_at);
      map[monStr].count += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, v]) => v);
  }, [dailyHistory]);

  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((h) => ({ month: h.label, 급여: Math.round(h.data.totalPay) })),
    [history],
  );

  const payLabel =
    memberInfo?.pay_type === "MONTHLY"
      ? `월급 ${memberInfo.pay_amount?.toLocaleString()}원`
      : memberInfo?.pay_type === "HOURLY"
        ? `시급 ${memberInfo.pay_amount?.toLocaleString()}원/시`
        : null;

  const renderShiftRows = (list: ShiftVO[]) => {
    const valid = list.filter(
      (s) => s.status !== "VACANT" && s.status !== "CANCELLED",
    );
    if (!valid.length)
      return <p className="text-xs text-gray-400 py-1">근무 일정 없음</p>;
    return valid.map((s, i) => {
      const d = getDatePart(s.work_date);
      const done = d < today;
      return (
        <div
          key={i}
          className={`flex justify-between items-center text-xs py-1.5 px-2 rounded ${done ? "bg-white/60 dark:bg-gray-700/50" : "bg-white/20 dark:bg-gray-800/30"}`}
        >
          <span
            className={
              done ? "text-gray-700 dark:text-gray-200" : "text-gray-400"
            }
          >
            {d.slice(5).replace("-", "/")} ({getDayName(d)})&nbsp;
            {getTimePart(s.start_at)}~{getTimePart(s.end_at)}
          </span>
          <span
            className={`font-medium tabular-nums ${done ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}
          >
            {calcHours(s.start_at, s.end_at).toFixed(1)}h
          </span>
        </div>
      );
    });
  };

  const PayDetail = ({
    data,
    shiftList,
  }: {
    data: PayrollResult;
    shiftList: ShiftVO[];
  }) => (
    <div className="space-y-3">
      {/* 시급/월급 */}
      {payLabel && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          {payLabel}
        </div>
      )}
      {/* 근무 일정 */}
      <div className="space-y-1">{renderShiftRows(shiftList)}</div>
      {/* 수당 상세 */}
      <div className="border-t border-pink-200 dark:border-pink-800 pt-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">기본급</span>
          <span className="font-medium">{fmtW(data.basePay)}</span>
        </div>
        {data.overtimePay > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">연장수당</span>
            <span className="font-medium text-green-600">
              +{fmtW(data.overtimePay)}
            </span>
          </div>
        )}
        {data.nightPay > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">야간수당</span>
            <span className="font-medium text-green-600">
              +{fmtW(data.nightPay)}
            </span>
          </div>
        )}
        {/* 주휴수당: 항상 표시 */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">주휴수당</span>
          <span
            className={
              data.weeklyPay > 0
                ? "font-medium text-green-600"
                : "text-gray-400"
            }
          >
            {data.weeklyPay > 0 ? `+${fmtW(data.weeklyPay)}` : "-"}
          </span>
        </div>
      </div>
      {/* 총 급여 볼드 */}
      <div className="border-t border-pink-300 dark:border-pink-700 pt-3 text-center">
        <p className="text-xs text-gray-500 mb-1">총 급여</p>
        <p className="text-3xl font-bold text-pink-700 dark:text-pink-400">
          {fmtW(data.totalPay)}
        </p>
      </div>
    </div>
  );

  const bottomNavItems = [
    { icon: Home, label: "홈", path: "/employee/home" },
    { icon: Calendar, label: "근무표", path: "/employee/schedule" },
    { icon: QrCode, label: "체크인", path: "/employee/checkin" },
    { icon: Wallet, label: "급여", path: "/employee/payroll", active: true },
    { icon: MessageSquare, label: "게시판", path: "/employee/board" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">급여 조회</h1>
          <p className="text-blue-100 text-sm mt-1">급여 내역을 확인하세요</p>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4 space-y-4">
        {/* ── 상단 카드 ── */}
        <Card className="border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
          <CardContent className="pt-4 pb-4">
            {/* 월 네비 (yyyy년 M월, 년도 네비 없음) */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedMonth((prev) => subMonths(prev, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <span className="text-lg font-bold">
                  {format(selectedMonth, "yyyy년 M월", { locale: ko })}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {isCurrentMonth ? "이번 달 예상 급여" : "급여 계산 결과"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedMonth((prev) => subMonths(prev, -1))}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {loadingPayroll ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                계산 중...
              </p>
            ) : !payroll ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                급여 정보를 불러올 수 없습니다
              </p>
            ) : (
              <PayDetail data={payroll} shiftList={assignedShifts} />
            )}
          </CardContent>
        </Card>

        {/* ── 이번 주 주급 카드 (시급제 + 이번달만) ── */}
        {isCurrentMonth && memberInfo?.pay_type === "HOURLY" && (
          <Card className="border border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-500">이번 주 예상 급여</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                      {fmtW(thisWeekPay)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                  onClick={handleWeeklyRequest}
                  disabled={requesting || thisWeekPay === 0}
                >
                  {requesting ? "신청 중..." : "💸 주급(가불) 신청하기"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * 이번 주 확정 근무 기준 계산 · 점주 승인 후 지급
                {/* TODO: DB 연동 후 신청 상태(대기/승인/거절) 표시 */}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── 탭 ── */}
        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">급여 내역</TabsTrigger>
            <TabsTrigger value="trends">통계</TabsTrigger>
          </TabsList>

          {/* 급여 내역 탭 */}
          <TabsContent value="history" className="mt-3">
            {/* 년도 네비 */}
            <div className="flex items-center justify-center gap-4 py-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setHistoryYear((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-base font-bold">{historyYear}년</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setHistoryYear((p) => p + 1)}
                disabled={isCurrentYear}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* 월별/주별/일별 세그먼트 */}
            <div className="flex gap-2 mb-3">
              {(["monthly", "weekly", "daily"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setHistoryView(v)}
                  className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    historyView === v
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {v === "monthly" ? "월별" : v === "weekly" ? "주별" : "일별"}
                </button>
              ))}
            </div>

            {loadingHistory ? (
              <p className="text-center py-8 text-sm text-gray-400">
                불러오는 중...
              </p>
            ) : (
              <>
                {/* 월별 뷰 */}
                {historyView === "monthly" &&
                  (history.length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-400">
                      내역이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold">{item.label}</h3>
                              <Badge className="bg-blue-500 text-xs">
                                계산 완료
                              </Badge>
                            </div>
                            <PayDetail
                              data={item.data}
                              shiftList={item.shifts}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}

                {/* 주별 뷰 */}
                {historyView === "weekly" &&
                  (weeklyHistory.length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-400">
                      내역이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {weeklyHistory.map((w, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-xs text-gray-500">
                                  {w.weekLabel}
                                </p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                                  {w.count}일 · {w.hours.toFixed(1)}h
                                </p>
                              </div>
                              <p className="text-xl font-bold text-pink-700 dark:text-pink-400">
                                {fmtW(w.total)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}

                {/* 일별 뷰 */}
                {historyView === "daily" &&
                  (dailyHistory.length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-400">
                      내역이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dailyHistory.map((s, idx) => {
                        const d = getDatePart(s.work_date);
                        const hours = calcHours(s.start_at, s.end_at);
                        return (
                          <Card key={idx}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-center min-w-[36px]">
                                    <p className="text-xs text-gray-400">
                                      {getDayName(d)}
                                    </p>
                                    <p className="text-base font-bold">
                                      {d.slice(8)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {d.slice(0, 7).replace("-", ".")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                      {getTimePart(s.start_at)} ~{" "}
                                      {getTimePart(s.end_at)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {hours.toFixed(1)}시간
                                    </p>
                                    {/* TODO: DB 연동 - GET /api/substitute/history?user_id= 로 대타 여부 판별 후 뱃지 표시 */}
                                  </div>
                                </div>
                                <p className="text-base font-bold text-pink-700 dark:text-pink-400">
                                  {fmtW(s.pay)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
              </>
            )}
          </TabsContent>

          {/* 통계 탭 */}
          <TabsContent value="trends" className="space-y-4 mt-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  월별 급여 추이
                </div>
                {loadingHistory ? (
                  <p className="text-center py-8 text-sm text-gray-400">
                    불러오는 중...
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => (v / 10000).toFixed(0) + "만"}
                      />
                      <Tooltip formatter={(v: number) => fmtW(v)} />
                      <Line
                        type="monotone"
                        dataKey="급여"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {!loadingHistory && history.length > 0 && (
              <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                    <BarChart3 className="w-4 h-4" />
                    급여 통계 ({history.length}개월)
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">월 평균 급여</p>
                      <p className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                        {fmtM(
                          history.reduce((s, h) => s + h.data.totalPay, 0) /
                            history.length,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">최고 급여</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {fmtM(Math.max(...history.map((h) => h.data.totalPay)))}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-pink-200 dark:border-pink-800 pt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {history.length}개월 총 수입
                    </p>
                    <p className="text-3xl font-bold text-pink-700 dark:text-pink-400">
                      {fmtM(history.reduce((s, h) => s + h.data.totalPay, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단 네비 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                (item as any).active
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

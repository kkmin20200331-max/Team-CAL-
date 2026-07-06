import axiosInstance from "../../../lib/axiosInstance";
import { useTheme } from 'next-themes';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import EmployeeHeader from './EmployeeHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';


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
const getDayName = (d: string, days: string[]) => { const [y,m,dd] = d.split('-').map(Number); return days[new Date(y,m-1,dd).getDay()]; };
const calcHours = (start: string, end: string) => {
  const getMin = (s: string) => {
    const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  return Math.max(0, (getMin(end) - getMin(start)) / 60);
};
// fmtW / fmtM are replaced by t.fmtCurrency / t.fmtCurrencyM at render time

const getIsoMonday = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() + diff);
  return toDateStr(mon);
};

export default function EmployeePayroll() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeePayroll[language];
  const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);

  const [storeId, setStoreId] = useState(sessionStorage.getItem('store_id') || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [payroll, setPayroll] = useState<PayrollResult | null>(null);
  const [weeklyPayroll, setWeeklyPayroll] = useState<PayrollResult | null>(null);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyView, setHistoryView] = useState<
    "monthly" | "weekly" | "daily"
  >("monthly");
  const [requesting, setRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history');

  useEffect(() => {
    if (storeId || !user.id) return;
    axiosInstance.get("/store/my", { params: { user_id: user.id } })
      .then((res) => {
        if (res.data?.id) {
          setStoreId(res.data.id);
          sessionStorage.setItem("store_id", res.data.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user.id || !storeId) return;
    axiosInstance.get("/store_member/pay", {
      params: { user_id: user.id, store_id: storeId },
    })
      .then((res) => {
        if (res.data) setMemberInfo(res.data);
      })
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    if (!user.id || !storeId) { setLoadingPayroll(false); return; }
    setLoadingPayroll(true);
    const start = toDateStr(startOfMonth(selectedMonth));
    const end = toDateStr(endOfMonth(selectedMonth));
    Promise.all([
      axiosInstance.get("/payroll", {
        params: {
          user_id: user.id,
          store_id: storeId,
          start_date: start,
          end_date: end,
        },
      }),
      axiosInstance.get("/shift/staff", {
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

  useEffect(() => {
    if (!user.id || !storeId) { setLoadingHistory(false); return; }
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
          axiosInstance.get("/payroll", {
            params: {
              user_id: user.id,
              store_id: storeId,
              start_date: start,
              end_date: end,
            },
          }),
          axiosInstance.get("/shift/staff", {
            params: { user_id: user.id, start_date: start, end_date: end },
          }),
        ]).then(([p, s]) => ({
          label: t.monthLabel(m.getMonth() + 1),
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

  const currentWeekRange = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return {
      start: toDateStr(start),
      end: toDateStr(end),
    };
  }, []);

  useEffect(() => {
    if (!user.id || !storeId || !isCurrentMonth || memberInfo?.pay_type !== "HOURLY") {
      setWeeklyPayroll(null);
      return;
    }

    axiosInstance.get("/payroll", {
      params: {
        user_id: user.id,
        store_id: storeId,
        start_date: currentWeekRange.start,
        end_date: currentWeekRange.end,
      },
    })
      .then((res) => setWeeklyPayroll(res.data))
      .catch(() => setWeeklyPayroll(null));
  }, [storeId, isCurrentMonth, memberInfo?.pay_type, currentWeekRange.start, currentWeekRange.end]);

  const thisWeekPay = useMemo(() => {
    if (memberInfo?.pay_type !== "HOURLY") return 0;
    if (!isCurrentMonth) return 0;
    return weeklyPayroll?.totalPay || 0;
  }, [weeklyPayroll, memberInfo, isCurrentMonth]);

  const handleWeeklyRequest = async () => {
    if (!user.id || !storeId || thisWeekPay <= 0) return;
    setRequesting(true);
    try {
      const res = await axiosInstance.post("/payroll/weekly-request", null, {
        params: {
          user_id: user.id,
          store_id: storeId,
          week_start: currentWeekRange.start,
          week_end: currentWeekRange.end,
          amount: Math.round(thisWeekPay),
        },
      });
      if (res.data?.ok) {
        alert(`주급 신청이 점주에게 전달되었습니다.\n${t.fmtCurrency(thisWeekPay)}`);
      } else {
        alert("주급 신청을 전달할 점주/관리자를 찾지 못했습니다.");
      }
    } catch {
      alert("주급 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setRequesting(false);
    }
  };

  const dailyHistory = useMemo(() =>
    history.flatMap(item =>
      item.shifts
        .filter(s => s.status !== 'VACANT' && s.status !== 'CANCELLED')
        .map(s => ({
          ...s,
          monthLabel: item.label,
          pay: calcHours(s.start_at, s.end_at) * (memberInfo?.pay_amount || 0),
        }))
    ).sort((a, b) => getDatePart(b.work_date).localeCompare(getDatePart(a.work_date))),
    [history, memberInfo]
  );

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

  const payLabel = memberInfo?.pay_type === 'MONTHLY' && memberInfo.pay_amount != null
    ? t.payTypeMonthly(memberInfo.pay_amount)
    : memberInfo?.pay_type === 'HOURLY' && memberInfo.pay_amount != null
    ? t.payTypeHourly(memberInfo.pay_amount)
    : null;

  const renderShiftRows = (list: ShiftVO[]) => {
    const valid = list.filter(s => s.status !== 'VACANT' && s.status !== 'CANCELLED');
    if (!valid.length) return <p style={{ fontSize: 20, color: '#aaa', padding: '8px 0', marginLeft: 15, marginRight: 15 }}>{t.noShifts}</p>;
    return valid.map((s, i) => {
      const d = getDatePart(s.work_date);
      const done = d < today;
      return (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px',
          background: i % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(24,160,34,0.04)',
          border: '1px solid rgba(0,162,0,0.12)',
          borderRadius: 16,
          opacity: done ? 1 : 0.6,
        }}>
          <span style={{ fontSize: 15, color: DARK_GREEN }}>
            {d.slice(5).replace('-','/')} ({getDayName(d, translations.employeeHome[language].days)})&nbsp;{getTimePart(s.start_at)}~{getTimePart(s.end_at)}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: DARK_GREEN, fontVariantNumeric: 'tabular-nums' }}>
            {calcHours(s.start_at, s.end_at).toFixed(1)}h
          </span>
        </div>
      );
    });
  };

  const PayDetail = ({ data, shiftList }: { data: PayrollResult; shiftList: ShiftVO[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {payLabel && (
        <div style={{ fontSize: 20, fontWeight: 600, color: DARK_GREEN, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 15 }}>
           {payLabel}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {renderShiftRows(shiftList)}
      </div>
      <div style={{ borderTop: `1px solid rgba(0,162,0,0.2)`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginRight: 15 }}>
          <span style={{ color: DARK_GREEN, marginLeft: 15 }}>{t.basePay}</span>
          <span style={{ fontWeight: 600, color: DARK_GREEN }}>{t.fmtCurrency(data.basePay)}</span>
        </div>
        {data.overtimePay > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginRight: 15 }}>
            <span style={{ color: GREEN, marginLeft: 15 }}>{t.overtimePay}</span>
            <span style={{ fontWeight: 600, color: GREEN }}>+{t.fmtCurrency(data.overtimePay)}</span>
          </div>
        )}
        {data.nightPay > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginRight: 15 }}>
            <span style={{ color: GREEN, marginLeft: 15 }}>{t.nightPay}</span>
            <span style={{ fontWeight: 600, color: GREEN, marginRight: 15 }}>+{t.fmtCurrency(data.nightPay)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginRight: 15 }}>
          <span style={{ color: GREEN, marginLeft: 15 }}>{t.weeklyPay}</span>
          <span style={{ fontWeight: 600, color: data.weeklyPay > 0 ? GREEN : '#aaa' }}>
            {data.weeklyPay > 0 ? `+${t.fmtCurrency(data.weeklyPay)}` : '-'}
          </span>
        </div>
      </div>
      <div style={{ borderTop: `1px solid rgba(0,162,0,0.2)`, paddingTop: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 20, color: DARK_GREEN, marginBottom: 4 }}>{t.totalPay}</p>
        <p style={{ fontSize: 30, fontWeight: 800, color: DARK_GREEN }}>{t.fmtCurrency(data.totalPay)}</p>
      </div>
    </div>
  );

  const SectionPill = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: DARK_GREEN, borderRadius: 54.55,
      boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
      height: 36, minWidth: 168, padding: '0 20px',
      fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 10, marginBottom: 20,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)',
      paddingBottom: 120,
    }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.title}</h1>

          {/* 월 네비 + 예상급여 — MySchedule 스타일 glass card */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)',
            border: '1px solid #E6F5C8',
            boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
            borderRadius: 26,
            padding: '16px 20px',
            marginTop: 20,
          }}>
            {/* 월 네비 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff' }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {t.yearMonthLabel(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)}
                </p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                  {isCurrentMonth ? t.currentMonthExpected : t.payrollResult}
                </p>
              </div>
              <button
                onClick={() => setSelectedMonth(prev => subMonths(prev, -1))}
                disabled={isCurrentMonth}
                style={{ background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer', padding: 4 }}
              >
                <ChevronRight size={22} color={isCurrentMonth ? 'rgba(255,255,255,0.3)' : '#fff'} />
              </button>
            </div>

            {/* 예상 급여 총액 */}
            <div style={{ textAlign: 'center' }}>
              {loadingPayroll ? (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>{t.calculating}</p>
              ) : !payroll ? (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>{t.cannotLoad}</p>
              ) : (
                <p style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>
                  {t.fmtCurrency(payroll.totalPay)}
                </p>
              )}
            </div>
          </div>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 이번 달 급여 상세 ── */}
        <div style={{
          background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
          borderRadius: 26, padding: '20px 20px',
          boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
        }}>
          {loadingPayroll ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 20 }}>{t.calculating}</p>
          ) : !payroll ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 20 }}>{t.cannotLoad}</p>
          ) : (
            <PayDetail data={payroll} shiftList={assignedShifts} />
          )}
        </div>

        {/* ── 주급 선지급 카드 (시급제 + 이번달) ── */}
        {isCurrentMonth && memberInfo?.pay_type === 'HOURLY' && (
          <div style={{
            background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
            borderRadius: 26, padding: '16px 20px',
            boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ marginLeft: 15 }}>
              <p style={{ fontSize: 20, color: DARK_GREEN, marginBottom: 4 }}>{t.thisWeekExpected}</p>
              <p style={{ fontSize: 25, fontWeight: 800, color: DARK_GREEN }}>{t.fmtCurrency(thisWeekPay)}</p>
              <p style={{ fontSize: 15, color: '#aaa', marginTop: 4 }}>{t.weeklyNote}</p>
            </div>
            <button
              onClick={handleWeeklyRequest}
              disabled={requesting || thisWeekPay === 0}
              style={{
                background: thisWeekPay === 0 ? '#ccc' : DARK_GREEN,
                color: '#fff', border: 'none', borderRadius: 54,
                padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: thisWeekPay === 0 ? 'default' : 'pointer',
                marginRight: 15,
              }}
            >
              {requesting ? t.requesting : t.weeklyAdvanceRequest}
            </button>
          </div>
        )}

        {/* ── 탭 ── */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: isDark ? '#1a2e1a' : LIGHT_GREEN, borderRadius: 17, padding: '10px 10px', height: 72, marginTop: 15,
          boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25), inset 0px 4px 6px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            position: 'absolute', top: 10, bottom: 10,
            left: activeTab === 'history' ? 10 : 'calc(50% + 5px)',
            width: 'calc(50% - 15px)', background: '#fff', borderRadius: 11,
            opacity: 0.52, filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.15))',
            boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
            transition: 'left 0.2s ease', pointerEvents: 'none',
          }} />
          {(['history', 'trends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 22, fontWeight: 600,
                color: activeTab === tab ? (isDark ? '#fff' : DARK_GREEN) : (isDark ? '#aaa' : '#8ba68d'),
                position: 'relative', zIndex: 1,
              }}
            >
              {tab === 'history' ? t.tabHistory : t.tabTrends}
            </button>
          ))}
        </div>

        {/* ── 급여 내역 탭 ── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 년도 네비 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10, marginBottom: 10 }}>
              <button onClick={() => setHistoryYear(p => p - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DARK_GREEN }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: 25, fontWeight: 800, color: DARK_GREEN }}>{t.yearLabel(historyYear)}</span>
              <button
                onClick={() => setHistoryYear(p => p + 1)}
                disabled={isCurrentYear}
                style={{ background: 'none', border: 'none', cursor: isCurrentYear ? 'default' : 'pointer', color: isCurrentYear ? '#ccc' : DARK_GREEN }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 월별/주별/일별 세그먼트 */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['monthly', 'weekly', 'daily'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setHistoryView(v)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 54, fontSize: 16, fontWeight: 600,
                    border: historyView === v ? 'none' : `1px solid ${BORDER_GREEN}`,
                    background: historyView === v ? DARK_GREEN : 'transparent',
                    color: historyView === v ? '#fff' : DARK_GREEN,
                    cursor: 'pointer',
                  }}
                >
                  {v === 'monthly' ? t.monthly : v === 'weekly' ? t.weekly : t.daily}
                </button>
              ))}
            </div>

            {loadingHistory ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.loadingHistory}</p>
            ) : (
              <>
                {/* 월별 뷰 */}
                {historyView === 'monthly' && (
                  history.length === 0
                    ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.noHistory}</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {history.map((item, idx) => (
                          <div key={idx} style={{
                            background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
                            borderRadius: 26, padding: '16px 20px',
                            boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginRight: 15 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: DARK_GREEN, borderLeft: `4px solid ${GREEN}`, paddingLeft: 10 }}>{item.label}</span>
                              <span style={{
                                background: LIGHT_GREEN, color: DARK_GREEN, borderRadius: 20,
                                padding: '3px 10px', fontSize: 13, fontWeight: 600,
                              }}>{t.calcDone}</span>
                            </div>
                            <PayDetail data={item.data} shiftList={item.shifts} />
                          </div>
                        ))}
                      </div>
                )}

                {/* 주별 뷰 */}
                {historyView === 'weekly' && (
                  weeklyHistory.length === 0
                    ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.noHistory}</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {weeklyHistory.map((w, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 18px',
                            background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(0,162,0,0.12)', borderRadius: 16,
                            boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              {/* 주차 번호 */}
                              <div style={{ textAlign: 'center', minWidth: 48 }}>
                                <p style={{ fontSize: 13, color: '#8BA68D' }}>Week</p>
                                <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>{idx + 1}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: DARK_GREEN }}>{w.weekLabel}</p>
                                <p style={{ fontSize: 13, color: '#8BA68D', marginTop: 2 }}>
                                  {t.weekSummary(w.count, w.hours)}
                                </p>
                              </div>
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 800, color: DARK_GREEN }}>{t.fmtCurrency(w.total)}</p>
                          </div>
                        ))}
                      </div>
                )}

                {/* 일별 뷰 */}
                {historyView === 'daily' && (
                  dailyHistory.length === 0
                    ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.noHistory}</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dailyHistory.map((s, idx) => {
                          const d = getDatePart(s.work_date);
                          const hours = calcHours(s.start_at, s.end_at);
                          return (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '14px 18px',
                              background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)',
                              border: '1px solid rgba(0,162,0,0.12)',
                              borderRadius: 16,
                              boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ textAlign: 'center', minWidth: 48 }}>
                                  <p style={{ fontSize: 13, color: '#8BA68D' }}>{getDayName(d, translations.employeeHome[language].days)}</p>
                                  <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>{d.slice(8)}</p>
                                  <p style={{ fontSize: 12, color: '#8BA68D' }}>{d.slice(0,7).replace('-','.')}</p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN }}>
                                    {getTimePart(s.start_at)} ~ {getTimePart(s.end_at)}
                                    <span style={{ fontSize: 13, fontWeight: 400, color: '#8BA68D', marginLeft: 8 }}>{hours.toFixed(1)}h</span>
                                  </p>
                                </div>
                              </div>
                              <p style={{ fontSize: 18, fontWeight: 800, color: DARK_GREEN }}>{t.fmtCurrency(s.pay)}</p>
                            </div>
                          );
                        })}
                      </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 통계 탭 ── */}
        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 26, padding: '16px 20px',
            }}>
              <SectionPill>{t.monthlyTrend}</SectionPill>
              {loadingHistory ? (
                <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.loadingHistory}</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,162,0,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5a8a5c' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#5a8a5c' }} tickFormatter={v => (v/10000).toFixed(0)+'만'} />
                    <Tooltip formatter={(v: number) => t.fmtCurrency(v)} />
                    <Line type="monotone" dataKey="급여" stroke={GREEN} strokeWidth={2} dot={{ r: 4, fill: DARK_GREEN }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {!loadingHistory && history.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
                borderRadius: 26, padding: '16px 20px',
              }}>
                <SectionPill>{t.payStats(history.length)}</SectionPill>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#5a8a5c' }}>{t.avgMonthlyPay}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: DARK_GREEN }}>
                      {t.fmtCurrencyM(history.reduce((s,h) => s+h.data.totalPay, 0) / history.length)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#5a8a5c' }}>{t.maxPay}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>
                      {t.fmtCurrencyM(Math.max(...history.map(h => h.data.totalPay)))}
                    </p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,162,0,0.2)', paddingTop: 12 }}>
                  <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 4 }}>{t.totalIncome(history.length)}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>
                    {t.fmtCurrencyM(history.reduce((s,h) => s+h.data.totalPay, 0))}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EmployeeBottomNav />
    </div>
  );
}

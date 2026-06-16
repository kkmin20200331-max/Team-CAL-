import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import EmployeeHeader from './EmployeeHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

interface PayrollResult {
  basePay: number; overtimePay: number; nightPay: number;
  weeklyPay: number; totalPay: number;
}
interface ShiftVO {
  id: string; work_date: string; start_at: string; end_at: string; status: string;
}
interface MemberInfo { pay_type: string | null; pay_amount: number | null; }
interface HistoryItem {
  label: string; data: PayrollResult; shifts: ShiftVO[];
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};
const getDatePart = (s: string) => !s ? '' : s.includes('T') ? s.split('T')[0] : s.split(' ')[0];
const getTimePart = (s: string) => {
  if (!s) return '';
  const t = s.includes('T') ? s.split('T')[1] : s.split(' ')[1];
  return t ? t.substring(0, 5) : '';
};
const getDayName = (d: string, days: string[]) => { const [y,m,dd] = d.split('-').map(Number); return days[new Date(y,m-1,dd).getDay()]; };
const calcHours = (start: string, end: string) => {
  const getMin = (s: string) => { const t = s.includes('T') ? s.split('T')[1] : s.split(' ')[1]; if (!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+(m||0); };
  return Math.max(0, (getMin(end)-getMin(start))/60);
};
const fmtW = (n: number) => Math.round(n).toLocaleString() + '원';
const fmtM = (n: number) => (Math.round(n)/10000).toFixed(1) + '만원';

const getIsoMonday = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() + diff);
  return toDateStr(mon);
};

export default function EmployeePayroll() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeePayroll[language];
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const [storeId, setStoreId] = useState(localStorage.getItem('store_id') || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [payroll, setPayroll] = useState<PayrollResult | null>(null);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyView, setHistoryView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [requesting, setRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history');

  useEffect(() => {
    if (storeId || !user.id) return;
    API.get('/store/my', { params: { user_id: user.id } })
      .then(res => { if (res.data?.id) { setStoreId(res.data.id); localStorage.setItem('store_id', res.data.id); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user.id || !storeId) return;
    API.get('/store_member/pay', { params: { user_id: user.id, store_id: storeId } })
      .then(res => { if (res.data) setMemberInfo(res.data); })
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    if (!user.id || !storeId) return;
    setLoadingPayroll(true);
    const start = toDateStr(startOfMonth(selectedMonth));
    const end = toDateStr(endOfMonth(selectedMonth));
    Promise.all([
      API.get('/payroll', { params: { user_id: user.id, store_id: storeId, start_date: start, end_date: end } }),
      API.get('/shift/staff', { params: { user_id: user.id, start_date: start, end_date: end } }),
    ])
      .then(([p, s]) => { setPayroll(p.data); setShifts(Array.isArray(s.data) ? s.data : []); })
      .catch(() => {})
      .finally(() => setLoadingPayroll(false));
  }, [storeId, selectedMonth]);

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
      months.map(m => {
        const start = toDateStr(startOfMonth(m)), end = toDateStr(endOfMonth(m));
        return Promise.all([
          API.get('/payroll', { params: { user_id: user.id, store_id: storeId, start_date: start, end_date: end } }),
          API.get('/shift/staff', { params: { user_id: user.id, start_date: start, end_date: end } }),
        ]).then(([p, s]) => ({
          label: format(m, 'M월', { locale: ko }),
          data: p.data as PayrollResult,
          shifts: Array.isArray(s.data) ? s.data as ShiftVO[] : [],
        }));
      })
    )
      .then(r => setHistory(r.reverse()))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [storeId, historyYear]);

  const today = useMemo(() => toDateStr(new Date()), []);
  const assignedShifts = useMemo(
    () => shifts.filter(s => s.status !== 'VACANT' && s.status !== 'CANCELLED'),
    [shifts]
  );
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth();
  }, [selectedMonth]);
  const isCurrentYear = historyYear >= new Date().getFullYear();

  const thisWeekPay = useMemo(() => {
    if (!memberInfo?.pay_amount || memberInfo.pay_type !== 'HOURLY') return 0;
    if (!isCurrentMonth) return 0;
    const now = new Date();
    const dayNum = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (dayNum === 0 ? 6 : dayNum - 1));
    mon.setHours(0, 0, 0, 0);
    const monStr = toDateStr(mon);
    const sunStr = toDateStr(new Date(mon.getTime() + 6 * 86400000));
    return assignedShifts
      .filter(s => { const d = getDatePart(s.work_date); return d >= monStr && d <= sunStr; })
      .reduce((sum, s) => sum + calcHours(s.start_at, s.end_at) * memberInfo.pay_amount!, 0);
  }, [assignedShifts, memberInfo, isCurrentMonth]);

  const handleWeeklyRequest = async () => {
    setRequesting(true);
    await new Promise(r => setTimeout(r, 600));
    alert(`${t.weeklyAdvanceRequest}\n${fmtW(thisWeekPay)}`);
    setRequesting(false);
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
    const map: Record<string, { weekLabel: string; total: number; hours: number; count: number }> = {};
    dailyHistory.forEach(s => {
      const dateStr = getDatePart(s.work_date);
      const monStr = getIsoMonday(dateStr);
      const [y, m, d] = monStr.split('-').map(Number);
      const sunDt = new Date(y, m - 1, d + 6);
      const weekLabel = `${monStr.slice(5).replace('-','/')} ~ ${toDateStr(sunDt).slice(5).replace('-','/')}`;
      if (!map[monStr]) map[monStr] = { weekLabel, total: 0, hours: 0, count: 0 };
      map[monStr].total += s.pay;
      map[monStr].hours += calcHours(s.start_at, s.end_at);
      map[monStr].count += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, v]) => v);
  }, [dailyHistory]);

  const chartData = useMemo(() =>
    [...history].reverse().map(h => ({ month: h.label, 급여: Math.round(h.data.totalPay) })),
    [history]
  );

  const payLabel = memberInfo?.pay_type === 'MONTHLY'
    ? `월급 ${memberInfo.pay_amount?.toLocaleString()}원`
    : memberInfo?.pay_type === 'HOURLY'
    ? `시급 ${memberInfo.pay_amount?.toLocaleString()}원/시`
    : null;

  const renderShiftRows = (list: ShiftVO[]) => {
    const valid = list.filter(s => s.status !== 'VACANT' && s.status !== 'CANCELLED');
    if (!valid.length) return <p style={{ fontSize: 15, color: '#aaa', padding: '8px 0' }}>{t.noShifts}</p>;
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
          <span style={{ fontSize: 14, fontWeight: 600, color: DARK_GREEN, fontVariantNumeric: 'tabular-nums' }}>
            {calcHours(s.start_at, s.end_at).toFixed(1)}h
          </span>
        </div>
      );
    });
  };

  const PayDetail = ({ data, shiftList }: { data: PayrollResult; shiftList: ShiftVO[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {payLabel && (
        <div style={{ fontSize: 15, color: '#5a8a5c', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⏱ {payLabel}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {renderShiftRows(shiftList)}
      </div>
      <div style={{ borderTop: `1px solid rgba(0,162,0,0.2)`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span style={{ color: '#5a8a5c' }}>{t.basePay}</span>
          <span style={{ fontWeight: 600, color: DARK_GREEN }}>{fmtW(data.basePay)}</span>
        </div>
        {data.overtimePay > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
            <span style={{ color: '#5a8a5c' }}>{t.overtimePay}</span>
            <span style={{ fontWeight: 600, color: GREEN }}>+{fmtW(data.overtimePay)}</span>
          </div>
        )}
        {data.nightPay > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
            <span style={{ color: '#5a8a5c' }}>{t.nightPay}</span>
            <span style={{ fontWeight: 600, color: GREEN }}>+{fmtW(data.nightPay)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span style={{ color: '#5a8a5c' }}>{t.weeklyPay}</span>
          <span style={{ fontWeight: 600, color: data.weeklyPay > 0 ? GREEN : '#aaa' }}>
            {data.weeklyPay > 0 ? `+${fmtW(data.weeklyPay)}` : '-'}
          </span>
        </div>
      </div>
      <div style={{ borderTop: `1px solid rgba(0,162,0,0.2)`, paddingTop: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#5a8a5c', marginBottom: 4 }}>{t.totalPay}</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>{fmtW(data.totalPay)}</p>
      </div>
    </div>
  );

  const SectionPill = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: DARK_GREEN, borderRadius: 54.55,
      boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
      height: 36, minWidth: 168, padding: '0 20px',
      fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)',
      paddingBottom: 120,
    }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{t.title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 이번 달 급여 카드 ── */}
        <div style={{
          background: 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`,
          borderRadius: 26, padding: '20px 20px',
          boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
        }}>
          {/* 월 네비 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: DARK_GREEN }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: DARK_GREEN }}>
                {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
              </span>
              <span style={{ fontSize: 13, color: '#5a8a5c', marginLeft: 8 }}>
                {isCurrentMonth ? t.currentMonthExpected : t.payrollResult}
              </span>
            </div>
            <button
              onClick={() => setSelectedMonth(prev => subMonths(prev, -1))}
              disabled={isCurrentMonth}
              style={{ background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer', padding: 4, color: isCurrentMonth ? '#ccc' : DARK_GREEN }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {loadingPayroll ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.calculating}</p>
          ) : !payroll ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 16 }}>{t.cannotLoad}</p>
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
            <div>
              <p style={{ fontSize: 13, color: '#5a8a5c', marginBottom: 4 }}>{t.thisWeekExpected}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: DARK_GREEN }}>{fmtW(thisWeekPay)}</p>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{t.weeklyNote}</p>
            </div>
            <button
              onClick={handleWeeklyRequest}
              disabled={requesting || thisWeekPay === 0}
              style={{
                background: thisWeekPay === 0 ? '#ccc' : DARK_GREEN,
                color: '#fff', border: 'none', borderRadius: 54,
                padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: thisWeekPay === 0 ? 'default' : 'pointer',
              }}
            >
              {requesting ? t.requesting : t.weeklyAdvanceRequest}
            </button>
          </div>
        )}

        {/* ── 탭 ── */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: LIGHT_GREEN, borderRadius: 17, padding: '10px 10px', height: 72,
          boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25), inset 0px 4px 6px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            position: 'absolute', top: 10, bottom: 10,
            left: activeTab === 'history' ? 10 : 'calc(50% + 5px)',
            width: 'calc(50% - 15px)', background: '#fff', borderRadius: 11,
            opacity: 0.52, filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.15))',
            transition: 'left 0.2s ease', pointerEvents: 'none',
          }} />
          {(['history', 'trends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                color: activeTab === tab ? DARK_GREEN : '#5a8a5c',
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => setHistoryYear(p => p - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DARK_GREEN }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN }}>{historyYear}년</span>
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <span style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN }}>{item.label}</span>
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
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {weeklyHistory.map((w, idx) => (
                          <div key={idx} style={{
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(24,160,34,0.04)',
                            border: '1px solid rgba(0,162,0,0.12)', borderRadius: 16, padding: '14px 18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <div>
                              <p style={{ fontSize: 13, color: '#5a8a5c' }}>{w.weekLabel}</p>
                              <p style={{ fontSize: 16, fontWeight: 600, color: DARK_GREEN, marginTop: 2 }}>
                                {w.count}일 · {w.hours.toFixed(1)}h
                              </p>
                            </div>
                            <p style={{ fontSize: 20, fontWeight: 800, color: DARK_GREEN }}>{fmtW(w.total)}</p>
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
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(24,160,34,0.04)',
                              border: '1px solid rgba(0,162,0,0.12)', borderRadius: 16, padding: '12px 16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ textAlign: 'center', minWidth: 36 }}>
                                  <p style={{ fontSize: 13, color: '#5a8a5c' }}>{getDayName(d, translations.employeeHome[language].days)}</p>
                                  <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>{d.slice(8)}</p>
                                  <p style={{ fontSize: 13, color: '#5a8a5c' }}>{d.slice(0,7).replace('-','.')}</p>
                                </div>
                                <div>
                                  <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN }}>{getTimePart(s.start_at)} ~ {getTimePart(s.end_at)}</p>
                                  <p style={{ fontSize: 13, color: '#5a8a5c' }}>{hours.toFixed(1)}h</p>
                                </div>
                              </div>
                              <p style={{ fontSize: 18, fontWeight: 800, color: DARK_GREEN }}>{fmtW(s.pay)}</p>
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
                    <Tooltip formatter={(v: number) => fmtW(v)} />
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
                      {fmtM(history.reduce((s,h) => s+h.data.totalPay, 0) / history.length)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#5a8a5c' }}>{t.maxPay}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>
                      {fmtM(Math.max(...history.map(h => h.data.totalPay)))}
                    </p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,162,0,0.2)', paddingTop: 12 }}>
                  <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 4 }}>{t.totalIncome(history.length)}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN }}>
                    {fmtM(history.reduce((s,h) => s+h.data.totalPay, 0))}
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

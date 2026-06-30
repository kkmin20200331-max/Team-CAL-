import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Calendar,
  ClipboardCheck, UserPlus, Users, Wallet, FileText, MessageSquare, BarChart3, Video,
  Sparkles, X
} from "lucide-react";
import {
  format, addMonths, startOfMonth, endOfMonth,
  startOfWeek, addDays, isSameMonth, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import AdminHeader from './AdminHeader';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';


// 한국 공휴일 (2025~2026)
const HOLIDAYS: { [key: string]: string } = {
  "2025-01-01": "신정",
  "2025-01-28": "설 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설 연휴",
  "2025-03-01": "삼일절",
  "2025-05-05": "어린이날",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-09": "한글날",
  "2025-12-25": "크리스마스",
  "2026-01-01": "신정",
  "2026-01-27": "설 연휴",
  "2026-01-28": "설날",
  "2026-01-29": "설 연휴",
  "2026-03-01": "삼일절",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-09": "한글날",
  "2026-12-25": "크리스마스",
};

interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
}

interface AiSchedulePreview {
  shifts: ShiftVO[];
  reasons?: { shift_id: string; reason: string }[];
  total_count: number;
  closer_count: number;
  newbie_solo_avoided_count: number;
  conflict_excluded_count: number;
}

export default function MonthlySchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.monthlySchedule[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const DAY_LABELS = t.dayLabels;

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiSchedulePreview | null>(null);

  useEffect(() => {
    if (selectedBranchId) fetchShifts();
  }, [currentMonth, selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) fetchEmployees();
  }, [selectedBranchId]);

  const fetchShifts = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    try {
      const res = await axiosInstance.get("/shift", {
        params: { store_id: selectedBranchId, start_date: start, end_date: end },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users", { params: { store_id: selectedBranchId } });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("직원 조회 실패:", err);
    }
  };

  // 달력 날짜 배열 생성 (월요일 시작, 6주)
  const getCalendarDates = (): Date[] => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  };

  const getWorkDateStr = (shift: ShiftVO): string => {
    const raw = shift.work_date || "";
    if (raw.includes("T")) return raw.split("T")[0];
    if (raw.includes(" ")) return raw.split(" ")[0];
    return raw;
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter((s) => getWorkDateStr(s) === dateStr);
  };

  const getEmployeeName = (userId: string) =>
    employees.find((employee) => employee.id === userId)?.name || userId;

  const getShiftReason = (shiftId: string) =>
    aiPreview?.reasons?.find((item) => item.shift_id === shiftId)?.reason || "";

  const formatShiftTime = (value: string) => {
    if (!value) return "";
    if (value.includes("T")) return value.split("T")[1].substring(0, 5);
    if (value.includes(" ")) return value.split(" ")[1].substring(0, 5);
    return value.substring(0, 5);
  };

  const handleAiPreview = async () => {
    if (!selectedBranchId) return;
    setAiLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const res = await axiosInstance.post("/shift/ai-preview", {
        store_id: selectedBranchId,
        start_date: start,
        end_date: end,
      });
      setAiPreview(res.data);
    } catch (err) {
      console.error("AI 스케줄 생성 실패:", err);
      alert(t.aiError);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiApply = async () => {
    if (!selectedBranchId || !aiPreview) return;
    setAiLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      await axiosInstance.post("/shift/ai-apply", {
        store_id: selectedBranchId,
        start_date: start,
        end_date: end,
        shifts: aiPreview.shifts,
      });
      setAiPreview(null);
      await fetchShifts();
      alert(t.aiApplySuccess);
    } catch (err) {
      console.error("AI 스케줄 반영 실패:", err);
      alert(t.aiApplyError);
    } finally {
      setAiLoading(false);
    }
  };

  const calendarDates = getCalendarDates();
  const today = new Date();

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const contentBg = isDark ? '#141414' : '#fff';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? '#141414' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#c8c8c8' : '#555';
  const cellBorder = isDark ? '#1a1a1a' : '#d4edda';
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center', fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* 사이드바 */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', background: sidebarBg, borderRadius: 20, border: `1px solid ${sidebarBorder}`, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#1a1a1a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: isDark ? '#141414' : '#fff', border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {stores.map(s => (
                  <div key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); navigate(`/admin/dashboard/${s.id}`); setBranchDropdownOpen(false); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: textColor, borderBottom: `1px solid ${isDark ? '#1a1a1a' : LIGHT_GREEN}` }}>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = path.includes('/schedule/') ? location.pathname.includes('/admin/schedule/') : (location.pathname === path || location.pathname.startsWith(path));
            return (
              <button key={label} onClick={() => navigate(path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600, background: isActive ? GREEN : 'transparent', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none', textAlign: 'left' }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} color={isActive ? '#fff' : GREEN} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)', minHeight: 'calc(100vh - 120px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> {t.breadcrumb}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={26} />{t.pageTitle}
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{t.pageSubtitle}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleAiPreview}
                disabled={aiLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, padding: '8px 18px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.65 : 1 }}
              >
                <Sparkles size={16} />{aiLoading ? t.aiLoading : t.aiButton}
              </button>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentMonth(new Date())} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '6px 16px', fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.today}</button>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronRight size={16} /></button>
            </div>
          </div>
        {/* 범례 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, marginBottom: 16 }}>
          {[
            { color: '#18A022', label: t.legendConfirmed },
            { color: '#f59e0b', label: t.legendPending },
            { color: '#ef4444', label: t.legendCancelled },
            { color: '#fca5a5', label: t.legendHoliday },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ color: subTextColor }}>{label}</span>
            </div>
          ))}
        </div>

        {/* 뷰 전환 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 15, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(selectedBranchId ? `/admin/schedule/weekly/${selectedBranchId}` : '/admin/branch-selection')}>
            {t.weeklyView}
          </button>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 15, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => navigate(selectedBranchId ? `/admin/schedule/daily/${selectedBranchId}/${format(new Date(), 'yyyy-MM-dd')}` : '/admin/branch-selection')}>
            <Calendar size={16} />{t.dailyView}
          </button>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', overflow: 'hidden' }}>
          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: isDark ? '#1a1a1a' : LIGHT_GREEN }}>
            {DAY_LABELS.map((day, i) => (
              <div key={day} style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: 700, color: i === 5 ? '#2563eb' : i === 6 ? '#ef4444' : (isDark ? '#4cd964' : DARK_GREEN) }}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: subTextColor }}>{t.loading}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderLeft: `1px solid ${cellBorder}`, borderTop: `1px solid ${cellBorder}` }}>
              {calendarDates.map((date, index) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const dayShifts = getShiftsForDate(date);
                const confirmedCount = dayShifts.filter(s => s.status === "confirmed").length;
                const pendingCount = dayShifts.filter(s => s.status === "pending").length;
                const cancelledCount = dayShifts.filter(s => s.status === "cancelled").length;
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isToday = isSameDay(date, today);
                const isHoliday = !!HOLIDAYS[dateStr];
                const isSunday = date.getDay() === 0;
                const isSaturday = date.getDay() === 6;
                const isRed = isHoliday || isSunday;

                let dateBg = 'transparent';
                if (!isCurrentMonth) dateBg = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)';
                else if (isRed) dateBg = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(254,202,202,0.3)';
                else if (isSaturday) dateBg = isDark ? 'rgba(37,99,235,0.08)' : 'rgba(219,234,254,0.3)';

                let dateNumColor = textColor;
                if (!isCurrentMonth) dateNumColor = isDark ? '#555' : '#bbb';
                else if (isRed) dateNumColor = '#ef4444';
                else if (isSaturday) dateNumColor = '#2563eb';

                return (
                  <div
                    key={index}
                    onClick={() => isCurrentMonth && selectedBranchId && navigate(`/admin/schedule/daily/${selectedBranchId}/${dateStr}`)}
                    style={{
                      minHeight: 90, padding: 8, background: dateBg,
                      borderRight: `1px solid ${cellBorder}`, borderBottom: `1px solid ${cellBorder}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 500,
                      background: isToday && isCurrentMonth ? DARK_GREEN : 'transparent',
                      color: isToday && isCurrentMonth ? '#fff' : dateNumColor,
                    }}>
                      {format(date, "d")}
                    </div>
                    {isHoliday && isCurrentMonth && (
                      <span style={{ fontSize: 9, color: '#ef4444', textAlign: 'center', marginTop: 2 }}>{HOLIDAYS[dateStr]}</span>
                    )}
                    {isCurrentMonth && (confirmedCount > 0 || pendingCount > 0 || cancelledCount > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 'auto', justifyContent: 'center', paddingBottom: 4 }}>
                        {Array.from({ length: Math.min(confirmedCount, 3) }).map((_, i) => <div key={`cf-${i}`} style={{ width: 7, height: 7, borderRadius: '50%', background: '#18A022' }} />)}
                        {confirmedCount > 3 && <span style={{ fontSize: 8, color: '#18A022', fontWeight: 600 }}>+{confirmedCount - 3}</span>}
                        {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => <div key={`p-${i}`} style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />)}
                        {pendingCount > 3 && <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 600 }}>+{pendingCount - 3}</span>}
                        {Array.from({ length: Math.min(cancelledCount, 3) }).map((_, i) => <div key={`c-${i}`} style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />)}
                        {cancelledCount > 3 && <span style={{ fontSize: 8, color: '#ef4444', fontWeight: 600 }}>+{cancelledCount - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>
      </div>
      {aiPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => !aiLoading && setAiPreview(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 620, margin: '0 16px', background: isDark ? '#141414' : '#fff', borderRadius: 24, border: `1px solid ${BORDER_GREEN}`, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color={isDark ? '#4cd964' : DARK_GREEN} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: textColor }}>{t.aiModalTitle}</h2>
                  <p style={{ fontSize: 13, color: subTextColor, marginTop: 2 }}>{format(currentMonth, "yyyy년 M월", { locale: ko })}</p>
                </div>
              </div>
              <button onClick={() => setAiPreview(null)} disabled={aiLoading} style={{ background: 'none', border: 'none', cursor: aiLoading ? 'default' : 'pointer', color: subTextColor }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: t.statCreated, value: aiPreview.total_count },
                { label: t.statCloser, value: aiPreview.closer_count },
                { label: t.statNewbie, value: aiPreview.newbie_solo_avoided_count },
                { label: t.statConflict, value: aiPreview.conflict_excluded_count },
              ].map((item) => (
                <div key={item.label} style={{ background: isDark ? '#1a1a1a' : '#f8fff4', border: `1px solid ${BORDER_GREEN}`, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: DARK_GREEN }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 260, overflowY: 'auto', border: `1px solid ${isDark ? '#1a1a1a' : '#e8f5e9'}`, borderRadius: 16 }}>
              {aiPreview.shifts.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '34px 0', color: subTextColor }}>{t.noShiftsGenerated}</p>
              ) : (
                aiPreview.shifts.slice(0, 20).map((shift) => (
                  <div key={shift.id} style={{ padding: '12px 14px', borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#e8f5e9'}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>{getWorkDateStr(shift)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{getEmployeeName(shift.user_id)}</span>
                      <span style={{ fontSize: 13, color: subTextColor, textAlign: 'right' }}>{formatShiftTime(shift.start_at)} - {formatShiftTime(shift.end_at)}</span>
                    </div>
                    {getShiftReason(shift.id) && (
                      <p style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: isDark ? '#141414' : '#f1fae8', fontSize: 12, lineHeight: 1.5, color: subTextColor }}>
                        {getShiftReason(shift.id)}
                      </p>
                    )}
                  </div>
                ))
              )}
              {aiPreview.shifts.length > 20 && (
                <p style={{ padding: '10px 14px', fontSize: 12, color: subTextColor, textAlign: 'center' }}>{t.moreShifts(aiPreview.shifts.length - 20)}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={handleAiPreview} disabled={aiLoading} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 700, cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.65 : 1 }}>
                {t.regenerate}
              </button>
              <button onClick={handleAiApply} disabled={aiLoading || aiPreview.shifts.length === 0} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 700, cursor: aiLoading || aiPreview.shifts.length === 0 ? 'default' : 'pointer', opacity: aiLoading || aiPreview.shifts.length === 0 ? 0.65 : 1 }}>
                {aiLoading ? t.aiProcessing : t.applyToSchedule}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  ChevronLeft, ChevronRight, Search, Calendar,
  ClipboardCheck, UserPlus, Users, Wallet, FileText, MessageSquare, BarChart3, Video
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import AdminHeader from './AdminHeader';
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

interface Employee {
  id: string;
  name: string;
  phone: string;
  username: string;
}

interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

const getWeekDates = (baseDate: Date) => {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

const getDateStr = (dateStr: string) => {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return "";
  if (isoStr.includes("T")) return isoStr.split("T")[1].substring(0, 5);
  if (isoStr.includes(" ")) return isoStr.split(" ")[1].substring(0, 5);
  return isoStr.substring(0, 5);
};

const getStatusStyle = (status: string, isDark: boolean) => {
  switch (status) {
    case "confirmed": return { background: isDark ? 'rgba(24,160,34,0.2)' : '#E6F5C8', border: '2px solid #18A022', color: isDark ? '#4cd964' : '#07790F' };
    case "pending": return { background: isDark ? 'rgba(245,158,11,0.2)' : '#fef9c3', border: '2px solid #f59e0b', color: '#92400e' };
    case "cancelled": return { background: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2', border: '2px dashed #ef4444', color: '#7f1d1d' };
    default: return { background: isDark ? '#50505a' : '#f3f4f6', border: '2px solid #d1d5db', color: '#111' };
  }
};

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.weeklySchedule[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const weekDates = getWeekDates(currentWeek);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetchEmployees();
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetchShifts();
  }, [currentWeek, selectedBranchId]);

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users", { params: { store_id: selectedBranchId } });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("직원 조회 실패:", err);
    }
  };

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const startDate = format(weekDates[0], "yyyy-MM-dd");
      const endDate = format(weekDates[6], "yyyy-MM-dd");
      const res = await axiosInstance.get("/shift", {
        params: {
          store_id: selectedBranchId,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무표 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const getShiftsForEmployee = (userId: string, date: Date): ShiftVO[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter(
      (s) => s.user_id === userId && getDateStr(s.work_date) === dateStr,
    );
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pageBg = isDark ? 'linear-gradient(180deg, #1a3020 -12.05%, #2a3a28 17.27%, #30303a 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const contentBg = isDark ? '#3c3c46' : '#fff';
  const mainBg = isDark ? '#35353f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? '#3c3c46' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const cellBorder = isDark ? '#50505a' : '#d4edda';
  const sidebarBg = isDark ? 'rgba(52,52,60,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#50505a' : BORDER_GREEN;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* 사이드바 */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', background: sidebarBg, borderRadius: 20, border: `1px solid ${sidebarBorder}`, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#50505a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: isDark ? '#3c3c46' : '#fff', border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {stores.map(s => (
                  <div key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); navigate(`/admin/dashboard/${s.id}`); setBranchDropdownOpen(false); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: textColor, borderBottom: `1px solid ${isDark ? '#50505a' : LIGHT_GREEN}` }}>
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
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> 근무표 관리
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={26} />주간 근무 일정 관리
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>이번 주 직원별 근무 일정을 관리합니다.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setCurrentWeek(prev => addDays(prev, -7))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronLeft size={18} /></button>
              <button onClick={() => setCurrentWeek(new Date())} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, padding: '6px 16px', color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.today}</button>
              <button onClick={() => setCurrentWeek(prev => addDays(prev, 7))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronRight size={18} /></button>
            </div>
          </div>
        {/* 검색 + 범례 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            {[
              { color: LIGHT_GREEN, border: `2px solid ${GREEN}`, label: t.legendConfirmed },
              { color: '#fef9c3', border: '2px solid #f59e0b', label: t.legendPending },
              { color: '#fee2e2', border: '2px dashed #ef4444', label: t.legendCancelled },
              { color: '#fca5a5', border: 'none', label: t.legendHoliday, dot: true },
            ].map(({ color, border, label, dot }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: subTextColor }}>
                {dot ? <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> : <div style={{ width: 16, height: 16, background: color, border, borderRadius: 4 }} />}
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, background: isDark ? '#50505a' : '#fff', color: textColor, fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        {/* 뷰 전환 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate(selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection')} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.monthlyView}</button>
          <button onClick={() => navigate(selectedBranchId ? `/admin/schedule/daily/${selectedBranchId}/${format(new Date(), 'yyyy-MM-dd')}` : '/admin/branch-selection')} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.dailyView}</button>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: LIGHT_GREEN }}>
                  <th style={{ position: 'sticky', left: 0, zIndex: 10, background: LIGHT_GREEN, padding: '14px 16px', textAlign: 'left', borderRight: `1px solid ${cellBorder}`, borderBottom: `1px solid ${cellBorder}`, minWidth: 150, fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
                    {t.employeeName}
                  </th>
                  {weekDates.map((date, index) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const holiday = HOLIDAYS[dateStr];
                    const isSunday = date.getDay() === 0;
                    const isSaturday = date.getDay() === 6;
                    const isRed = !!(holiday || isSunday);
                    return (
                      <th key={index} onClick={() => selectedBranchId && navigate(`/admin/schedule/daily/${selectedBranchId}/${dateStr}`)}
                        style={{
                          padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
                          borderRight: `1px solid ${cellBorder}`, borderBottom: `1px solid ${cellBorder}`,
                          minWidth: 120, background: isRed ? 'rgba(254,202,202,0.3)' : isSaturday ? 'rgba(219,234,254,0.3)' : LIGHT_GREEN,
                        }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: isRed ? '#ef4444' : isSaturday ? '#2563eb' : DARK_GREEN }}>{format(date, "EEE", { locale: ko })}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: isRed ? '#ef4444' : isSaturday ? '#2563eb' : DARK_GREEN }}>{format(date, "d")}</span>
                          {holiday && <span style={{ fontSize: 10, color: '#ef4444' }}>{holiday}</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: subTextColor }}>{t.loading}</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: subTextColor }}>{t.noEmployees}</td></tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 10, background: isDark ? '#3c3c46' : '#fff', padding: '12px 16px', borderRight: `1px solid ${cellBorder}`, borderBottom: `1px solid ${cellBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {employee.name[0]}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{employee.name}</p>
                            <p style={{ fontSize: 11, color: subTextColor }}>{employee.username}</p>
                          </div>
                        </div>
                      </td>
                      {weekDates.map((date, dateIndex) => {
                        const dayShifts = getShiftsForEmployee(employee.id, date);
                        const dateStr = format(date, "yyyy-MM-dd");
                        const isHoliday = !!HOLIDAYS[dateStr];
                        const isSunday = date.getDay() === 0;
                        const isSaturday = date.getDay() === 6;
                        const isRed = isHoliday || isSunday;
                        return (
                          <td key={dateIndex} style={{
                            padding: 8, borderRight: `1px solid ${cellBorder}`, borderBottom: `1px solid ${cellBorder}`,
                            textAlign: 'center', verticalAlign: 'top',
                            background: isRed ? (isDark ? 'rgba(239,68,68,0.05)' : 'rgba(254,202,202,0.15)') : isSaturday ? (isDark ? 'rgba(37,99,235,0.05)' : 'rgba(219,234,254,0.15)') : 'transparent',
                          }}>
                            {dayShifts.length === 0 ? (
                              <div onClick={() => selectedBranchId && navigate(`/admin/schedule/daily/${selectedBranchId}/${dateStr}`)} style={{ height: 48, borderRadius: 8, cursor: 'pointer' }} />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {dayShifts.map((shift) => {
                                  const ss = getStatusStyle(shift.status, isDark);
                                  return (
                                    <div key={shift.id} onClick={() => selectedBranchId && navigate(`/admin/schedule/daily/${selectedBranchId}/${dateStr}`)}
                                      style={{ ...ss, borderRadius: 8, padding: '6px 4px', fontSize: 11, cursor: 'pointer' }}>
                                      <div style={{ fontWeight: 700 }}>{formatTime(shift.start_at)}</div>
                                      <div style={{ fontWeight: 700 }}>{formatTime(shift.end_at)}</div>
                                      {shift.status !== 'confirmed' && (
                                        <div style={{ fontSize: 10, marginTop: 2 }}>{shift.status === 'pending' ? t.statusPending : t.statusCancelled}</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

import axiosInstance from "../../../lib/axiosInstance";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import Holidays from 'date-holidays';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';
import EmployeeHeader from './EmployeeHeader';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";


// date-holidays로 한국 공휴일 동적 조회
const hd = new Holidays('KR');
const getHolidayName = (dateStr: string): string | null => {
  const year = Number(dateStr.split('-')[0]);
  const holidays = hd.getHolidays(year);
  const match = holidays.find(h => {
    const d = new Date(h.date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}` === dateStr;
  });
  return match ? match.name : null;
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

interface SubstituteCalendarVO {
  application_id: string;
  application_status: string;
  substitute_post_id: string;
  shift_id: string | null;
  store_id: string;
  reason: string | null;
  work_date: string | null;
  start_at: string | null;
  end_at: string | null;
}

const formatTime = (isoStr: string) => {
  if (!isoStr) return "";
  if (isoStr.includes("T")) return isoStr.split("T")[1].substring(0, 5);
  if (isoStr.includes(" ")) return isoStr.split(" ")[1].substring(0, 5);
  return isoStr.substring(0, 5);
};

const getWorkDate = (shift: ShiftVO): string => {
  const raw = shift.work_date || "";
  if (raw.includes("T")) return raw.split("T")[0];
  if (raw.includes(" ")) return raw.split(" ")[0];
  return raw;
};

const calcHours = (start: string, end: string): number => {
  const [sh, sm] = formatTime(start).split(":").map(Number);
  const [eh, em] = formatTime(end).split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
};

const getDayLabel = (dateStr: string, days: string[]): string => {
  return days[new Date(dateStr).getDay()];
};

export default function MySchedule() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pageBg     = isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg     = isDark ? '#141414' : 'rgba(255,255,255,0.5)';
  const cardBorder = isDark ? '#2a2a2a' : '#00A200';
  const shiftRowBg = isDark ? '#1e1e1e' : '#fff';
  const toggleBg   = isDark ? '#1a2e1a' : '#E6F5C8';
  const textMain   = isDark ? '#fff' : '#07790F';
  const textSub    = isDark ? '#aaa' : '#8BA68D';
  const language = useLanguage();
  const t = translations.mySchedule[language];

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const storeName = sessionStorage.getItem("store_name") || "";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [subApplications, setSubApplications] = useState<SubstituteCalendarVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // 대타 지원 내역 (마운트 시 1회)
  useEffect(() => {
    if (!user.id) return;
    fetchSubApplications();
  }, []);

  // 월간 조회
  useEffect(() => {
    if (!user.id) return;
    if (viewMode === "month") fetchMonthShifts();
  }, [currentMonth, viewMode]);

  // 주간 조회
  useEffect(() => {
    if (!user.id) return;
    if (viewMode === "week") fetchWeekShifts();
  }, [currentWeekStart, viewMode]);

  const fetchSubApplications = async () => {
    try {
      const res = await axiosInstance.get("/substitute/staff/calendar", {
        params: { user_id: user.id },
      });
      setSubApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("대타 지원 내역 조회 실패:", err);
    }
  };

  const fetchMonthShifts = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const res = await axiosInstance.get("/shift/staff", {
        params: { user_id: user.id, start_date: start, end_date: end },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekShifts = async () => {
    setLoading(true);
    try {
      const start = format(currentWeekStart, "yyyy-MM-dd");
      const end = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");
      const res = await axiosInstance.get("/shift/staff", {
        params: { user_id: user.id, start_date: start, end_date: end },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const today = format(new Date(), "yyyy-MM-dd");
  const activeShifts = shifts.filter((s) => s.status !== "cancelled");
  const totalHours = activeShifts.reduce(
    (sum, s) => sum + calcHours(s.start_at, s.end_at),
    0,
  );
  const completedShifts = activeShifts.filter(
    (s) => getWorkDate(s) < today,
  ).length;
  const upcomingShifts = activeShifts.filter(
    (s) => getWorkDate(s) >= today,
  ).length;

  // 날짜별 상태 맵 (달력 점 표시용)
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    shifts.forEach((s) => {
      const date = getWorkDate(s);
      if (!map[date]) map[date] = new Set();
      map[date].add(s.status);
    });
    // 대타 지원 내역 추가 (달력 dot 표시, APPROVED는 shift로 이미 표시됨)
    subApplications.forEach((a) => {
      const dateStr = a.work_date
        ? a.work_date.substring(0, 10)
        : a.reason?.match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] ?? null;
      if (!dateStr) return;
      if (a.application_status?.toUpperCase() === 'APPROVED') return;
      if (!map[dateStr]) map[dateStr] = new Set();
      map[dateStr].add('sub_' + a.application_status?.toLowerCase());
    });
    return map;
  }, [shifts, subApplications]);

  const calendarDates = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth));
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [currentMonth]);

  // 달력 커스텀 DayContent - 컬러 점 + 공휴일 표시
  const CustomDayContent = useCallback(({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const statuses = shiftsByDate[dateStr];
    const isHoliday = !!getHolidayName(dateStr);
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;
    const isRed = isHoliday || isSunday || isSaturday;
    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
        background: isToday ? '#80D180' : undefined,
        borderRadius: isToday ? 8 : undefined,
        padding: isToday ? '2px 0' : undefined,
      }}>
        {/* 날짜 영역 - 항상 고정 높이 */}
        <div style={{ height: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, lineHeight: 1, fontWeight: isToday ? 700 : 400, color: isRed ? '#c00000' : undefined }}>
            {date.getDate()}
          </span>
          {isHoliday && (
            <span style={{ fontSize: 7, color: '#FFA6A6', lineHeight: 1, marginTop: 1, maxWidth: 28, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getHolidayName(dateStr)}
            </span>
          )}
        </div>
        {/* 점 영역 - 항상 고정 높이로 자리 차지 */}
        <div style={{ height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {statuses?.has('confirmed') && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#18A022', display: 'inline-block' }} />
          )}
          {(statuses?.has('pending') || statuses?.has('sub_pending')) && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFE75D', display: 'inline-block' }} />
          )}
          {statuses && [...statuses].some(s =>
            s !== 'confirmed' && s !== 'pending' && s !== 'sub_pending'
          ) && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A20000', display: 'inline-block' }} />
          )}
        </div>
      </div>
    );
  }, [shiftsByDate]);

  // 주간 뷰 7일
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i),
  );

  const getStatusBadge = (status: string) => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    };
    switch (status) {
      case 'confirmed':
        return <span style={{ ...base, background: '#18A022', color: '#fff' }}><CheckCircle2 style={{ width: 13, height: 13 }} />{t.statusConfirmed}</span>;
      case 'pending':
        return <span style={{ ...base, background: 'transparent', border: '1.5px solid #C9A800', color: '#C9A800' }}><AlertCircle style={{ width: 13, height: 13 }} />{t.statusPending}</span>;
      case 'cancelled':
        return <span style={{ ...base, background: '#8B1A1A', color: '#fff' }}><XCircle style={{ width: 13, height: 13 }} />{t.statusCancelled}</span>;
      default:
        return <span style={{ ...base, background: '#8B1A1A', color: '#fff' }}><XCircle style={{ width: 13, height: 13 }} />{t.statusSub}</span>;
    }
  };

  const getSubAppBadge = (status: string) => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    };
    const s = status?.toUpperCase();
    if (s === 'PENDING')
      return <span style={{ ...base, background: 'transparent', border: '1.5px solid #C9A800', color: '#C9A800' }}><AlertCircle style={{ width: 13, height: 13 }} />{t.statusPending}</span>;
    if (s === 'APPROVED')
      return <span style={{ ...base, background: '#18A022', color: '#fff' }}><CheckCircle2 style={{ width: 13, height: 13 }} />{t.statusConfirmed}</span>;
    return <span style={{ ...base, background: '#8B1A1A', color: '#fff' }}><XCircle style={{ width: 13, height: 13 }} />{t.statusCancelled}</span>;
  };

  // work_date가 null이면 reason 필드에서 [YYYY-MM-DD] 추출
  const getSubAppDate = (a: SubstituteCalendarVO): string | null => {
    if (a.work_date) return a.work_date.substring(0, 10);
    const match = a.reason?.match(/\[(\d{4}-\d{2}-\d{2})\]/);
    return match ? match[1] : null;
  };

  // 현재 월/주 범위에 해당하는 대타 지원 내역 필터
  const getSubAppsForRange = (startDate: string, endDate: string) =>
    subApplications.filter((a) => {
      const d = getSubAppDate(a);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });

  return (
    <div style={{ minHeight: '130vh', background: pageBg, paddingBottom: 120 }}>

      {/* Header */}
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB', textAlign: 'center', marginTop: 10, marginBottom: 10 }}>
            {viewMode === 'month' ? t.thisMonth : t.thisWeek}
          </h1>
          {/* 월간 통계 4칸 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, marginBottom: 25 }}>
            {[
              { label: t.totalWork,  value: `${activeShifts.length} ${t.unitDay}` },
              { label: t.totalHours, value: `${totalHours.toFixed(1)} h` },
              { label: t.completed,  value: `${completedShifts} ${t.unitCase}` },
              { label: t.scheduled,  value: `${upcomingShifts} ${t.unitCase}` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.45)',
                border: '1px solid #E6F5C8',
                boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
                borderRadius: 26,
                padding: '12px 4px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 20, color: '#fff', fontWeight: 400 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 15 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '20px 20px 0' }}>
        {/* View Toggle */}
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'center',
          background: toggleBg, borderRadius: 17,
          padding: '10px 10px',
          marginBottom: 40,
          boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25), inset 0px 4px 6px rgba(0,0,0,0.1)',
          height: 70,
        }}>
          {/* 활성 흰색 pill — 활성 탭 위치로 이동 */}
          <div style={{
            position: 'absolute',
            top: 10, bottom: 10,
            left: viewMode === 'month' ? 10 : 'calc(50% + 5px)',
            width: 'calc(50% - 15px)',
            background: '#fff',
            borderRadius: 11,
            opacity: 0.52,
            filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.15))',
            boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
            transition: 'left 0.2s ease',
            pointerEvents: 'none',
          }} />
          <button
            onClick={() => setViewMode('month')}
            style={{
              flex: 1, height: '100%', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: viewMode === 'month' ? textMain : textSub,
              fontWeight: 600, fontSize: 22,
              position: 'relative', zIndex: 1,
            }}
          >{t.monthView}</button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              flex: 1, height: '100%', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: viewMode === 'week' ? textMain : textSub,
              fontWeight: 600, fontSize: 22,
              position: 'relative', zIndex: 1,
            }}
          >{t.weekView}</button>
        </div>

        {/* 날짜 네비게이션 (토글 바 아래 한 줄) */}
        {(() => {
          const weekEnd = addDays(currentWeekStart, 6);
          const weekLabel =
            language === 'ja'
              ? `${format(currentWeekStart, 'M月d日')} - ${format(weekEnd, 'M月d日')}`
              : language === 'ko'
              ? `${format(currentWeekStart, 'M월 d일')} - ${format(weekEnd, 'M월 d일')}`
              : `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

          const monthLabel =
            language === 'ja'
              ? format(currentMonth, 'yyyy年 M月')
              : language === 'ko'
              ? format(currentMonth, 'yyyy년 M월')
              : format(currentMonth, 'MMMM yyyy');

          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 30 }}>
              <button
                onClick={() => viewMode === 'month'
                  ? setCurrentMonth(prev => subMonths(prev, 1))
                  : setCurrentWeekStart(prev => addDays(prev, -7))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMain }}
              >
                <ChevronLeft size={22} />
              </button>
              <span style={{ fontWeight: 800, fontSize: 25, color: textMain, width: 260, textAlign: 'center', display: 'inline-block' }}>
                {viewMode === 'month' ? monthLabel : weekLabel}
              </span>
              <button
                onClick={() => viewMode === 'month'
                  ? setCurrentMonth(prev => addMonths(prev, 1))
                  : setCurrentWeekStart(prev => addDays(prev, 7))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMain }}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          );
        })()}

        {/* 범례 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { color: '#18A022', label: t.legendConfirmed },
            { color: '#FFE75D', label: t.legendPending },
            { color: '#A20000', label: t.legendCancelledSub },
            { color: '#FFA6A6', label: t.legendHoliday },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: textSub }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>

        {/* 월간 뷰 */}
        {viewMode === 'month' && (
          <>
            {/* 달력 */}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', padding: 18, marginBottom: 20, overflowX: 'auto' }}>
              <div style={{ minWidth: 760 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', padding: '0 4px 10px', color: textSub, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
                  {t.dayLabels.map((label, index) => (
                    <div key={label} style={{ color: index === 0 || index === 6 ? '#c42a2a' : textSub }}>
                      {label}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
                  {calendarDates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayShifts = shifts.filter((shift) => getWorkDate(shift) === dateStr);
                    const holidayName = getHolidayName(dateStr);
                    const isHoliday = !!holidayName;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isToday = isSameDay(date, new Date());
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        style={{
                          position: 'relative',
                          minHeight: 118,
                          border: `1px solid ${isSelected ? '#18A022' : 'rgba(0,162,0,0.16)'}`,
                          borderRadius: 14,
                          background: isSelected ? '#F8FFF0' : isDark ? '#1e1e1e' : 'rgba(255,255,255,0.76)',
                          boxShadow: isSelected ? 'inset 0 0 0 2px rgba(24,160,34,0.16)' : 'none',
                          padding: 10,
                          opacity: isCurrentMonth ? 1 : 0.42,
                          overflow: 'hidden',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          display: 'grid',
                          placeItems: 'center',
                          background: isToday ? '#80D180' : 'transparent',
                          color: isHoliday || isWeekend ? '#D62828' : isDark ? '#fff' : '#263628',
                          fontSize: 16,
                          fontWeight: 800,
                        }}>
                          {date.getDate()}
                        </div>

                        {holidayName && (
                          <div style={{
                            position: 'absolute',
                            top: 13,
                            left: 46,
                            right: 10,
                            color: '#E58989',
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {holidayName}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                          {dayShifts.slice(0, 2).map((shift) => {
                            const hours = calcHours(shift.start_at, shift.end_at);
                            const isPending = shift.status === 'pending';
                            const isConfirmed = shift.status === 'confirmed';
                            return (
                              <div
                                key={shift.id}
                                style={{
                                  padding: '8px 9px',
                                  borderRadius: 10,
                                  background: isConfirmed
                                    ? 'rgba(24,160,34,0.09)'
                                    : isPending
                                    ? 'rgba(243,200,0,0.12)'
                                    : 'rgba(162,0,0,0.08)',
                                  borderLeft: `4px solid ${isConfirmed ? '#18A022' : isPending ? '#F3C800' : '#A20000'}`,
                                  color: isConfirmed ? textMain : isPending ? '#856B00' : '#A20000',
                                  fontSize: 13,
                                  lineHeight: 1.25,
                                  fontWeight: 800,
                                }}
                              >
                                {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                                <div style={{
                                  marginTop: 3,
                                  color: textSub,
                                  fontSize: 11,
                                  fontWeight: 650,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                  {storeName} · {hours}h
                                </div>
                              </div>
                            );
                          })}
                          {dayShifts.length > 2 && (
                            <div style={{ color: textSub, fontSize: 12, fontWeight: 800, paddingLeft: 4 }}>
                              +{dayShifts.length - 2}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 今月のシフト一覧 버튼 - SectionPill 스타일 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#07790F', borderRadius: 54.55,
                boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
                height: 36, minWidth: 168, padding: '0 20px',
                fontSize: 16, fontWeight: 600, color: '#fff',
              }}>
                {t.thisMonthSchedule}
              </div>
            </div>

            {/* 근무 목록 컨테이너 */}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', padding: 20, marginBottom: 20 }}>
              {(() => {
                const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
                const monthSubApps = getSubAppsForRange(monthStart, monthEnd)
                  .filter(a => a.application_status?.toUpperCase() !== 'APPROVED');
                const isEmpty = shifts.length === 0 && monthSubApps.length === 0;
                if (loading) return <p style={{ textAlign: 'center', padding: '32px 0', color: textSub, fontSize: 18 }}>{t.loading}</p>;
                if (isEmpty) return <p style={{ textAlign: 'center', padding: '32px 0', color: '#18A022', fontSize: 24, fontWeight: 800 }}>{t.noShifts}</p>;
                const allItems = [
                  ...shifts.map(s => ({ type: 'shift' as const, data: s, sortKey: getWorkDate(s) })),
                  ...monthSubApps.map(a => ({ type: 'sub' as const, data: a, sortKey: getSubAppDate(a) ?? '' })),
                ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {allItems.map((item) => {
                      if (item.type === 'shift') {
                        const shift = item.data as ShiftVO;
                        const dateStr = getWorkDate(shift);
                        const hours = calcHours(shift.start_at, shift.end_at);
                        return (
                          <div key={shift.id} style={{ background: shiftRowBg, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ textAlign: 'center', minWidth: 48 }}>
                                <p style={{ fontSize: 13, color: textSub }}>{getDayLabel(dateStr, t.dayLabels)}</p>
                                <p style={{ fontSize: 28, fontWeight: 800, color: textMain }}>{dateStr.split('-')[2]}</p>
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <Clock size={16} color={textMain} />
                                  <span style={{ fontWeight: 700, fontSize: 18, color: textMain }}>
                                    {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                                  </span>
                                  <span style={{ fontSize: 13, color: textSub }}>{hours}h</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSub, fontSize: 13 }}>
                                  <MapPin size={14} />
                                  <span>{storeName}</span>
                                </div>
                              </div>
                            </div>
                            <div>{getStatusBadge(shift.status)}</div>
                          </div>
                        );
                      }
                      const app = item.data as SubstituteCalendarVO;
                      const dateStr = getSubAppDate(app) ?? '';
                      const hours = (app.start_at && app.end_at) ? calcHours(app.start_at, app.end_at) : null;
                      return (
                        <div key={app.application_id} style={{ background: shiftRowBg, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0px 2px 6px rgba(0,0,0,0.06)', border: '1.5px dashed #C9A800' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ textAlign: 'center', minWidth: 48 }}>
                              <p style={{ fontSize: 13, color: textSub }}>{dateStr ? getDayLabel(dateStr, t.dayLabels) : ''}</p>
                              <p style={{ fontSize: 28, fontWeight: 800, color: textMain }}>{dateStr ? dateStr.split('-')[2] : '--'}</p>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Clock size={16} color={textMain} />
                                <span style={{ fontWeight: 700, fontSize: 18, color: textMain }}>
                                  {app.start_at ? `${formatTime(app.start_at)} - ${formatTime(app.end_at ?? '')}` : '--'}
                                </span>
                                {hours !== null && <span style={{ fontSize: 13, color: textSub }}>{hours}h</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C9A800', fontSize: 13 }}>
                                <span>{t.subApply}</span>
                              </div>
                            </div>
                          </div>
                          <div>{getSubAppBadge(app.application_status)}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* 주간 뷰 */}
        {viewMode === 'week' && (
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', padding: 20, marginBottom: 20 }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: textSub, fontSize: 18 }}>{t.loading}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {weekDates.flatMap((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayShifts = shifts.filter(s => getWorkDate(s) === dateStr);
                  const isHoliday = !!getHolidayName(dateStr);
                  const isSunday = date.getDay() === 0;
                  const dayColor = isHoliday || isSunday ? '#A20000' : textMain;

                  const daySubApps = subApplications.filter(a =>
                    getSubAppDate(a) === dateStr &&
                    a.application_status?.toUpperCase() !== 'APPROVED'
                  );

                  if (dayShifts.length === 0 && daySubApps.length === 0) return [];

                  return [
                    ...dayShifts.map((shift) => {
                      const hours = calcHours(shift.start_at, shift.end_at);
                      return (
                        <div key={shift.id} style={{ background: shiftRowBg, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ textAlign: 'center', minWidth: 48 }}>
                              <p style={{ fontSize: 13, color: dayColor === '#A20000' ? dayColor : textSub }}>{t.dayLabels[date.getDay()]}</p>
                              <p style={{ fontSize: 28, fontWeight: 800, color: dayColor }}>{String(date.getDate()).padStart(2, '0')}</p>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Clock size={16} color={textMain} />
                                <span style={{ fontWeight: 700, fontSize: 18, color: textMain }}>
                                  {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                                </span>
                                <span style={{ fontSize: 13, color: textSub }}>{hours}h</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSub, fontSize: 13 }}>
                                <MapPin size={14} />
                                <span>{storeName}</span>
                              </div>
                            </div>
                          </div>
                          <div>{getStatusBadge(shift.status)}</div>
                        </div>
                      );
                    }),
                    ...daySubApps.map((app) => {
                      const hours = (app.start_at && app.end_at) ? calcHours(app.start_at, app.end_at) : null;
                      return (
                        <div key={app.application_id} style={{ background: shiftRowBg, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0px 2px 6px rgba(0,0,0,0.06)', border: '1.5px dashed #C9A800' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ textAlign: 'center', minWidth: 48 }}>
                              <p style={{ fontSize: 13, color: dayColor === '#A20000' ? dayColor : textSub }}>{t.dayLabels[date.getDay()]}</p>
                              <p style={{ fontSize: 28, fontWeight: 800, color: dayColor }}>{String(date.getDate()).padStart(2, '0')}</p>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Clock size={16} color={textMain} />
                                <span style={{ fontWeight: 700, fontSize: 18, color: textMain }}>
                                  {app.start_at ? `${formatTime(app.start_at)} - ${formatTime(app.end_at ?? '')}` : '--'}
                                </span>
                                {hours !== null && <span style={{ fontSize: 13, color: textSub }}>{hours}h</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C9A800', fontSize: 13 }}>
                                <span>{t.subApply}</span>
                              </div>
                            </div>
                          </div>
                          <div>{getSubAppBadge(app.application_status)}</div>
                        </div>
                      );
                    }),
                  ];
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <EmployeeBottomNav />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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

const API = axios.create({ baseURL: "http://localhost:8080/api" });

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

export default function MonthlySchedule() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.monthlySchedule[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const DAY_LABELS = t.dayLabels;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (branchId) fetchShifts();
  }, [currentMonth, branchId]);

  const fetchShifts = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    try {
      const res = await API.get("/shift", {
        params: { store_id: branchId, start_date: start, end_date: end },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무 조회 실패:", err);
    } finally {
      setLoading(false);
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

  const calendarDates = getCalendarDates();
  const today = new Date();

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg = isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const cellBorder = isDark ? '#3a3a3c' : '#d4edda';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.title}</h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </p>
            </div>
          </div>
        </div>
      </AdminHeader>

      {/* 달력 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 40px' }}>
        {/* 범례 + 월 이동 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentMonth(new Date())} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '6px 16px', fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.today}</button>
            <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* 뷰 전환 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 15, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(`/admin/schedule/weekly/${branchId}`)}>
            {t.weeklyView}
          </button>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 15, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => navigate(`/admin/schedule/daily/${branchId}/${format(new Date(), 'yyyy-MM-dd')}`)}>
            <Calendar size={16} />{t.dailyView}
          </button>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', overflow: 'hidden' }}>
          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: LIGHT_GREEN }}>
            {DAY_LABELS.map((day, i) => (
              <div key={day} style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: 700, color: i === 5 ? '#2563eb' : i === 6 ? '#ef4444' : DARK_GREEN }}>
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
                    onClick={() => isCurrentMonth && navigate(`/admin/schedule/daily/${branchId}/${dateStr}`)}
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

        {/* 하단 버튼 */}
        <div style={{ marginTop: 24 }}>
          <button
            style={{ width: '100%', padding: '14px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate(`/admin/substitute/${branchId}`)}
          >
            {t.substituteManagement}
          </button>
        </div>
      </div>
    </div>
  );
}

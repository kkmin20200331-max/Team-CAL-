import axiosInstance from "../../../lib/axiosInstance";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import EmployeeProfilePanel from './EmployeeProfilePanel';
import EmployeeBottomNav from './EmployeeBottomNav';
import { useTheme } from 'next-themes';
import {
  HomeNavIcon, CalendarNavIcon, QrNavIcon, PayrollNavIcon, BoardNavIcon,
  QrCardIcon, CalendarCardIcon, LeaveCardIcon, SubCardIcon, PayrollCardIcon, BoardCardIcon,
} from './figma/FigmaIcons';
import { Clock, MapPin } from 'lucide-react';


const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const LIGHT_GREEN = '#80D180';
const BORDER_GREEN = '#00A200';

const logoMap: Record<string, string> = {
  ko: '/logo_ko_long.png',
  en: '/logo_en_long.png',
  ja: '/logo_ja_long.png',
};
const fontMap: Record<string, string> = {
  ko: "'Noto Sans KR', sans-serif",
  en: "'Leferi', 'Noto Sans KR', sans-serif",
  ja: "'Noto Sans JP', sans-serif",
};

// ── card styles ──────────────────────────────────────────────────────────────
const cardWhite: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  border: `1px solid ${BORDER_GREEN}`,
  boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
  borderRadius: 26,
};
const cardGreen: React.CSSProperties = {
  background: GREEN,
  boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
  borderRadius: 26,
};
const cardLight: React.CSSProperties = {
  background: '#F7FBF0',
  border: `1px solid ${BORDER_GREEN}`,
  boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
  borderRadius: 26,
};

// ── helpers ───────────────────────────────────────────────────────────────────
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getDatePart = (s: string) => {
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes(' ')) return s.split(' ')[0];
  return s;
};

const formatTime = (s: string) => {
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[1].substring(0, 5);
  if (s.includes(' ')) return s.split(' ')[1].substring(0, 5);
  return s.substring(0, 5);
};

const calcHours = (start: string, end: string) => {
  const [sh, sm] = formatTime(start).split(":").map(Number);
  const [eh, em] = formatTime(end).split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
};

interface ShiftVO {
  id: string; store_id: string; user_id: string;
  work_date: string; start_at: string; end_at: string; status: string;
}
interface UserInfo {
  id: string; username: string; name: string; role: string; phone: string; status: string;
}

// ── sub-components ────────────────────────────────────────────────────────────
function SectionPill({ label }: { label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: DARK_GREEN, borderRadius: 54.55,
      boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
      height: 36, minWidth: 168, padding: '0 20px',
      fontSize: 16, fontWeight: 600, color: '#fff',
      flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

function QuickCard({
  style, onClick, icon, label,
}: {
  style: React.CSSProperties;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const textColor = style.background === GREEN ? '#fff' : style.background === '#F7FBF0' ? BORDER_GREEN : GREEN;
  return (
    <div
      style={{ ...style, flex: 1, height: 122, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'opacity 0.15s' }}
      onClick={onClick}
      onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseOut={e => (e.currentTarget.style.opacity = '1')}
    >
      {icon}
      <span style={{ fontSize: 16, fontWeight: 700, color: textColor, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function EmployeeHome() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeeHome[language];
  const font = fontMap[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 다크모드 색상 팔레트 (Login.tsx 기준)
  const pageBg    = isDark ? '#1c1c1e' : '#fff';
  const cardBg    = isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)';
  const cardBorder= isDark ? '#3a3a3c' : BORDER_GREEN;
  const textMain  = isDark ? '#fff'    : GREEN;
  const textSub   = isDark ? '#aaa'    : 'rgba(24,160,34,0.7)';
  const mainGrad  = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [storeName, setStoreName] = useState('');
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) { navigate('/auth/login'); return; }
    const user: UserInfo = JSON.parse(userStr);
    setCurrentUser(user);

    axiosInstance.get('/store/my', { params: { user_id: user.id } })
      .then(res => {
        if (res.data?.name) { setStoreName(res.data.name); sessionStorage.setItem('store_name', res.data.name); }
        if (res.data?.id) sessionStorage.setItem('store_id', res.data.id);
      }).catch(() => {});

    const today = new Date();
    const dow = today.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diffToMon);
    weekStart.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    axiosInstance.get('/shift/staff', {
      params: { user_id: user.id, start_date: toDateStr(weekStart), end_date: toDateStr(twoWeeksLater) },
    })
      .then(res => setShifts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── computed ────────────────────────────────────────────────────────────────
  const todayStr = toDateStr(new Date());
  const todayShift = shifts.find(s => getDatePart(s.work_date) === todayStr);
  const upcomingShifts = shifts
    .filter(s => getDatePart(s.work_date) > todayStr && s.status !== 'cancelled')
    .slice(0, 5);
  const pendingCount = shifts.filter(s => s.status === 'pending').length;

  const now = new Date();
  const dow2 = now.getDay();
  const diff2 = dow2 === 0 ? -6 : 1 - dow2;
  const ws = new Date(now); ws.setDate(now.getDate() + diff2); ws.setHours(0, 0, 0, 0);
  const we = new Date(ws); we.setDate(ws.getDate() + 6);
  const thisWeekShifts = shifts.filter(s => {
    const d = getDatePart(s.work_date);
    return d >= toDateStr(ws) && d <= toDateStr(we);
  });
  const totalHours = Math.round(
    thisWeekShifts.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + calcHours(s.start_at, s.end_at), 0)
  );
  const completedShifts = thisWeekShifts.filter(
    (s) => getDatePart(s.work_date) < todayStr && s.status !== "cancelled",
  ).length;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t.statusConfirmed;
      case 'pending': return t.statusPending;
      case 'cancelled': return t.statusCancelled;
      default: return status;
    }
  };

  const getDayOfWeek = (dateStr: string) => {
    const parts = getDatePart(dateStr).split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return t.days[d.getDay()];
  };

  const todayLabel = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}, ${t.days[d.getDay()]}`;
  })();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#1c1c1e' : '#F2F5EB', fontFamily: font }}>
        <p style={{ color: isDark ? '#4cd964' : DARK_GREEN, fontSize: 18 }}>{t.loading}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: font }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        height: 120, background: isDark ? '#2c2c2e' : '#fff', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.06)' : '0 1px 0 rgba(0,162,0,0.12)',
      }}>
        {/* Logo */}
        <img src={logoMap[language]} alt="logo" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />

        {/* Store name pill + User info + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {storeName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              height: 48, flexShrink: 0, padding: '0 24px', width: 320,
              background: `linear-gradient(to right, ${LIGHT_GREEN} 0%, ${LIGHT_GREEN} 10%, ${GREEN} 30%, ${DARK_GREEN} 100%)`,
              borderRadius: 999,
            }}>
              <svg width="25" height="26" viewBox="1004 49 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M1007.23 49.4509H1030.31L1033.35 57.7411V60.3872C1033.35 61.6049 1032.89 62.7307 1032.14 63.5736V77.3991H1005.4V63.5736C1004.64 62.7307 1004.19 61.6049 1004.19 60.3872V57.7411L1007.23 49.4509ZM1028.79 65.0742C1029.11 65.0742 1029.41 65.0421 1029.7 64.9812V74.9688H1023.63V67.678H1013.91V74.9688H1007.83V64.9812C1008.13 65.0421 1008.43 65.0742 1008.74 65.0742C1010.08 65.0742 1011.26 64.4917 1012.09 63.5736C1012.91 64.4917 1014.09 65.0742 1015.43 65.0742C1016.76 65.0742 1017.94 64.4917 1018.77 63.5736C1019.59 64.4917 1020.78 65.0742 1022.11 65.0742C1023.44 65.0742 1024.63 64.4917 1025.45 63.5736C1026.28 64.4917 1027.46 65.0742 1028.79 65.0742ZM1016.34 74.9688H1021.2V70.1082H1016.34V74.9688ZM1030.92 59.172V60.3872C1030.92 61.6776 1029.92 62.6439 1028.79 62.6439C1027.66 62.6439 1026.67 61.6776 1026.67 60.3872V59.172H1030.92ZM1030.4 56.7417L1028.61 51.8812H1008.92L1007.14 56.7417H1030.4ZM1006.62 59.172V60.3872C1006.62 61.6776 1007.61 62.6439 1008.74 62.6439C1009.87 62.6439 1010.87 61.6776 1010.87 60.3872V59.172H1006.62ZM1013.3 59.172V60.3872C1013.3 61.6776 1014.3 62.6439 1015.43 62.6439C1016.56 62.6439 1017.55 61.6776 1017.55 60.3872V59.172H1013.3ZM1019.98 59.172V60.3872C1019.98 61.6776 1020.98 62.6439 1022.11 62.6439C1023.24 62.6439 1024.24 61.6776 1024.24 60.3872V59.172H1019.98Z" fill="white"/>
              </svg>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{storeName}</span>
            </div>
          )}

          <div style={{ textAlign: 'right', marginRight: -20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#4cd964' : DARK_GREEN }}>{currentUser?.name ?? ''}</div>
            <div style={{ fontSize: 14, fontWeight: 300, color: isDark ? '#4cd964' : DARK_GREEN }}>{currentUser?.role ?? ''}</div>
          </div>

          <div style={{ position: 'relative' }}>
            <EmployeeProfilePanel />
            {pendingCount > 0 && (
              <div style={{
                position: 'absolute', top: -2, right: -2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#A20000', border: `1px solid ${DARK_GREEN}`,
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>
      </header>

      {/* ── GRADIENT CONTENT ─────────────────────────────────────────────── */}
      <main style={{
        background: mainGrad,
        padding: '18px 40px 130px',
        minHeight: 'calc(100vh - 88px - 114px)',
      }}>

        {/* ── STAT BOXES ROW ── */}
        <div style={{ display: 'flex', gap: 24, marginTop: 25, marginBottom: 40 }}>
          {[
            { label: t.thisWeekWork, value: t.hours(totalHours) },
            { label: t.scheduledWork, value: t.count(upcomingShifts.length) },
            { label: t.completedTotal, value: `${completedShifts}/${thisWeekShifts.length}` },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, height: 130,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '12px 30px',
            }}>
              <div style={{ fontSize: 16, fontWeight: 400, color: textSub }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: textMain, textAlign: 'right' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── 本日の勤務 SECTION ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <SectionPill label={t.todayWork} />
            {todayShift && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, color: DARK_GREEN }}>
                <CalendarCardIcon size={16} color={DARK_GREEN} />
                {todayLabel}
              </div>
            )}
            {todayShift && (
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(245,253,232,0.5)', border: `1px solid ${BORDER_GREEN}`,
                borderRadius: 54, padding: '3px 25px',
                fontSize: 15, fontWeight: 500, color: GREEN,
                boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
              }}>
                {getStatusLabel(todayShift.status)}
              </div>
            )}
          </div>

          {todayShift ? (
            <div style={{ textAlign: 'center', fontSize: 60, fontWeight: 900, color: isDark ? '#4cd964' : DARK_GREEN, letterSpacing: 2 }}>
              {formatTime(todayShift.start_at)} - {formatTime(todayShift.end_at)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: isDark ? '#4cd964' : GREEN, padding: '8px 0' }}>
              {t.noWorkToday}
            </div>
          )}
        </div>

        {/* ── QR BANNER ── */}
        <div
          style={{
            background: LIGHT_GREEN, borderRadius: 14, height: 63,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            marginTop: 80, marginBottom: 40, cursor: 'pointer',
            boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
          }}
          onClick={() => navigate('/employee/checkin')}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          <QrNavIcon size={22} color="#fff" />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{t.qrCheckInLabel}</span>
        </div>

        {/* ── クイックメニュー SECTION ── */}
        <div>
          <div style={{ marginBottom: 22 }}>
            <SectionPill label={t.quickMenu} />
          </div>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <QuickCard style={cardGreen} onClick={() => navigate('/employee/checkin')}
              icon={<QrCardIcon size={38} />} label={t.qrCheckInLabel} />
            <QuickCard style={cardLight} onClick={() => navigate('/employee/schedule')}
              icon={<CalendarCardIcon size={38} />} label={t.mySchedule} />
            <QuickCard style={cardGreen} onClick={() => navigate('/employee/leave')}
              icon={<LeaveCardIcon size={38} />} label={t.leaveRequest} />
          </div>
          {/* Row 2 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <QuickCard style={{ background: isDark ? '#fff' : 'rgba(255,255,255,0.5)', border: `1px solid ${BORDER_GREEN}`, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', borderRadius: 26 }} onClick={() => navigate('/employee/substitute')}
              icon={<SubCardIcon size={38} />} label={t.substituteFind} />
            <QuickCard style={cardGreen} onClick={() => navigate('/employee/payroll')}
              icon={<PayrollCardIcon size={38} />} label={t.payrollCheck} />
            <QuickCard style={cardLight} onClick={() => navigate('/employee/board')}
              icon={<BoardCardIcon size={38} />} label={t.boardLabel} />
          </div>
        </div>

        {/* ── 今後のシフト SECTION ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17, marginTop: 30 }}>
            <SectionPill label={t.upcomingWork} />
            <button
              onClick={() => navigate('/employee/schedule')}
              style={{
                background: 'rgba(245,253,232,0.5)', border: `1px solid ${BORDER_GREEN}`,
                borderRadius: 54, padding: '3px 25px', color: GREEN, fontFamily: font,
                fontSize: 15, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '3px 4px 12.6px rgba(255,255,255,0.25)',
              }}
            >
              {t.viewAll} →
            </button>
          </div>

          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '28px 40px', minHeight: 140 }}>
            {upcomingShifts.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: textMain, padding: '20px 0' }}>
                {t.noUpcoming}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingShifts.map((shift, i) => {
                  const datePart = getDatePart(shift.work_date);
                  const dateNum = datePart.split('-')[2];
                  const hours = Math.round(calcHours(shift.start_at, shift.end_at) * 10) / 10;
                  const statusColor = shift.status === 'confirmed' ? GREEN : shift.status === 'cancelled' ? '#dc2626' : '#d97706';
                  const statusBg = shift.status === 'confirmed' ? 'rgba(24,160,34,0.12)' : shift.status === 'cancelled' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)';
                  const shiftRowBg = isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)';
                  const shiftRowBorder = isDark ? '#4a4a4c' : 'rgba(0,162,0,0.12)';
                  const timeColor = isDark ? '#4cd964' : DARK_GREEN;
                  const metaColor = isDark ? '#aaa' : '#8BA68D';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: 16,
                      background: shiftRowBg,
                      border: `1px solid ${shiftRowBorder}`,
                      boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'center', minWidth: 48 }}>
                          <div style={{ fontSize: 13, color: metaColor }}>{getDayOfWeek(shift.work_date)}</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: timeColor }}>{dateNum}</div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Clock size={16} color={timeColor} />
                            <span style={{ fontSize: 18, fontWeight: 700, color: timeColor }}>
                              {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                            </span>
                            <span style={{ fontSize: 13, color: metaColor }}>{hours}h</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: metaColor, fontSize: 13 }}>
                            <MapPin size={14} />
                            <span>{storeName}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                        background: statusBg, color: statusColor, whiteSpace: 'nowrap',
                      }}>
                        {getStatusLabel(shift.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}

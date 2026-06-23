import axiosInstance from "../../../lib/axiosInstance";
import { useState, useEffect, useMemo } from 'react';
import EmployeeHeader from './EmployeeHeader';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';
import {
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  History,
  QrCode
} from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';


interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getTimePart = (s: string) => {
  if (!s) return "";
  const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
  return t ? t.substring(0, 5) : "";
};

const getDatePart = (s: string) =>
  !s ? "" : s.includes("T") ? s.split("T")[0] : s.split(" ")[0];

const calcHours = (start: string, end: string) => {
  const getMin = (s: string) => {
    const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  return Math.max(0, (getMin(end) - getMin(start)) / 60);
};

const DAY_NAMES: Record<string, string[]> = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
};

const getDayName = (d: string, lang: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return (DAY_NAMES[lang] ?? DAY_NAMES.ko)[new Date(y, m - 1, dd).getDay()];
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  border: '1px solid #00A200',
  borderRadius: 26,
  boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
  marginBottom: 16,
  overflow: 'hidden',
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#07790F',
  borderRadius: 54.55,
  height: 36,
  padding: '0 20px',
  fontSize: 16,
  fontWeight: 600,
  color: '#fff',
};

const mainBtnStyle: React.CSSProperties = {
  width: '100%',
  background: '#07790F',
  color: '#fff',
  borderRadius: 54,
  padding: '14px 40px',
  fontSize: 18,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const outlineBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  color: '#07790F',
  border: '1px solid #07790F',
  borderRadius: 54,
  padding: '14px 40px',
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export default function QRCheckIn() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.qrCheckIn[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const storeName = sessionStorage.getItem('store_name') || t.store;

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const dynCardStyle: React.CSSProperties = {
    background: isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isDark ? '#3a3a3c' : '#00A200'}`,
    borderRadius: 26,
    boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
    marginBottom: 16,
    overflow: 'hidden',
  };
  const textMain = isDark ? '#fff' : '#111';
  const textSub  = isDark ? '#aaa' : '#555';

  const [isScanning, setIsScanning] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<
    "idle" | "success" | "error" | "loading"
  >("idle");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [recentShifts, setRecentShifts] = useState<ShiftVO[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  // 실시간 시계
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 오늘의 근무 조회
  useEffect(() => {
    if (!user.id) return;
    const today = toDateStr(new Date());
    axiosInstance.get("/shift/staff", {
      params: { user_id: user.id, start_date: today, end_date: today },
    })
      .then((res) => setTodayShifts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingToday(false));
  }, [user.id]);

  // 최근 14일 기록 조회
  useEffect(() => {
    if (!user.id) return;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    axiosInstance.get("/shift/staff", {
      params: {
        user_id: user.id,
        start_date: toDateStr(twoWeeksAgo),
        end_date: toDateStr(yesterday),
      },
    })
      .then((res) =>
        setRecentShifts(
          (Array.isArray(res.data) ? res.data : [])
            .filter(
              (s: ShiftVO) => s.status !== "VACANT" && s.status !== "CANCELLED",
            )
            .slice(0, 5),
        ),
      )
      .catch(() => {});
  }, [user.id]);

  // 오늘 유효한 근무 (VACANT, CANCELLED 제외)
  const todayShift =
    todayShifts.find(
      (s) => s.status !== "VACANT" && s.status !== "CANCELLED",
    ) ?? null;

  const getTimeStatus = () => {
    if (!todayShift) return null;
    const startTime = getTimePart(todayShift.start_at);
    if (!startTime) return null;

    const now = currentTime;
    const scheduled = new Date();
    const [hours, minutes] = startTime.split(":").map(Number);
    scheduled.setHours(hours, minutes, 0);

    const diffMinutes = Math.floor(
      (now.getTime() - scheduled.getTime()) / 60000,
    );

    if (diffMinutes < -10) return { status: 'early', text: t.earlyForWork, color: '#8BA68D' };
    if (diffMinutes <= 5) return { status: 'ontime', text: t.onTime, color: '#18A022' };
    if (diffMinutes <= 30) return { status: 'late', text: t.lateMin(diffMinutes), color: '#d97706' };
    return { status: 'verylate', text: t.lateMin(diffMinutes), color: '#dc2626' };
  };

  const timeStatus = getTimeStatus();

  const handleScan = () => {
    setIsScanning(true);
    setCheckInStatus("loading");
    setTimeout(() => {
      setCheckInStatus("success");
      setIsScanning(false);
    }, 2000);
  };

  const handleManualCheckIn = () => {
    setCheckInStatus("loading");
    setTimeout(() => setCheckInStatus("success"), 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      paddingBottom: 120,
    }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB', margin: 0 }}>{t.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Clock size={16} color="rgba(255,255,255,0.85)" />
            <span style={{ fontSize: 17, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {currentTime.toLocaleTimeString(language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '16px 40px 0' }}>

        {/* ── 오늘의 근무 ── */}
        <div style={dynCardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={pillStyle}>{t.todayWork}</span>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {loadingToday ? (
              <p style={{ fontSize: 16, color: '#8BA68D', textAlign: 'center', padding: '8px 0' }}>{t.loading}</p>
            ) : !todayShift ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8BA68D', padding: '8px 0' }}>
                <AlertCircle size={20} color="#8BA68D" />
                <span style={{ fontSize: 16 }}>{t.noSchedule}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Clock size={20} color="#07790F" />
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#07790F' }}>
                    {getTimePart(todayShift.start_at)} - {getTimePart(todayShift.end_at)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#8BA68D' }}>
                    {calcHours(todayShift.start_at, todayShift.end_at).toFixed(1)}h
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MapPin size={16} color="#8BA68D" />
                  <span style={{ fontSize: 15, fontWeight: 500, color: textMain }}>{storeName}</span>
                </div>

                {timeStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: timeStatus.color }}>
                    <AlertCircle size={18} color={timeStatus.color} />
                    <span style={{ fontSize: 15 }}>{timeStatus.text}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 체크인 상태 ── */}
        {checkInStatus === 'idle' && (
          <div style={dynCardStyle}>
            <div style={{ padding: 24 }}>
              {/* QR 스캔 영역 */}
              <div style={{
                aspectRatio: '1',
                background: isDark ? '#1a2e1a' : '#E6F5C8',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px dashed #00A200',
                marginBottom: 24,
              }}>
                {isScanning ? (
                  <div style={{ textAlign: 'center' }}>
                    <RefreshCw size={64} color="#07790F" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 16px' }} />
                    <p style={{ color: '#07790F', fontWeight: 500 }}>{t.scanQr}</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <QrCode size={96} color="#07790F" style={{ display: 'block', margin: '0 auto 16px' }} />
                    <p style={{ color: '#8BA68D', fontSize: 14 }}>{t.qrInstruction}</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button style={mainBtnStyle} onClick={handleScan} disabled={isScanning}>
                  <Camera size={20} />
                  {t.scanButton}
                </button>
                <button style={outlineBtnStyle} onClick={handleManualCheckIn} disabled={isScanning}>
                  {t.manualCheckIn}
                </button>
              </div>
            </div>
          </div>
        )}

        {checkInStatus === 'loading' && (
          <div style={{
            ...dynCardStyle,
            background: isDark ? '#1a2e1a' : '#E6F5C8',
            border: '1px solid #80D180',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <RefreshCw size={20} color="#07790F" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <p style={{ fontWeight: 600, color: '#07790F', margin: 0 }}>{t.processingCheckIn}</p>
          </div>
        )}

        {checkInStatus === 'success' && (
          <div style={{ ...dynCardStyle, background: 'rgba(230,245,200,0.6)', border: '2px solid #18A022' }}>
            <div style={{ padding: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  background: '#18A022',
                  borderRadius: '50%',
                  marginBottom: 16,
                }}>
                  <CheckCircle2 size={48} color="#fff" />
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#07790F', marginBottom: 8 }}>
                  {t.checkInSuccess}
                </h3>
                <p style={{ color: '#18A022', marginBottom: 20, fontSize: 16 }}>
                  {t.checkedInAt(currentTime.toLocaleTimeString(language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div style={{ background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 14, border: '1px solid rgba(0,162,0,0.12)' }}>
                    <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{t.scheduledTime}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#07790F', margin: 0 }}>
                      {todayShift ? getTimePart(todayShift.start_at) : '-'}
                    </p>
                  </div>
                  <div style={{ background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 14, border: '1px solid rgba(0,162,0,0.12)' }}>
                    <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{t.actualTime}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#18A022', margin: 0 }}>
                      {currentTime.toLocaleTimeString(language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button style={mainBtnStyle} onClick={() => navigate('/employee/home')}>
                    {t.goHome}
                  </button>
                  <button style={outlineBtnStyle} onClick={() => setCheckInStatus('idle')}>
                    {t.retryCheckIn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkInStatus === 'error' && (
          <div style={{
            ...dynCardStyle,
            background: 'rgba(254,242,242,0.8)',
            border: '1px solid #dc2626',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <XCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: '#dc2626', margin: '0 0 4px' }}>{t.checkInFailed}</p>
                <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 12px' }}>{t.qrNotRecognized}</p>
                <button
                  style={{ ...outlineBtnStyle, width: 'auto', padding: '8px 24px', fontSize: 14, borderColor: '#07790F', color: '#07790F' }}
                  onClick={() => setCheckInStatus('idle')}
                >
                  {t.retry}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 체크인 안내 ── */}
        <div style={dynCardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={pillStyle}>{t.howToCheckIn}</span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { n: 1, title: t.step1Title, desc: t.step1Desc },
              { n: 2, title: t.step2Title, desc: t.step2Desc },
              { n: 3, title: t.step3Title, desc: t.step3Desc },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: isDark ? '#1a2e1a' : '#E6F5C8',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <span style={{ color: '#07790F', fontWeight: 700, fontSize: 13 }}>{n}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 16, color: textMain, margin: '0 0 2px' }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 최근 근무 기록 ── */}
        <div style={dynCardStyle}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#07790F" />
            <span style={pillStyle}>{t.recentWorkHistory}</span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentShifts.length === 0 ? (
              <p style={{ fontSize: 16, color: '#8BA68D', textAlign: 'center', padding: '16px 0' }}>{t.noRecentHistory}</p>
            ) : (
              recentShifts.map((shift, index) => {
                const d = getDatePart(shift.work_date);
                const hours = calcHours(shift.start_at, shift.end_at);
                const startTime = getTimePart(shift.start_at);
                const endTime = getTimePart(shift.end_at);
                return (
                  <div key={index} style={{
                    background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'center', minWidth: 36 }}>
                        <p style={{ fontSize: 13, color: '#8BA68D', margin: '0 0 2px' }}>{getDayName(d, language)}</p>
                        <p style={{ fontSize: 28, fontWeight: 800, color: '#07790F', margin: 0 }}>{d.split('-')[2]}</p>
                      </div>
                      <div style={{ width: 1, height: 36, background: 'rgba(0,162,0,0.2)' }} />
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#07790F', margin: '0 0 3px' }}>
                          {startTime} - {endTime}
                        </p>
                        <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>
                          {d.slice(0, 7).replace('-', '.')} · {storeName}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      background: isDark ? '#1a2e1a' : '#E6F5C8',
                      color: '#07790F',
                      borderRadius: 20,
                      padding: '4px 14px',
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <EmployeeBottomNav />
    </div>
  );
}

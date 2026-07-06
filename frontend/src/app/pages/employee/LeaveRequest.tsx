import axiosInstance from "../../../lib/axiosInstance";
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  Send, Trash2, ChevronLeft, ChevronRight, MapPin
} from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import EmployeeHeader from './EmployeeHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getDatePart = (s: string) => {
  if (!s) return "";
  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  return s;
};

const formatTimePart = (s: string) => {
  if (!s) return "";
  if (s.includes("T")) return s.split("T")[1].substring(0, 5);
  if (s.includes(" ")) return s.split(" ")[1].substring(0, 5);
  return s.substring(0, 5);
};

const getDayLabel = (dateStr: string, days: string[]) => {
  const parts = getDatePart(dateStr).split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return days[d.getDay()];
};

const formatTimestamp = (val: any) => {
  if (!val) return "";
  return new Date(val).toLocaleDateString("ko-KR");
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

interface LeaveRequestVO {
  id: string;
  shift_id: string;
  user_id: string;
  reason: string;
  status: string;
  requested_at: any;
  processed_at: any;
}

export default function LeaveRequest() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const language = useLanguage();
  const t = translations.leaveRequest[language];
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const storeName = sessionStorage.getItem('store_name') || '';

  const [myShifts, setMyShifts] = useState<ShiftVO[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestVO[]>([]);
  const [historyMonth, setHistoryMonth] = useState(new Date());

  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';

  const cardStyle: React.CSSProperties = {
    background: isDark ? '#141414' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isDark ? '#2a2a2a' : BORDER_GREEN}`,
    borderRadius: 26,
    boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
    marginBottom: 16,
    overflow: 'hidden',
  };

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: DARK_GREEN, borderRadius: 54.55,
    height: 36, padding: '0 20px',
    fontSize: 16, fontWeight: 600, color: '#fff',
  };

  const txtMain = isDark ? '#fff' : '#111';
  const txtSub = isDark ? '#8ba68d' : '#8BA68D';
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,162,0,0.2)';
  const txtGreen = isDark ? '#4cd964' : DARK_GREEN;

  useEffect(() => {
    if (!user.id) return;
    const today = new Date();
    const later = new Date(today);
    later.setMonth(today.getMonth() + 2);
    axiosInstance.get("/shift/staff", {
      params: { user_id: user.id, start_date: toDateStr(today), end_date: toDateStr(later) },
    })
      .then((res) => setMyShifts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("근무 조회 실패:", err))
      .finally(() => setLoadingShifts(false));
  }, []);

  useEffect(() => {
    if (!user.id) return;
    fetchHistory();
  }, [historyMonth]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get("/leave_request/staff", {
        params: { user_id: user.id, year: historyMonth.getFullYear(), month: historyMonth.getMonth() + 1 },
      });
      setLeaveHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("내역 조회 실패:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const pendingShiftIds = useMemo(
    () => leaveHistory.filter((lr) => lr.status === "PENDING").map((lr) => lr.shift_id),
    [leaveHistory],
  );

  const availableShifts = useMemo(
    () => myShifts.filter((s) => s.status !== "VACANT" && s.status !== "cancelled" && !pendingShiftIds.includes(s.id)),
    [myShifts, pendingShiftIds],
  );

  const shiftMap = useMemo(() => {
    const m: Record<string, ShiftVO> = {};
    myShifts.forEach((s) => { m[s.id] = s; });
    return m;
  }, [myShifts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) { setErrorMsg(t.errSelectShift); setSubmitStatus('error'); return; }
    if (!reason.trim()) { setErrorMsg(t.errReason); setSubmitStatus('error'); return; }
    setSubmitStatus("loading");
    try {
      await axiosInstance.post("/leave_request", {
        id: crypto.randomUUID(),
        shift_id: selectedShiftId,
        user_id: user.id,
        reason: reason.trim(),
      });
      setSubmitStatus("success");
      setSelectedShiftId("");
      setReason("");
      fetchHistory();
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch {
      setErrorMsg(t.errSubmit);
      setSubmitStatus('error');
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm(t.confirmCancel)) return;
    try {
      await axiosInstance.delete("/leave_request", { params: { id: leaveId } });
      fetchHistory();
    } catch {
      alert(t.errCancel);
    }
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'APPROVED': return { background: isDark ? 'rgba(24,160,34,0.2)' : '#d1fae5', color: isDark ? '#4cd964' : '#065f46', border: `1px solid ${isDark ? 'rgba(24,160,34,0.4)' : '#6ee7b7'}` };
      case 'PENDING':  return { background: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', color: isDark ? '#fbbf24' : '#92400e', border: `1px solid ${isDark ? 'rgba(245,158,11,0.4)' : '#fcd34d'}` };
      case 'REJECTED': return { background: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2', color: isDark ? '#f87171' : '#991b1b', border: `1px solid ${isDark ? 'rgba(239,68,68,0.4)' : '#fca5a5'}` };
      default:         return { background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.8)', color: txtSub, border: `1px solid ${divider}` };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return t.statusApproved;
      case 'PENDING':  return t.statusPending;
      case 'REJECTED': return t.statusRejected;
      case 'CANCELLED': return t.statusCancelled;
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 size={13} />;
      case 'PENDING':  return <Clock size={13} />;
      case 'REJECTED': return <XCircle size={13} />;
      case 'CANCELLED': return <XCircle size={13} />;
      default: return null;
    }
  };

  const canSubmit = submitStatus !== 'loading' && !!selectedShiftId && !!reason.trim();

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 120 }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB', margin: 0 }}>{t.title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '16px 40px 0' }}>

        {/* ── 휴무 신청 폼 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={pillStyle}><FileText size={15} />{t.formTitle}</span>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <form onSubmit={handleSubmit}>

              {/* 근무 선택 */}
              <p style={{ fontSize: 14, fontWeight: 600, color: txtSub, marginBottom: 10 }}>{t.selectShift}</p>
              {loadingShifts ? (
                <p style={{ fontSize: 15, color: txtSub, padding: '12px 0' }}>{t.loadingShifts}</p>
              ) : availableShifts.length === 0 ? (
                <div style={{ border: `1.5px dashed ${isDark ? '#2a2a2a' : BORDER_GREEN}`, borderRadius: 16, padding: '20px 0', textAlign: 'center', color: txtSub, fontSize: 14 }}>
                  {t.noAvailableShift}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                  {availableShifts.map((shift) => {
                    const datePart = getDatePart(shift.work_date);
                    const isSelected = selectedShiftId === shift.id;
                    return (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => setSelectedShiftId(isSelected ? "" : shift.id)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '14px 16px',
                          border: `2px solid ${isSelected ? DARK_GREEN : (isDark ? '#2a2a2a' : 'rgba(0,162,0,0.2)')}`,
                          borderRadius: 16, cursor: 'pointer',
                          background: isSelected ? (isDark ? 'rgba(7,121,15,0.15)' : 'rgba(7,121,15,0.06)') : (isDark ? '#1e1e1e' : 'rgba(255,255,255,0.8)'),
                          transition: 'border-color 0.15s, background 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ textAlign: 'center', minWidth: 36 }}>
                            <p style={{ fontSize: 12, color: txtSub, margin: 0 }}>{getDayLabel(shift.work_date, ['일','월','화','수','목','금','토'])}</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: txtGreen, margin: 0 }}>{Number(datePart.split('-')[2])}</p>
                          </div>
                          <div style={{ width: 1, height: 32, background: divider }} />
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: txtGreen, margin: '0 0 2px' }}>
                              {format(new Date(datePart), "M월 d일", { locale: ko })}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: txtSub, fontSize: 13 }}>
                              <Clock size={12} />
                              {formatTimePart(shift.start_at)} - {formatTimePart(shift.end_at)}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={20} color={DARK_GREEN} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 사유 */}
              <p style={{ fontSize: 14, fontWeight: 600, color: txtSub, marginBottom: 8, marginTop: 4 }}>{t.reason}</p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 15,
                  border: `1.5px solid ${isDark ? '#2a2a2a' : 'rgba(0,162,0,0.25)'}`,
                  borderRadius: 14, resize: 'none', outline: 'none',
                  background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.9)',
                  color: txtMain, marginBottom: 16,
                  boxSizing: 'border-box',
                }}
              />

              {/* 상태 알림 */}
              {submitStatus === "success" && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: isDark ? 'rgba(24,160,34,0.15)' : '#d1fae5', border: '1px solid #6ee7b7', color: isDark ? '#4cd964' : '#065f46', fontSize: 14, marginBottom: 14 }}>
                  <CheckCircle2 size={16} />{t.successMsg}
                </div>
              )}
              {submitStatus === "error" && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2', border: '1px solid #fca5a5', color: isDark ? '#f87171' : '#991b1b', fontSize: 14, marginBottom: 14 }}>
                  <XCircle size={16} />{errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 54, border: 'none',
                  background: canSubmit ? DARK_GREEN : (isDark ? '#2a2a2a' : '#ccc'),
                  color: canSubmit ? '#fff' : (isDark ? '#555' : '#999'),
                  fontSize: 17, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                <Send size={18} />
                {submitStatus === 'loading' ? t.submitting : t.submitBtn}
              </button>
            </form>
          </div>
        </div>

        {/* ── 신청 내역 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={pillStyle}>{t.historyTitle}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setHistoryMonth(prev => subMonths(prev, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtGreen, display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: txtGreen, minWidth: 64, textAlign: 'center' }}>
                {format(historyMonth, "yyyy.MM")}
              </span>
              <button onClick={() => setHistoryMonth(prev => addMonths(prev, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtGreen, display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingHistory ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: txtSub, fontSize: 15 }}>{t.loadingHistory}</p>
            ) : leaveHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: txtSub, fontSize: 15 }}>{t.noHistory}</p>
            ) : (
              leaveHistory.map((leave) => {
                const shift = shiftMap[leave.shift_id];
                const datePart = shift ? getDatePart(shift.work_date) : "";
                const stStyle = getStatusStyle(leave.status);
                return (
                  <div key={leave.id} style={{ borderRadius: 16, padding: '14px 16px', ...stStyle }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700, color: stStyle.color, marginBottom: 6 }}>
                          {getStatusIcon(leave.status)}{getStatusLabel(leave.status)}
                        </div>
                        {shift ? (
                          <div>
                            <p style={{ fontSize: 17, fontWeight: 700, color: stStyle.color, margin: '0 0 3px' }}>
                              {format(new Date(datePart), "M월 d일 (eee)", { locale: ko })}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: stStyle.color, opacity: 0.8, marginBottom: 2 }}>
                              <Clock size={12} />{formatTimePart(shift.start_at)} - {formatTimePart(shift.end_at)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: stStyle.color, opacity: 0.7 }}>
                              <MapPin size={12} />{storeName}
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: stStyle.color, opacity: 0.7 }}>{t.noShiftInfo}</p>
                        )}
                      </div>
                      {leave.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(leave.id)}
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '6px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 10 }}>
                      <p style={{ fontSize: 11, color: stStyle.color, opacity: 0.7, margin: '0 0 3px' }}>{t.reasonLabel}</p>
                      <p style={{ fontSize: 14, color: stStyle.color, margin: '0 0 4px' }}>{leave.reason}</p>
                      <p style={{ fontSize: 11, color: stStyle.color, opacity: 0.6, margin: 0 }}>{t.requestedAt(formatTimestamp(leave.requested_at))}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 안내 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={{ ...pillStyle, background: isDark ? '#1a2e1a' : 'rgba(7,121,15,0.08)', color: txtGreen, border: `1px solid ${isDark ? '#2a2a2a' : 'rgba(0,162,0,0.25)'}` }}>
              <AlertCircle size={14} />{t.guideTitle}
            </span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[t.guide1, t.guide2, t.guide3].map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: txtSub }}>
                <span style={{ color: txtGreen, fontWeight: 700, flexShrink: 0 }}>•</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <EmployeeBottomNav />
    </div>
  );
}

import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar, Clock, User,
  AlertCircle, CheckCircle, XCircle,
  Plus, Phone, Trash2, X,
  UserPlus, Users, Wallet, FileText, MessageSquare, BarChart3, Video, ChevronRight
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';
import { useLocation } from 'react-router-dom';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';


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
  phone: string;
  username: string;
}

const DailySchedule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId, date } = useParams<{ branchId: string; date: string }>();
  const language = useLanguage();
  const t = translations.dailySchedule[language];
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
    { icon: Calendar, label: '근무표 관리', path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: '대타 모집', path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: '직원 관리', path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: '급여 관리', path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: '문서 관리', path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: '게시판', path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: 'AI 고객 분석', path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: 'CCTV 분석', path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split("T")[0],
  );
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeHours, setStoreHours] = useState({ open: '09:00', close: '22:00' });

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingShift, setEditingShift] = useState<ShiftVO | null>(null);
  const [form, setForm] = useState({
    user_id: "",
    start_time: "09:00",
    end_time: "18:00",
    status: "confirmed",
  });

  useEffect(() => {
    if (selectedBranchId) {
      fetchShifts();
      fetchEmployees();
    }
  }, [selectedDate, selectedBranchId]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/shift", {
        params: {
          store_id: selectedBranchId,
          start_date: selectedDate,
          end_date: selectedDate,
        },
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
    } catch {}
  };

  useEffect(() => {
    if (!selectedBranchId) return;
    axiosInstance.get(`/store/${selectedBranchId}`)
      .then(res => {
        const d = res.data || {};
        if (d.open_time && d.close_time) setStoreHours({ open: d.open_time, close: d.close_time });
      })
      .catch(() => {});
  }, [selectedBranchId]);

  const getEmployeeName = (user_id: string) =>
    employees.find(e => e.id === user_id)?.name ?? t.unknown;

  const getEmployeePhone = (user_id: string) =>
    employees.find((e) => e.id === user_id)?.phone ?? "";

  const formatTime = (isoStr: string) => {
    if (!isoStr) return "";
    if (isoStr.includes("T")) return isoStr.split("T")[1].substring(0, 5);
    if (isoStr.includes(" ")) return isoStr.split(" ")[1].substring(0, 5);
    return isoStr.substring(0, 5);
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingShift(null);
    setForm({
      user_id: employees[0]?.id ?? "",
      start_time: "09:00",
      end_time: "18:00",
      status: "confirmed",
    });
    setModalOpen(true);
  };

  const openEditModal = (shift: ShiftVO) => {
    setModalMode("edit");
    setEditingShift(shift);
    setForm({
      user_id: shift.user_id,
      start_time: formatTime(shift.start_at),
      end_time: formatTime(shift.end_at),
      status: shift.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.user_id) { alert(t.errSelectEmployee); return; }
    try {
      if (modalMode === "add") {
        await axiosInstance.post("/shift", {
          id: "SFT_" + Date.now(),
          store_id: selectedBranchId,
          user_id: form.user_id,
          work_date: selectedDate,
          start_at: `${selectedDate} ${form.start_time}:00`,
          end_at: `${selectedDate} ${form.end_time}:00`,
          status: form.status,
        });
        alert(t.shiftAdded);
      } else if (editingShift) {
        await axiosInstance.put("/shift", {
          ...editingShift,
          user_id: form.user_id,
          start_at: `${selectedDate} ${form.start_time}:00`,
          end_at: `${selectedDate} ${form.end_time}:00`,
          status: form.status,
        });
        alert(t.shiftUpdated);
      }
      setModalOpen(false);
      fetchShifts();
    } catch {
      alert(t.errProcess);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await axiosInstance.delete("/shift", { params: { id } });
      fetchShifts();
    } catch {
      alert(t.errDelete);
    }
  };

  const handleContact = (user_id: string) => {
    const phone = getEmployeePhone(user_id);
    if (phone) window.location.href = `tel:${phone}`;
    else alert(t.noPhone);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
      confirmed: { bg: GREEN, icon: <CheckCircle size={11} /> },
      pending: { bg: '#f59e0b', icon: <AlertCircle size={11} /> },
      cancelled: { bg: '#ef4444', icon: <XCircle size={11} /> },
    };
    const s = styles[status];
    if (!s) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, background: s.bg, color: '#fff', fontSize: 11, fontWeight: 600 }}>
        {s.icon}{status === 'confirmed' ? t.statusConfirmed : status === 'pending' ? t.statusPending : t.statusCancelled}
      </span>
    );
  };

  const stats = {
    total: shifts.length,
    confirmed: shifts.filter((s) => s.status === "confirmed").length,
    pending: shifts.filter((s) => s.status === "pending").length,
    cancelled: shifts.filter((s) => s.status === "cancelled").length,
    totalHours: shifts
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => {
        const [sh, sm] = formatTime(s.start_at).split(":").map(Number);
        const [eh, em] = formatTime(s.end_at).split(":").map(Number);
        return sum + (eh * 60 + em - sh * 60 - sm) / 60;
      }, 0),
  };

  // 타임테이블 레이아웃 계산
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const HOUR_HEIGHT = 80;
  let openMin = toMin(storeHours.open);
  let closeMin = toMin(storeHours.close);
  if (closeMin <= openMin) closeMin = openMin + 60; // 안전장치
  // 근무가 영업시간 밖이면 범위 확장
  shifts.forEach((s) => {
    const sm = toMin(formatTime(s.start_at));
    const em = toMin(formatTime(s.end_at));
    if (sm < openMin) openMin = sm;
    if (em > closeMin) closeMin = em;
  });
  openMin = Math.floor(openMin / 60) * 60;
  closeMin = Math.ceil(closeMin / 60) * 60;
  const hourCount = Math.max(1, Math.round((closeMin - openMin) / 60));
  const timelineHeight = hourCount * HOUR_HEIGHT;
  const hourLabels = Array.from({ length: hourCount + 1 }, (_, i) => openMin + i * 60);

  // 겹치는 근무를 옆으로 배치 (lane packing)
  type Positioned = { shift: typeof shifts[number]; startMin: number; endMin: number; lane: number; lanes: number };
  const positioned: Positioned[] = (() => {
    const sorted = [...shifts]
      .map((s) => ({ shift: s, startMin: toMin(formatTime(s.start_at)), endMin: toMin(formatTime(s.end_at)) }))
      .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const result: Positioned[] = [];
    let cluster: typeof sorted = [];
    let clusterEnd = -1;
    const flush = () => {
      if (cluster.length === 0) return;
      const laneEnds: number[] = [];
      const assigned = cluster.map((c) => {
        let lane = laneEnds.findIndex((end) => end <= c.startMin);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(c.endMin); }
        else laneEnds[lane] = c.endMin;
        return { ...c, lane };
      });
      const lanes = laneEnds.length;
      assigned.forEach((a) => result.push({ ...a, lanes }));
      cluster = [];
      clusterEnd = -1;
    };
    sorted.forEach((c) => {
      if (cluster.length > 0 && c.startMin >= clusterEnd) flush();
      cluster.push(c);
      clusterEnd = Math.max(clusterEnd, c.endMin);
    });
    flush();
    return result;
  })();

  const pageBg = isDark ? 'linear-gradient(180deg, #1a3020 -12.05%, #2a3a28 17.27%, #30303a 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const contentBg = isDark ? '#3c3c46' : '#fff';
  const mainBg = isDark ? '#35353f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? '#3c3c46' : 'rgba(230,245,200,0.35)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const sidebarBg = isDark ? 'rgba(52,52,60,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#50505a' : BORDER_GREEN;
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${BORDER_GREEN}`, background: isDark ? '#50505a' : '#fff', color: textColor, fontSize: 14, boxSizing: 'border-box' as const };

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
              <button key={label} onClick={() => navigate(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, background: isActive ? GREEN : 'transparent', color: isActive ? '#fff' : textColor, transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> 근무표 관리
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={26} />일별 근무 타임테이블
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>하루 근무 일정을 시간대별로 확인합니다.</p>
            </div>
            <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: GREEN, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} />{t.addShift}
            </button>
          </div>
        {/* 날짜 + 뷰전환 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <style>{`#ds-date-input::-webkit-calendar-picker-indicator{display:none;-webkit-appearance:none;}`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 14, padding: '10px 16px' }}>
            <Calendar size={18} color={DARK_GREEN} style={{ cursor: 'pointer' }} onClick={() => { const el = document.getElementById('ds-date-input') as HTMLInputElement | null; el?.showPicker?.(); }} />
            <input id="ds-date-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 14, color: textColor, outline: 'none' }} />
          </div>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection')}>
            {t.monthlyView}
          </button>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(selectedBranchId ? `/admin/schedule/weekly/${selectedBranchId}` : '/admin/branch-selection')}>
            {t.weeklyView}
          </button>
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t.totalWorkers, value: stats.total, color: textColor },
            { label: t.statusConfirmed, value: stats.confirmed, color: GREEN },
            { label: t.statusPending, value: stats.pending, color: '#f59e0b' },
            { label: t.statusCancelled, value: stats.cancelled, color: '#ef4444' },
            { label: t.totalHours, value: `${stats.totalHours.toFixed(1)}h`, color: DARK_GREEN },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, padding: '16px', textAlign: 'center', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
              <p style={{ fontSize: 12, color: subTextColor, marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 시간별 타임라인 */}
        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 17, fontWeight: 700, color: textColor }}>
            <Clock size={18} color={DARK_GREEN} />{t.hourlyStatus}
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '32px 0', color: subTextColor }}>{t.loading}</p>
          ) : shifts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: subTextColor }}>
              <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>{t.noShifts}</p>
              <button onClick={openAddModal} style={{ marginTop: 16, padding: '10px 24px', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />{t.addFirstShift}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', position: 'relative', width: '100%', minHeight: timelineHeight, paddingBottom: 24 }}>
              {/* 시간 눈금 */}
              <div style={{ width: 56, flexShrink: 0, position: 'relative' }}>
                {hourLabels.map((m, i) => (
                  <div key={m} style={{ position: 'absolute', top: i * HOUR_HEIGHT - 8, right: 8, fontSize: 13, fontWeight: 600, color: subTextColor }}>
                    {String(Math.floor(m / 60) % 24).padStart(2, '0')}:{String(m % 60).padStart(2, '0')}
                  </div>
                ))}
              </div>
              {/* 타임라인 */}
              <div style={{ flex: 1, position: 'relative', height: timelineHeight }}>
                {/* 시간선 */}
                {hourLabels.map((m, i) => (
                  <div key={m} style={{ position: 'absolute', top: i * HOUR_HEIGHT, left: 0, right: 0, borderTop: `1px dashed ${isDark ? '#50505a' : '#d6e8c0'}` }} />
                ))}
                {/* 근무 카드 */}
                {positioned.map(({ shift, startMin, endMin, lane }) => {
                  const CARD_WIDTH = 190;
                  const LANE_GAP = 8;
                  const top = ((startMin - openMin) / 60) * HOUR_HEIGHT;
                  const height = Math.max(132, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4);
                  const accent = BORDER_GREEN;
                  return (
                    <div
                      key={shift.id}
                      onClick={() => openEditModal(shift)}
                      style={{
                        position: 'absolute',
                        top: top + 2,
                        left: 6 + lane * (CARD_WIDTH + LANE_GAP),
                        width: CARD_WIDTH,
                        height,
                        background: isDark ? '#50505a' : '#f8fff4',
                        border: `1px solid ${accent}`,
                        borderRadius: 12,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                          <User size={14} color={accent} style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: 15, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{getEmployeeName(shift.user_id)}</span>
                        </div>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{getStatusBadge(shift.status)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: subTextColor, marginTop: 4 }}>
                        <Clock size={13} />{formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(shift); }} style={{ width: '100%', marginTop: 8, padding: '6px 0', background: GREEN, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{t.editBtn}</button>
                      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, display: 'flex', gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleContact(shift.user_id); }} style={{ flex: 1, padding: '5px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.contactBtn}</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(shift.id); }} style={{ padding: '5px 9px', background: 'none', border: '1px solid #fca5a5', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        </div>
      </div>

      {/* 모달 */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setModalOpen(false)} />
          <div style={{ position: 'relative', background: isDark ? '#3c3c46' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, margin: '0 16px', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{modalMode === 'add' ? t.modalAddTitle : t.modalEditTitle}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTextColor }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.employeeLabel}</label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} style={inputStyle}>
                  <option value="">{t.selectEmployee}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.dateLabel}</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.startTimeLabel}</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.endTimeLabel}</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.statusLabel}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  <option value="confirmed">{t.statusConfirmed}</option>
                  <option value="pending">{t.statusPending}</option>
                  <option value="cancelled">{t.statusCancelled}</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {modalMode === 'edit' && (
                <button onClick={() => { handleDelete(editingShift!.id); setModalOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', background: 'none', border: '1px solid #fca5a5', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 size={13} />{t.deleteBtn}
                </button>
              )}
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.cancelBtn}</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {modalMode === 'add' ? t.addBtn : t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySchedule;

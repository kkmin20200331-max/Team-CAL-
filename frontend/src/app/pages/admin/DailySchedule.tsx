import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar, Clock, User,
  AlertCircle, CheckCircle, XCircle,
  Plus, Phone, Trash2, X, ChevronLeft
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const API = axios.create({ baseURL: "http://localhost:8080/api" });

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
  const { branchId, date } = useParams<{ branchId: string; date: string }>();
  const language = useLanguage();
  const t = translations.dailySchedule[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split("T")[0],
  );
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (branchId) {
      fetchShifts();
      fetchEmployees();
    }
  }, [selectedDate, branchId]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/shift", {
        params: {
          store_id: branchId,
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
      const res = await API.get("/users", { params: { store_id: branchId } });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

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
        await API.post("/shift", {
          id: "SFT_" + Date.now(),
          store_id: branchId,
          user_id: form.user_id,
          work_date: selectedDate,
          start_at: `${selectedDate} ${form.start_time}:00`,
          end_at: `${selectedDate} ${form.end_time}:00`,
          status: form.status,
        });
        alert(t.shiftAdded);
      } else if (editingShift) {
        await API.put("/shift", {
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
      await API.delete("/shift", { params: { id } });
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

  // 시간별 그룹화
  const groupByHour = () => {
    const hours: { [key: string]: ShiftVO[] } = {};
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0") + ":00";
      hours[hour] = shifts.filter((s) => {
        const startHour = parseInt(formatTime(s.start_at).split(":")[0]);
        const endHour = parseInt(formatTime(s.end_at).split(":")[0]);
        return i >= startHour && i < endHour;
      });
    }
    return hours;
  };

  const hourlySchedule = groupByHour();

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

  const pageBg = isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg = isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${BORDER_GREEN}`, background: isDark ? '#3a3a3c' : '#fff', color: textColor, fontSize: 14, boxSizing: 'border-box' as const };

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
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} />{t.addShift}
          </button>
        </div>
      </AdminHeader>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 40px' }}>
        {/* 날짜 + 뷰전환 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 14, padding: '10px 16px' }}>
            <Calendar size={18} color={DARK_GREEN} />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 14, color: textColor, outline: 'none' }} />
          </div>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(`/admin/schedule/monthly/${branchId}`)}>
            {t.monthlyView}
          </button>
          <button style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, fontSize: 14, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }} onClick={() => navigate(`/admin/schedule/weekly/${branchId}`)}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(hourlySchedule).map(([hour, assignments]) => {
                if (assignments.length === 0) return null;
                return (
                  <div key={hour} style={{ borderLeft: `4px solid ${DARK_GREEN}`, paddingLeft: 16, paddingTop: 4, paddingBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 10 }}>{hour}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {assignments.map((shift) => (
                        <div key={shift.id} style={{ background: isDark ? '#3a3a3c' : '#f8fff4', border: `1px solid ${BORDER_GREEN}`, borderRadius: 16, padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={14} color={subTextColor} />
                              <span style={{ fontWeight: 700, fontSize: 14, color: textColor }}>{getEmployeeName(shift.user_id)}</span>
                            </div>
                            {getStatusBadge(shift.status)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: subTextColor, marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} />{formatTime(shift.start_at)} - {formatTime(shift.end_at)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} />{getEmployeePhone(shift.user_id) || '-'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => openEditModal(shift)} style={{ flex: 1, padding: '8px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.editBtn}</button>
                            <button onClick={() => handleContact(shift.user_id)} style={{ flex: 1, padding: '8px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: DARK_GREEN, cursor: 'pointer' }}>{t.contactBtn}</button>
                            <button onClick={() => handleDelete(shift.id)} style={{ padding: '8px 12px', background: 'none', border: '1px solid #fca5a5', borderRadius: 10, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <button style={{ width: '100%', padding: '14px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/admin/substitute/${branchId}`)}>
            {t.substituteManagement}
          </button>
        </div>
      </div>

      {/* 모달 */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setModalOpen(false)} />
          <div style={{ position: 'relative', background: isDark ? '#2c2c2e' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, margin: '0 16px', padding: 28 }}>
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

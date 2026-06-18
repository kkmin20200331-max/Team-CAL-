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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />{t.addShift}
              </Button>
              <ProfilePanel />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 날짜 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* 뷰 전환 버튼 */}
        <div className="flex gap-3 mb-6">
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/monthly/${branchId}`)}>
            <Calendar className="w-4 h-4 mr-2" />{t.monthlyView}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/weekly/${branchId}`)}>
            <Calendar className="w-4 h-4 mr-2" />{t.weeklyView}
          </Button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-600">{t.totalWorkers}</p><p className="text-3xl font-bold text-gray-900">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-600">{t.statusConfirmed}</p><p className="text-3xl font-bold text-green-600">{stats.confirmed}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-600">{t.statusPending}</p><p className="text-3xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-600">{t.statusCancelled}</p><p className="text-3xl font-bold text-red-600">{stats.cancelled}</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-600">{t.totalHours}</p><p className="text-3xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}h</p></CardContent></Card>
        </div>

        {/* 시간별 타임라인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />{t.hourlyStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">{t.loading}</p>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>{t.noShifts}</p>
                <Button className="mt-4" onClick={openAddModal}>
                  <Plus className="w-4 h-4 mr-2" />{t.addFirstShift}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(hourlySchedule).map(([hour, assignments]) => {
                  if (assignments.length === 0) return null;
                  return (
                    <div
                      key={hour}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <h3 className="font-semibold text-lg mb-3">{hour}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignments.map((shift) => (
                          <div
                            key={shift.id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold">
                                  {getEmployeeName(shift.user_id)}
                                </span>
                              </div>
                              {getStatusBadge(shift.status)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {formatTime(shift.start_at)} -{" "}
                                {formatTime(shift.end_at)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {getEmployeePhone(shift.user_id) || "-"}
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(shift)}>{t.editBtn}</Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleContact(shift.user_id)}>{t.contactBtn}</Button>
                              <Button size="sm" variant="outline" className="px-2 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(shift.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 하단 버튼 */}
        <div className="mt-6">
          <Button
            className="w-full bg-gray-900 hover:bg-gray-700 text-white"
            onClick={() => navigate(`/admin/substitute/${branchId}`)}
          >
            {t.substituteManagement}
          </Button>
        </div>
      </div>

      {/* 근무 추가 / 수정 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{modalMode === 'add' ? t.modalAddTitle : t.modalEditTitle}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.employeeLabel}</label>
                <select
                  value={form.user_id}
                  onChange={(e) =>
                    setForm({ ...form, user_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.selectEmployee}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateLabel}</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.startTimeLabel}</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.endTimeLabel}</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.statusLabel}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="confirmed">{t.statusConfirmed}</option>
                  <option value="pending">{t.statusPending}</option>
                  <option value="cancelled">{t.statusCancelled}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {modalMode === "edit" && (
                <Button
                  variant="outline"
                  className="text-red-500 border-red-300 hover:bg-red-50"
                  onClick={() => {
                    handleDelete(editingShift!.id);
                    setModalOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />{t.deleteBtn}
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{t.cancelBtn}</Button>
              <Button className="flex-1" onClick={handleSubmit}>
                {modalMode === 'add' ? t.addBtn : t.saveBtn}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySchedule;

import axiosInstance, { API_BASE } from "../../../lib/axiosInstance";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "next-themes";
import AdminHeader from "./AdminHeader";
import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Search,
  UserPlus,
  Users,
  Video,
  Wallet,
} from "lucide-react";

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const BORDER_GREEN = "#00A200";
const LIGHT_GREEN = "#E6F5C8";

interface Employee {
  id: string;
  name: string;
  username?: string;
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

interface AttendanceVO {
  id: string;
  store_id: string;
  user_id: string;
  shift_id?: string;
  work_date: string | number;
  check_in_at?: string | number;
  check_out_at?: string | number;
  work_minutes?: number;
  status?: string;
}

type RowStatus = "normal" | "late" | "early" | "absent" | "working" | "scheduled" | "cancelled" | "unscheduled";

interface AttendanceRow {
  key: string;
  employeeName: string;
  employeeId: string;
  date: string;
  start: string;
  end: string;
  checkIn: string;
  checkOut: string;
  workMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  status: RowStatus;
}

const todayStr = () => toDateStr(new Date());

const toDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getDatePart = (value?: string | number) => {
  if (!value) return "";
  if (typeof value === "number") return toDateStr(new Date(value));
  if (value.includes("T")) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value.split("T")[0] : toDateStr(date);
  }
  if (value.includes(" ")) return value.split(" ")[0];
  return value.substring(0, 10);
};

const formatTime = (value?: string | number) => {
  if (!value) return "-";
  if (typeof value === "number") {
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (value.includes("T")) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value.split("T")[1].substring(0, 5)
      : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (value.includes(" ")) return value.split(" ")[1].substring(0, 5);
  return value.substring(0, 5);
};

const minutesOf = (time: string) => {
  if (!time || time === "-") return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const timeValue = (value?: string | number) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isNewerAttendance = (next: AttendanceVO, current?: AttendanceVO) => {
  if (!current) return true;
  const nextTime = Math.max(timeValue(next.check_out_at), timeValue(next.check_in_at), timeValue(next.work_date));
  const currentTime = Math.max(timeValue(current.check_out_at), timeValue(current.check_in_at), timeValue(current.work_date));
  return nextTime >= currentTime;
};

const monthBounds = (month: string) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
};

const statusMeta: Record<RowStatus, { label: string; color: string; bg: string; darkColor: string; darkBg: string; darkBorder: string; lightBorder: string }> = {
  normal: { label: "정상", color: DARK_GREEN, bg: "#E6F5C8", darkColor: "#4cd964", darkBg: "rgba(24,160,34,0.15)", darkBorder: "rgba(24,160,34,0.3)", lightBorder: "#86efac" },
  late: { label: "지각", color: "#B45309", bg: "#FEF3C7", darkColor: "#facc15", darkBg: "rgba(234,179,8,0.15)", darkBorder: "rgba(234,179,8,0.3)", lightBorder: "#fde047" },
  early: { label: "조퇴", color: "#B45309", bg: "#FFEDD5", darkColor: "#fb923c", darkBg: "rgba(249,115,22,0.15)", darkBorder: "rgba(249,115,22,0.3)", lightBorder: "#fdba74" },
  absent: { label: "결근", color: "#B91C1C", bg: "#FEE2E2", darkColor: "#f87171", darkBg: "rgba(239,68,68,0.15)", darkBorder: "rgba(239,68,68,0.3)", lightBorder: "#fca5a5" },
  working: { label: "근무중", color: "#1D4ED8", bg: "#DBEAFE", darkColor: "#60a5fa", darkBg: "rgba(59,130,246,0.15)", darkBorder: "rgba(59,130,246,0.3)", lightBorder: "#93c5fd" },
  scheduled: { label: "예정", color: "#475569", bg: "#E2E8F0", darkColor: "#94a3b8", darkBg: "rgba(100,116,139,0.15)", darkBorder: "rgba(100,116,139,0.3)", lightBorder: "#cbd5e1" },
  cancelled: { label: "취소", color: "#6B7280", bg: "#E5E7EB", darkColor: "#9ca3af", darkBg: "rgba(107,114,128,0.15)", darkBorder: "rgba(107,114,128,0.3)", lightBorder: "#d1d5db" },
  unscheduled: { label: "퇴근", color: "#0369A1", bg: "#E0F2FE", darkColor: "#38bdf8", darkBg: "rgba(14,165,233,0.15)", darkBorder: "rgba(14,165,233,0.3)", lightBorder: "#7dd3fc" },
};

export default function AttendanceManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const language = useLanguage();
  const t = translations.attendanceManagement[language];

  const localizedStatusMeta = {
    normal: { ...statusMeta.normal, label: t.statusLabels.normal },
    late: { ...statusMeta.late, label: t.statusLabels.late },
    early: { ...statusMeta.early, label: t.statusLabels.early },
    absent: { ...statusMeta.absent, label: t.statusLabels.absent },
    working: { ...statusMeta.working, label: t.statusLabels.working },
    scheduled: { ...statusMeta.scheduled, label: t.statusLabels.scheduled },
    cancelled: { ...statusMeta.cancelled, label: t.statusLabels.cancelled },
    unscheduled: { ...statusMeta.unscheduled, label: t.statusLabels.unscheduled },
  };

  const monthInputRef = useRef<HTMLInputElement>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [attendances, setAttendances] = useState<AttendanceVO[]>([]);
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RowStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const currentBranch = sessionStorage.getItem("store_name") || "지점 선택";
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const mainBg = isDark ? "#0f0f0f" : "rgba(255,255,255,0.97)";
  const cardBg = isDark ? "rgba(20,20,20,0.7)" : "rgba(255,255,255,0.5)";
  const sidebarBg = isDark ? "rgba(8,8,8,0.97)" : "rgba(255,255,255,0.85)";
  const textColor = isDark ? "#fff" : "#111";
  const subText = isDark ? "#c8c8c8" : "#6B8068";

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : "/admin/branch-selection" },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : "/admin/branch-selection" },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    const { start, end } = monthBounds(month);
    setLoading(true);
    Promise.all([
      axiosInstance.get("/users", { params: { store_id: selectedBranchId } }),
      axiosInstance.get("/shift", { params: { store_id: selectedBranchId, start_date: start, end_date: end } }),
    ])
      .then(async ([usersRes, shiftsRes]) => {
        const nextEmployees = Array.isArray(usersRes.data) ? usersRes.data : [];
        setEmployees(nextEmployees);
        setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
        const monthly = await Promise.all(
          nextEmployees.map((employee: Employee) =>
            axiosInstance
              .get("/attendance/monthly", {
                params: { store_id: selectedBranchId, user_id: employee.id, yearMonth: month },
              })
              .then((res) => (Array.isArray(res.data) ? res.data : []))
              .catch(() => []),
          ),
        );
        setAttendances(monthly.flat());
      })
      .catch(() => {
        setEmployees([]);
        setShifts([]);
        setAttendances([]);
      })
      .finally(() => setLoading(false));
  }, [selectedBranchId, month]);

  const rows = useMemo<AttendanceRow[]>(() => {
    const attendanceByUserDate = new Map<string, AttendanceVO>();
    attendances.forEach((item) => {
      const key = `${item.user_id}_${getDatePart(item.work_date)}`;
      if (isNewerAttendance(item, attendanceByUserDate.get(key))) {
        attendanceByUserDate.set(key, item);
      }
    });

    const shiftRows = shifts
      .filter((shift) => shift.status !== "cancelled" || statusFilter === "cancelled")
      .map((shift) => {
        const date = getDatePart(shift.work_date);
        const employee = employees.find((item) => item.id === shift.user_id);
        const attendance = attendanceByUserDate.get(`${shift.user_id}_${date}`);
        const start = formatTime(shift.start_at);
        const end = formatTime(shift.end_at);
        const checkIn = formatTime(attendance?.check_in_at);
        const checkOut = formatTime(attendance?.check_out_at);
        const startMin = minutesOf(start);
        const endMin = minutesOf(end);
        const inMin = minutesOf(checkIn);
        const outMin = minutesOf(checkOut);
        const lateMinutes = startMin !== null && inMin !== null ? Math.max(0, inMin - startMin) : 0;
        const earlyMinutes = endMin !== null && outMin !== null ? Math.max(0, endMin - outMin) : 0;

        let status: RowStatus = "normal";
        if (shift.status === "cancelled") status = "cancelled";
        else if (!attendance?.check_in_at) status = date < todayStr() ? "absent" : "scheduled";
        else if (!attendance.check_out_at) status = "working";
        else if (lateMinutes > 5) status = "late";
        else if (earlyMinutes > 5) status = "early";

        return {
          key: shift.id,
          employeeName: employee?.name || shift.user_id,
          employeeId: shift.user_id,
          date,
          start,
          end,
          checkIn,
          checkOut,
          workMinutes: attendance?.work_minutes || 0,
          lateMinutes,
          earlyMinutes,
          status,
        };
      });

    const shiftKeys = new Set(shifts.map((shift) => `${shift.user_id}_${getDatePart(shift.work_date)}`));
    const attendanceOnlyRows = Array.from(attendanceByUserDate.values())
      .filter((attendance) => !shiftKeys.has(`${attendance.user_id}_${getDatePart(attendance.work_date)}`))
      .map((attendance) => {
        const date = getDatePart(attendance.work_date);
        const employee = employees.find((item) => item.id === attendance.user_id);
        return {
          key: `attendance_${attendance.id}`,
          employeeName: employee?.name || attendance.user_id,
          employeeId: attendance.user_id,
          date,
          start: "-",
          end: "-",
          checkIn: formatTime(attendance.check_in_at),
          checkOut: formatTime(attendance.check_out_at),
          workMinutes: attendance.work_minutes || 0,
          lateMinutes: 0,
          earlyMinutes: 0,
          status: attendance.check_out_at ? "unscheduled" : "working",
        } satisfies AttendanceRow;
      });

    return [...shiftRows, ...attendanceOnlyRows]
      .sort((a, b) => `${b.date}_${a.start}`.localeCompare(`${a.date}_${b.start}`));
  }, [attendances, employees, shifts, statusFilter]);

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    scheduled: rows.filter((row) => row.status !== "cancelled").length,
    normal: rows.filter((row) => row.status === "normal").length,
    late: rows.filter((row) => row.status === "late").length,
    absent: rows.filter((row) => row.status === "absent").length,
    working: rows.filter((row) => row.status === "working").length,
  };

  const attendanceRate = stats.scheduled
    ? Math.round(((stats.normal + stats.late + stats.working + rows.filter((row) => row.status === "unscheduled").length) / stats.scheduled) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: "flex", gap: 20, padding: "24px 40px 40px", alignItems: "flex-start" }}>
        <aside style={{ width: 220, flexShrink: 0, background: sidebarBg, border: `1px solid ${isDark ? "#1a1a1a" : BORDER_GREEN}`, borderRadius: 20, padding: "16px 12px", position: "sticky", top: 140, maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <button onClick={() => setBranchDropdownOpen((open) => !open)} style={{ width: "100%", padding: "10px 14px", background: isDark ? "#1a1a1a" : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? "▲" : "▼"}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: isDark ? "#1c1c1e" : "#fff", border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                {stores.map((store) => (
                  <button key={store.id} onClick={() => { sessionStorage.setItem("store_id", store.id); sessionStorage.setItem("store_name", store.name); setBranchDropdownOpen(false); navigate(`/admin/attendance/${store.id}`); }} style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: store.id === selectedBranchId ? LIGHT_GREEN : "transparent", border: "none", cursor: "pointer", color: isDark ? "#fff" : DARK_GREEN, fontSize: 13, fontWeight: 600 }}>
                    {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname.startsWith("/admin/attendance/") ? label === translations.adminDashboard[language].menuItems.attendanceManagement : location.pathname === path || location.pathname.startsWith(path);
            return (
              <button key={label} onClick={() => navigate(path)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: "none", marginBottom: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, background: isActive ? GREEN : "transparent", color: isActive ? "#fff" : isDark ? "#ccc" : DARK_GREEN, textAlign: "left" }}>
                <Icon size={16} color={isActive ? "#fff" : GREEN} />
                {label}
              </button>
            );
          })}
        </aside>

        <main style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: "28px 28px 32px", boxShadow: "0px 8px 40px rgba(0,0,0,0.18)", minHeight: "calc(100vh - 120px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: "#8BA68D", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> {t.title}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
                <ClipboardCheck size={28} />{t.pageTitle}
              </h1>
              <p style={{ fontSize: 13, color: "#8BA68D", margin: 0 }}>{t.pageSubtitle}</p>
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                onClick={() => {
                  const el = monthInputRef.current;
                  if (!el) return;
                  if (typeof el.showPicker === 'function') el.showPicker();
                  else el.click();
                }}
                style={{ padding: "11px 14px", borderRadius: 12, border: `1px solid ${BORDER_GREEN}`, background: isDark ? "#1a1a1a" : "#fff", color: textColor, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
              >
                {(() => {
                  const [y, m] = month.split('-');
                  if (!y || !m) return month;
                  if (language === 'ja') return `${y}年${parseInt(m)}月`;
                  if (language === 'en') return `${new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'long' })} ${y}`;
                  return `${y}년 ${parseInt(m)}월`;
                })()}
              </div>
              <input
                ref={monthInputRef}
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '1px', height: '1px', opacity: 0.01, border: 'none', padding: 0, pointerEvents: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: t.attendanceRate, value: `${attendanceRate}%`, icon: <CheckCircle size={18} /> },
              { label: t.scheduledWork, value: stats.scheduled, icon: <Calendar size={18} /> },
              { label: t.normal, value: stats.normal, icon: <CheckCircle size={18} /> },
              { label: t.late, value: stats.late, icon: <Clock size={18} /> },
              { label: t.absent, value: stats.absent, icon: <AlertCircle size={18} /> },
            ].map((item) => (
              <div key={item.label} style={{ background: cardBg, border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: DARK_GREEN, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: subText, fontWeight: 700 }}>{item.label}</span>
                  {item.icon}
                </div>
                <p style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8BA68D" }} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t.searchPlaceholder} style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", borderRadius: 12, border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, background: isDark ? "#1a1a1a" : "#fff", color: textColor, outline: "none" }} />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RowStatus | "all")} style={{ padding: "11px 14px", borderRadius: 12, border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, background: isDark ? "#1a1a1a" : "#fff", color: textColor, outline: "none" }}>
              <option value="all">{t.allStatus}</option>
              {Object.entries(localizedStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>

          <div style={{ overflowX: "auto", background: cardBg, border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, borderRadius: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${LIGHT_GREEN}` }}>
                  {[t.colDate, t.colEmployee, t.colScheduled, t.colCheckIn, t.colCheckOut, t.colWork, t.colStatus, t.colNote].map((header) => (
                    <th key={header} style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, color: subText, fontWeight: 800 }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: subText }}>{t.loading}</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: subText }}>{t.noData}</td></tr>
                ) : (
                  filteredRows.map((row) => {
                    const meta = localizedStatusMeta[row.status];
                    return (
                      <tr key={row.key} style={{ borderBottom: `1px solid ${isDark ? "#1a1a1a" : "rgba(230,245,200,0.8)"}` }}>
                        <td style={{ padding: "14px 16px", color: textColor, fontWeight: 700 }}>{row.date}</td>
                        <td style={{ padding: "14px 16px", color: textColor }}>
                          <div style={{ fontWeight: 800 }}>{row.employeeName}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: textColor }}>{row.start} - {row.end}</td>
                        <td style={{ padding: "14px 16px", color: textColor }}>{row.checkIn}</td>
                        <td style={{ padding: "14px 16px", color: textColor }}>{row.checkOut}</td>
                        <td style={{ padding: "14px 16px", color: textColor }}>{row.workMinutes ? `${Math.floor(row.workMinutes / 60)}h ${row.workMinutes % 60}m` : "-"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 999, background: isDark ? meta.darkBg : meta.bg, color: isDark ? meta.darkColor : meta.color, fontSize: 12, fontWeight: 800, border: `1px solid ${isDark ? meta.darkBorder : meta.lightBorder}` }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: subText, fontSize: 13 }}>
                          {row.lateMinutes > 5 ? t.noteMinLate(row.lateMinutes) : row.earlyMinutes > 5 ? t.noteMinEarly(row.earlyMinutes) : row.status === "absent" ? t.noteAbsent : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

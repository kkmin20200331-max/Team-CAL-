import axiosInstance from "../../../lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import EmployeeBottomNav from "./EmployeeBottomNav";
import EmployeeProfilePanel from "./EmployeeProfilePanel";
import { AlertCircle, Calendar, CheckCircle, Clock, ClipboardCheck } from "lucide-react";

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const LIGHT_GREEN = "#E6F5C8";
const BORDER_GREEN = "#00A200";

interface UserInfo {
  id: string;
  name: string;
  role: string;
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
  user_id: string;
  work_date: string | number;
  check_in_at?: string | number;
  check_out_at?: string | number;
  work_minutes?: number;
}

type RowStatus = "normal" | "late" | "early" | "absent" | "working" | "scheduled" | "unscheduled";

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
  return {
    start: toDateStr(new Date(year, monthIndex - 1, 1)),
    end: toDateStr(new Date(year, monthIndex, 0)),
  };
};

const statusMeta: Record<RowStatus, { label: string; color: string; bg: string }> = {
  normal: { label: "정상", color: DARK_GREEN, bg: "#E6F5C8" },
  late: { label: "지각", color: "#B45309", bg: "#FEF3C7" },
  early: { label: "조퇴", color: "#B45309", bg: "#FFEDD5" },
  absent: { label: "결근", color: "#B91C1C", bg: "#FEE2E2" },
  working: { label: "근무중", color: "#1D4ED8", bg: "#DBEAFE" },
  scheduled: { label: "예정", color: "#475569", bg: "#E2E8F0" },
  unscheduled: { label: "퇴근", color: "#0369A1", bg: "#E0F2FE" },
};

export default function MyAttendance() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [user, setUser] = useState<UserInfo | null>(null);
  const [storeName, setStoreName] = useState(sessionStorage.getItem("store_name") || "");
  const [storeId, setStoreId] = useState(sessionStorage.getItem("store_id") || "");
  const [month, setMonth] = useState(toDateStr(new Date()).slice(0, 7));
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [attendances, setAttendances] = useState<AttendanceVO[]>([]);
  const [loading, setLoading] = useState(true);

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const cardBg = isDark ? "rgba(44,44,46,0.95)" : "rgba(255,255,255,0.72)";
  const textColor = isDark ? "#fff" : "#111";
  const subText = isDark ? "#aaa" : "#6B8068";

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user");
    if (!rawUser) {
      navigate("/auth/login");
      return;
    }
    const nextUser = JSON.parse(rawUser);
    setUser(nextUser);
    axiosInstance.get("/store/my", { params: { user_id: nextUser.id } })
      .then((res) => {
        if (res.data?.id) {
          setStoreId(res.data.id);
          sessionStorage.setItem("store_id", res.data.id);
        }
        if (res.data?.name) {
          setStoreName(res.data.name);
          sessionStorage.setItem("store_name", res.data.name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id || !storeId) return;
    const { start, end } = monthBounds(month);
    setLoading(true);
    Promise.all([
      axiosInstance.get("/shift/staff", { params: { user_id: user.id, start_date: start, end_date: end } }),
      axiosInstance.get("/attendance/monthly", { params: { store_id: storeId, user_id: user.id, yearMonth: month } }),
    ])
      .then(([shiftRes, attendanceRes]) => {
        setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : []);
        setAttendances(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      })
      .catch(() => {
        setShifts([]);
        setAttendances([]);
      })
      .finally(() => setLoading(false));
  }, [user?.id, storeId, month]);

  const rows = useMemo(() => {
    const attendanceByDate = new Map<string, AttendanceVO>();
    attendances.forEach((attendance) => {
      const key = getDatePart(attendance.work_date);
      if (isNewerAttendance(attendance, attendanceByDate.get(key))) {
        attendanceByDate.set(key, attendance);
      }
    });

    const shiftRows = shifts
      .filter((shift) => shift.status !== "cancelled")
      .map((shift) => {
        const date = getDatePart(shift.work_date);
        const attendance = attendanceByDate.get(date);
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
        if (!attendance?.check_in_at) status = date < toDateStr(new Date()) ? "absent" : "scheduled";
        else if (!attendance.check_out_at) status = "working";
        else if (lateMinutes > 5) status = "late";
        else if (earlyMinutes > 5) status = "early";

        return { date, start, end, checkIn, checkOut, lateMinutes, earlyMinutes, workMinutes: attendance?.work_minutes || 0, status };
      });

    const shiftDates = new Set(shifts.map((shift) => getDatePart(shift.work_date)));
    const attendanceOnlyRows = Array.from(attendanceByDate.values())
      .filter((attendance) => !shiftDates.has(getDatePart(attendance.work_date)))
      .map((attendance) => ({
        date: getDatePart(attendance.work_date),
        start: "-",
        end: "-",
        checkIn: formatTime(attendance.check_in_at),
        checkOut: formatTime(attendance.check_out_at),
        lateMinutes: 0,
        earlyMinutes: 0,
        workMinutes: attendance.work_minutes || 0,
        status: attendance.check_out_at ? "unscheduled" : "working",
      }));

    return [...shiftRows, ...attendanceOnlyRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendances, shifts]);

  const stats = {
    total: rows.length,
    normal: rows.filter((row) => row.status === "normal").length,
    late: rows.filter((row) => row.status === "late").length,
    absent: rows.filter((row) => row.status === "absent").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#1c1c1e" : "#fff", fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <header style={{ height: 100, background: isDark ? "#2c2c2e" : "#fff", position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", boxShadow: "0 1px 0 rgba(0,162,0,0.12)" }}>
        <button onClick={() => navigate("/employee/home")} style={{ border: "none", background: "transparent", cursor: "pointer", color: DARK_GREEN, fontSize: 22, fontWeight: 900 }}>Team-CAL</button>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: DARK_GREEN, fontWeight: 800 }}>{user?.name || ""}</div>
            <div style={{ color: subText, fontSize: 13 }}>{storeName}</div>
          </div>
          <EmployeeProfilePanel />
        </div>
      </header>

      <main style={{ minHeight: "calc(100vh - 100px)", background: pageBg, padding: "24px 40px 140px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, color: DARK_GREEN, fontSize: 30, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
              <ClipboardCheck size={30} />내 근태 기록
            </h1>
            <p style={{ margin: "6px 0 0", color: "#6B8068", fontSize: 14 }}>QR 출퇴근 기록과 근무표를 기준으로 이번 달 상태를 확인합니다.</p>
          </div>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} style={{ padding: "11px 14px", borderRadius: 12, border: `1px solid ${BORDER_GREEN}`, background: isDark ? "#3a3a3c" : "#fff", color: textColor, fontSize: 14, fontWeight: 700 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "예정 근무", value: stats.total, icon: <Calendar size={18} /> },
            { label: "정상", value: stats.normal, icon: <CheckCircle size={18} /> },
            { label: "지각", value: stats.late, icon: <Clock size={18} /> },
            { label: "결근", value: stats.absent, icon: <AlertCircle size={18} /> },
          ].map((item) => (
            <div key={item.label} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: DARK_GREEN, marginBottom: 10 }}>
                <span style={{ color: subText, fontSize: 13, fontWeight: 800 }}>{item.label}</span>
                {item.icon}
              </div>
              <p style={{ color: DARK_GREEN, margin: 0, fontSize: 30, fontWeight: 900 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 18, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 36, textAlign: "center", color: subText }}>근태 기록을 불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: subText }}>이번 달 근태 기록이 없습니다.</div>
          ) : (
            rows.map((row) => {
              const meta = statusMeta[row.status];
              return (
                <div key={`${row.date}_${row.start}`} style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 96px", gap: 14, alignItems: "center", padding: "16px 18px", borderBottom: `1px solid ${isDark ? "#3a3a3c" : LIGHT_GREEN}` }}>
                  <div style={{ color: textColor, fontWeight: 900 }}>{row.date}</div>
                  <div style={{ color: textColor }}>
                    <div style={{ fontSize: 12, color: subText, marginBottom: 2 }}>예정</div>
                    {row.start} - {row.end}
                  </div>
                  <div style={{ color: textColor }}>
                    <div style={{ fontSize: 12, color: subText, marginBottom: 2 }}>출근</div>
                    {row.checkIn}
                  </div>
                  <div style={{ color: textColor }}>
                    <div style={{ fontSize: 12, color: subText, marginBottom: 2 }}>퇴근</div>
                    {row.checkOut}
                  </div>
                  <span style={{ justifySelf: "end", padding: "6px 11px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 900 }}>{meta.label}</span>
                </div>
              );
            })
          )}
        </div>
      </main>
      <EmployeeBottomNav />
    </div>
  );
}

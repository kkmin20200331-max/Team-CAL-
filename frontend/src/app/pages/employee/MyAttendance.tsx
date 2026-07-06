import axiosInstance from "../../../lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import EmployeeHeader from "./EmployeeHeader";
import EmployeeBottomNav from "./EmployeeBottomNav";
import { AlertCircle, Calendar, CheckCircle, Clock, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const BORDER_GREEN = "#00A200";

interface UserInfo { id: string; name: string; role: string; }

interface ShiftVO {
  id: string; store_id: string; user_id: string;
  work_date: string; start_at: string; end_at: string; status: string;
}

interface AttendanceVO {
  id: string; user_id: string; work_date: string | number;
  check_in_at?: string | number; check_out_at?: string | number; work_minutes?: number;
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

// 언어별 월 이름
const monthNames: Record<string, string[]> = {
  ko: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  ja: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
};
const formatMonthLabel = (month: string, lang: string) => {
  const [year, m] = month.split("-").map(Number);
  const names = monthNames[lang] ?? monthNames.ko;
  if (lang === "ko") return `${year}년 ${names[m - 1]}`;
  if (lang === "ja") return `${year}年 ${names[m - 1]}`;
  return `${names[m - 1]} ${year}`;
};

export default function MyAttendance() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.attendanceManagement[language];
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<UserInfo | null>(null);
  const [storeId, setStoreId] = useState(sessionStorage.getItem("store_id") || "");
  const [month, setMonth] = useState(toDateStr(new Date()).slice(0, 7));
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [attendances, setAttendances] = useState<AttendanceVO[]>([]);
  const [loading, setLoading] = useState(true);

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const cardBg = isDark ? "#141414" : "rgba(255,255,255,0.72)";
  const textColor = isDark ? "#fff" : "#111";
  const subText = isDark ? "#aaa" : "#6B8068";
  const rowDivider = isDark ? "#3a3a3c" : "rgba(0,162,0,0.12)";

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user");
    if (!rawUser) { navigate("/auth/login"); return; }
    const nextUser = JSON.parse(rawUser);
    setUser(nextUser);
    axiosInstance.get("/store/my", { params: { user_id: nextUser.id } })
      .then((res) => {
        if (res.data?.id) { setStoreId(res.data.id); sessionStorage.setItem("store_id", res.data.id); }
        if (res.data?.name) { sessionStorage.setItem("store_name", res.data.name); }
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
      .catch(() => { setShifts([]); setAttendances([]); })
      .finally(() => setLoading(false));
  }, [user?.id, storeId, month]);

  const rows = useMemo(() => {
    const attendanceByDate = new Map<string, AttendanceVO>();
    attendances.forEach((a) => {
      const key = getDatePart(a.work_date);
      if (isNewerAttendance(a, attendanceByDate.get(key))) attendanceByDate.set(key, a);
    });

    const shiftRows = shifts
      .filter((s) => s.status !== "cancelled")
      .map((s) => {
        const date = getDatePart(s.work_date);
        const a = attendanceByDate.get(date);
        const start = formatTime(s.start_at);
        const end = formatTime(s.end_at);
        const checkIn = formatTime(a?.check_in_at);
        const checkOut = formatTime(a?.check_out_at);
        const startMin = minutesOf(start), endMin = minutesOf(end);
        const inMin = minutesOf(checkIn), outMin = minutesOf(checkOut);
        const lateMinutes = startMin !== null && inMin !== null ? Math.max(0, inMin - startMin) : 0;
        const earlyMinutes = endMin !== null && outMin !== null ? Math.max(0, endMin - outMin) : 0;
        let status: RowStatus = "normal";
        if (!a?.check_in_at) status = date < toDateStr(new Date()) ? "absent" : "scheduled";
        else if (!a.check_out_at) status = "working";
        else if (lateMinutes > 5) status = "late";
        else if (earlyMinutes > 5) status = "early";
        return { date, start, end, checkIn, checkOut, lateMinutes, earlyMinutes, workMinutes: a?.work_minutes || 0, status };
      });

    const shiftDates = new Set(shifts.map((s) => getDatePart(s.work_date)));
    const extraRows = Array.from(attendanceByDate.values())
      .filter((a) => !shiftDates.has(getDatePart(a.work_date)))
      .map((a) => ({
        date: getDatePart(a.work_date), start: "-", end: "-",
        checkIn: formatTime(a.check_in_at), checkOut: formatTime(a.check_out_at),
        lateMinutes: 0, earlyMinutes: 0, workMinutes: a.work_minutes || 0,
        status: (a.check_out_at ? "unscheduled" : "working") as RowStatus,
      }));

    return [...shiftRows, ...extraRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendances, shifts]);

  const stats = {
    total: rows.length,
    normal: rows.filter((r) => r.status === "normal").length,
    late: rows.filter((r) => r.status === "late").length,
    absent: rows.filter((r) => r.status === "absent").length,
  };

  const statusMeta: Record<RowStatus, { label: string; color: string; bg: string }> = {
    normal:      { label: t.statusLabels.normal,      color: DARK_GREEN,  bg: isDark ? "rgba(7,121,15,0.2)"  : "#E6F5C8" },
    late:        { label: t.statusLabels.late,         color: "#B45309",   bg: isDark ? "rgba(180,83,9,0.2)"  : "#FEF3C7" },
    early:       { label: t.statusLabels.early,        color: "#B45309",   bg: isDark ? "rgba(180,83,9,0.2)"  : "#FFEDD5" },
    absent:      { label: t.statusLabels.absent,       color: "#B91C1C",   bg: isDark ? "rgba(185,28,28,0.2)" : "#FEE2E2" },
    working:     { label: t.statusLabels.working,      color: "#1D4ED8",   bg: isDark ? "rgba(29,78,216,0.2)" : "#DBEAFE" },
    scheduled:   { label: t.statusLabels.scheduled,    color: "#475569",   bg: isDark ? "rgba(71,85,105,0.2)" : "#E2E8F0" },
    unscheduled: { label: t.statusLabels.unscheduled,  color: "#0369A1",   bg: isDark ? "rgba(3,105,161,0.2)" : "#E0F2FE" },
  };

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#1c1c1e" : "#EEF5DD" }}>
      {/* ── 헤더 (다른 페이지와 동일한 EmployeeHeader) ── */}
      <EmployeeHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: "#F2F5EB", display: "flex", alignItems: "center", gap: 12 }}>
              <ClipboardCheck size={36} color="#F2F5EB" />
              {t.title}
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{t.pageSubtitle}</p>
          </div>
          {/* 언어 적용된 월 선택기 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px" }}>
            <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 2 }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ minWidth: 110, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {formatMonthLabel(month, language)}
            </span>
            <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 2 }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </EmployeeHeader>

      <main style={{ minHeight: "calc(100vh - 88px)", background: pageBg, padding: "28px 40px 140px" }}>
        {/* stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: t.scheduledWork, value: stats.total,  icon: <Calendar size={18} color={DARK_GREEN} /> },
            { label: t.normal,        value: stats.normal,  icon: <CheckCircle size={18} color={DARK_GREEN} /> },
            { label: t.late,          value: stats.late,    icon: <Clock size={18} color="#B45309" /> },
            { label: t.absent,        value: stats.absent,  icon: <AlertCircle size={18} color="#B91C1C" /> },
          ].map((item) => (
            <div key={item.label} style={{
              background: cardBg, border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 16, padding: "18px 20px",
              boxShadow: "0px 4px 7.7px rgba(188,192,188,0.25)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: subText, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                {item.icon}
              </div>
              <p style={{ color: isDark ? GREEN : DARK_GREEN, margin: 0, fontSize: 30, fontWeight: 900 }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* table card */}
        <div style={{
          background: cardBg, border: `1px solid ${BORDER_GREEN}`,
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0px 4px 7.7px rgba(188,192,188,0.25)",
        }}>
          {/* col headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 96px",
            gap: 14, padding: "12px 18px",
            background: isDark ? "rgba(0,162,0,0.1)" : "rgba(230,245,200,0.6)",
            borderBottom: `1px solid ${rowDivider}`,
          }}>
            {[t.colDate, t.colScheduled, t.colCheckIn, t.colCheckOut, t.colStatus].map((h) => (
              <span key={h} style={{ fontSize: 12, fontWeight: 700, color: isDark ? GREEN : DARK_GREEN }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: "center", color: subText }}>{t.loading}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: subText }}>{t.noData}</div>
          ) : (
            rows.map((row) => {
              const meta = statusMeta[row.status];
              return (
                <div key={`${row.date}_${row.start}`} style={{
                  display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 96px",
                  gap: 14, alignItems: "center", padding: "16px 18px",
                  borderBottom: `1px solid ${rowDivider}`,
                }}>
                  <div style={{ color: textColor, fontWeight: 700, fontSize: 14 }}>{row.date}</div>
                  <div style={{ color: textColor, fontSize: 14 }}>
                    <div style={{ fontSize: 11, color: subText, marginBottom: 2 }}>{t.colScheduled}</div>
                    {row.start} – {row.end}
                  </div>
                  <div style={{ color: textColor, fontSize: 14 }}>
                    <div style={{ fontSize: 11, color: subText, marginBottom: 2 }}>{t.colCheckIn}</div>
                    {row.checkIn}
                  </div>
                  <div style={{ color: textColor, fontSize: 14 }}>
                    <div style={{ fontSize: 11, color: subText, marginBottom: 2 }}>{t.colCheckOut}</div>
                    {row.checkOut}
                  </div>
                  <span style={{
                    justifySelf: "end", padding: "5px 11px", borderRadius: 999,
                    background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700,
                  }}>{meta.label}</span>
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

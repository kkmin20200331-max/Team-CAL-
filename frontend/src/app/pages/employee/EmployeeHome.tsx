import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Home,
  Calendar,
  QrCode,
  FileText,
  UserPlus,
  Wallet,
  MessageSquare,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import EmployeeProfilePanel from "../../components/employee/EmployeeProfilePanel";

const API = axios.create({ baseURL: "http://localhost:8080/api" });

const toDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// "2026-06-05 09:00:00" 또는 "2026-06-05T09:00:00" 모두 처리
const getDatePart = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  if (dateStr.includes(" ")) return dateStr.split(" ")[0];
  return dateStr;
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr.split("T")[1].substring(0, 5);
  if (dateStr.includes(" ")) return dateStr.split(" ")[1].substring(0, 5);
  return dateStr.substring(0, 5);
};

const getDayOfWeek = (dateStr: string) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const parts = getDatePart(dateStr).split("-");
  // 로컬 시간 기준으로 Date 생성 (new Date("yyyy-MM-dd")는 UTC 기준이라 시간대 오류 발생)
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return days[d.getDay()];
};

const calcHours = (start: string, end: string) => {
  const [sh, sm] = formatTime(start).split(":").map(Number);
  const [eh, em] = formatTime(end).split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return "확정";
    case "pending":
      return "대기";
    case "cancelled":
      return "취소";
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "text-green-600";
    case "pending":
      return "text-yellow-600";
    case "cancelled":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
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

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
  phone: string;
  status: string;
}

export default function EmployeeHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      navigate("/auth/login");
      return;
    }
    const user: UserInfo = JSON.parse(userStr);
    setCurrentUser(user);

    // 소속 매장 조회
    API.get("/store/my", { params: { user_id: user.id } })
      .then((res) => {
        if (res.data?.name) {
          setStoreName(res.data.name);
          sessionStorage.setItem("store_name", res.data.name);
        }
        if (res.data?.id) {
          sessionStorage.setItem("store_id", res.data.id);
        }
      })
      .catch(() => {});

    // 이번 주 월요일 ~ 2주 뒤까지 조회 (이번 주 통계 포함하기 위해 월요일부터)
    const today = new Date();
    const dow = today.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diffToMon);
    weekStart.setHours(0, 0, 0, 0);

    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    API.get("/shift/staff", {
      params: {
        user_id: user.id,
        start_date: toDateStr(weekStart),
        end_date: toDateStr(twoWeeksLater),
      },
    })
      .then((res) => setShifts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("근무 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── 날짜 계산 ──────────────────────────────────────
  const todayStr = toDateStr(new Date());

  // 오늘 근무
  const todayShiftData = shifts.find(
    (s) => getDatePart(s.work_date) === todayStr,
  );

  // 다가오는 근무 (오늘 이후)
  const upcomingShifts = shifts
    .filter(
      (s) => getDatePart(s.work_date) > todayStr && s.status !== "cancelled",
    )
    .slice(0, 4);

  // 이번 주 (월~일) 범위
  const now = new Date();
  const dow = now.getDay(); // 0=일
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekStartStr = toDateStr(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const thisWeekEndStr = toDateStr(weekEnd);

  const thisWeekShifts = shifts.filter((s) => {
    const d = getDatePart(s.work_date);
    return d >= thisWeekStartStr && d <= thisWeekEndStr;
  });

  // 이번 주 총 근무 시간
  const totalHours = Math.round(
    thisWeekShifts
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => sum + calcHours(s.start_at, s.end_at), 0),
  );

  // 완료 = 오늘 이전 근무 (취소 제외)
  const completedShifts = thisWeekShifts.filter(
    (s) => getDatePart(s.work_date) < todayStr && s.status !== "cancelled",
  ).length;

  // ── 실시간 알림 (DB 데이터 기반 생성) ──────────────
  const notifications: {
    id: number;
    type: string;
    message: string;
    icon: string;
  }[] = [];

  if (todayShiftData) {
    notifications.push({
      id: 1,
      type: "info",
      message: `오늘 ${formatTime(todayShiftData.start_at)} 근무가 있습니다`,
      icon: "info",
    });
  }

  const pendingCount = shifts.filter((s) => s.status === "pending").length;
  if (pendingCount > 0) {
    notifications.push({
      id: 2,
      type: "warning",
      message: `승인 대기 중인 근무가 ${pendingCount}건 있습니다`,
      icon: "warning",
    });
  }

  const nextShift = upcomingShifts[0];
  if (nextShift) {
    const daysUntil = Math.ceil(
      (new Date(getDatePart(nextShift.work_date)).getTime() -
        new Date(todayStr).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 3 && daysUntil > 0) {
      notifications.push({
        id: 3,
        type: "success",
        message: `${daysUntil}일 후(${getDayOfWeek(nextShift.work_date)}요일) 근무가 있습니다`,
        icon: "success",
      });
    }
  }

  // ── 빠른 메뉴 ──────────────────────────────────────
  const quickActions = [
    {
      icon: QrCode,
      label: "QR 체크인",
      path: "/employee/checkin",
      color: "bg-blue-500",
    },
    {
      icon: Calendar,
      label: "내 근무표",
      path: "/employee/schedule",
      color: "bg-purple-500",
    },
    {
      icon: FileText,
      label: "휴가 신청",
      path: "/employee/leave",
      color: "bg-green-500",
    },
    {
      icon: UserPlus,
      label: "대타 구하기",
      path: "/employee/substitute",
      color: "bg-orange-500",
    },
    {
      icon: Wallet,
      label: "급여 조회",
      path: "/employee/payroll",
      color: "bg-pink-500",
    },
    {
      icon: MessageSquare,
      label: "게시판",
      path: "/employee/board",
      color: "bg-indigo-500",
    },
  ];

  const bottomNavItems = [
    { icon: Home, label: "홈", path: "/employee/home", active: true },
    {
      icon: Calendar,
      label: "근무표",
      path: "/employee/schedule",
      active: false,
    },
    { icon: QrCode, label: "체크인", path: "/employee/checkin", active: false },
    { icon: Wallet, label: "급여", path: "/employee/payroll", active: false },
    {
      icon: MessageSquare,
      label: "게시판",
      path: "/employee/board",
      active: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-blue-100 font-medium">{storeName}</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-xl font-bold">
                {currentUser?.name ?? "직원"}
              </h1>
              <p className="text-blue-100 text-sm">{currentUser?.role ?? ""}</p>
            </div>
            <EmployeeProfilePanel />
          </div>
        </div>

        {/* 이번 주 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">이번 주 근무</p>
            <p className="text-2xl font-bold mt-1">{totalHours}시간</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">완료/전체</p>
            <p className="text-2xl font-bold mt-1">
              {completedShifts}/{thisWeekShifts.length}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">예정 근무</p>
            <p className="text-2xl font-bold mt-1">{upcomingShifts.length}건</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* 오늘의 근무 */}
        <Card className="mb-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">오늘의 근무</CardTitle>
              <Badge
                variant={todayShiftData ? "default" : "outline"}
                className="gap-1"
              >
                <Clock className="w-3 h-3" />
                {todayShiftData ? "근무 있음" : "근무 없음"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayShiftData ? (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {getDayOfWeek(todayShiftData.work_date)}요일
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(todayShiftData.status)}`}
                  >
                    {getStatusLabel(todayShiftData.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {formatTime(todayShiftData.start_at)} -{" "}
                    {formatTime(todayShiftData.end_at)}
                  </span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  size="lg"
                  onClick={() => navigate("/employee/checkin")}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  QR 체크인하기
                </Button>
              </>
            ) : (
              <p className="text-center text-gray-400 py-4">
                오늘은 근무가 없습니다 🎉
              </p>
            )}
          </CardContent>
        </Card>

        {/* 빠른 메뉴 */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3 px-1">빠른 메뉴</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 알림 */}
        {notifications.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                알림
                <Badge className="bg-blue-500 text-white text-xs">
                  {notifications.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                >
                  <div className="mt-0.5 shrink-0">
                    {n.icon === "warning" && (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    {n.icon === "info" && (
                      <Clock className="w-4 h-4 text-blue-500" />
                    )}
                    {n.icon === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {n.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 다가오는 근무 */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">다가오는 근무</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/employee/schedule")}
              >
                전체보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingShifts.length === 0 ? (
              <p className="text-center text-gray-400 py-4">
                예정된 근무가 없습니다
              </p>
            ) : (
              upcomingShifts.map((shift, index) => {
                const datePart = getDatePart(shift.work_date);
                const dateNum = Number(datePart.split("-")[2]);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[40px]">
                        <p className="text-xs text-gray-500">
                          {getDayOfWeek(shift.work_date)}
                        </p>
                        <p className="text-lg font-bold">{dateNum}</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {formatTime(shift.start_at)} -{" "}
                          {formatTime(shift.end_at)}
                        </p>
                        <p
                          className={`text-xs ${getStatusColor(shift.status)}`}
                        >
                          {getStatusLabel(shift.status)}
                        </p>
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                item.active
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

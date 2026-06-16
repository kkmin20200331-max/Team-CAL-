import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import EmployeeHeader from "../../components/employee/EmployeeHeader";

const API = axios.create({ baseURL: "http://localhost:8080/api" });

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

const getDayLabel = (dateStr: string) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const parts = getDatePart(dateStr).split("-");
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
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const storeName = sessionStorage.getItem("store_name") || "";

  const [myShifts, setMyShifts] = useState<ShiftVO[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestVO[]>([]);
  const [historyMonth, setHistoryMonth] = useState(new Date());

  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 신청 가능 근무: 오늘 ~ 2개월 뒤
  useEffect(() => {
    if (!user.id) return;
    const today = new Date();
    const later = new Date(today);
    later.setMonth(today.getMonth() + 2);
    API.get("/shift/staff", {
      params: {
        user_id: user.id,
        start_date: toDateStr(today),
        end_date: toDateStr(later),
      },
    })
      .then((res) => setMyShifts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("근무 조회 실패:", err))
      .finally(() => setLoadingShifts(false));
  }, []);

  // 휴무 신청 내역: 선택된 월 기준
  useEffect(() => {
    if (!user.id) return;
    fetchHistory();
  }, [historyMonth]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await API.get("/leave_request/staff", {
        params: {
          user_id: user.id,
          year: historyMonth.getFullYear(),
          month: historyMonth.getMonth() + 1,
        },
      });
      setLeaveHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("내역 조회 실패:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 이미 신청한 shift_id 목록 (중복 신청 방지)
  const pendingShiftIds = useMemo(
    () =>
      leaveHistory
        .filter((lr) => lr.status === "PENDING")
        .map((lr) => lr.shift_id),
    [leaveHistory],
  );

  // 신청 가능 근무: VACANT/cancelled 제외, 이미 PENDING 제외
  const availableShifts = useMemo(
    () =>
      myShifts.filter(
        (s) =>
          s.status !== "VACANT" &&
          s.status !== "cancelled" &&
          !pendingShiftIds.includes(s.id),
      ),
    [myShifts, pendingShiftIds],
  );

  // 근무 맵 (내역에서 날짜 표시용)
  const shiftMap = useMemo(() => {
    const m: Record<string, ShiftVO> = {};
    myShifts.forEach((s) => {
      m[s.id] = s;
    });
    return m;
  }, [myShifts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) {
      setErrorMsg("휴무를 신청할 근무를 선택해주세요.");
      setSubmitStatus("error");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("사유를 입력해주세요.");
      setSubmitStatus("error");
      return;
    }

    setSubmitStatus("loading");
    try {
      await API.post("/leave_request", {
        id: crypto.randomUUID(),
        shift_id: selectedShiftId,
        user_id: user.id,
        reason: reason.trim(),
      });
      setSubmitStatus("success");
      setSelectedShiftId("");
      setReason("");
      // 내역 갱신
      fetchHistory();
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch {
      setErrorMsg("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitStatus("error");
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm("휴무 신청을 취소하시겠습니까?")) return;
    try {
      await API.delete("/leave_request", { params: { id: leaveId } });
      fetchHistory();
    } catch {
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            승인
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="gap-1 bg-yellow-500">
            <Clock className="w-3 h-3" />
            대기중
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            거절
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="gap-1 text-gray-500">
            <XCircle className="w-3 h-3" />
            취소됨
          </Badge>
        );
      default:
        return null;
    }
  };

  const bottomNavItems = [
    { icon: Home, label: "홈", path: "/employee/home", active: false },
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 공통 헤더 */}
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">휴무 신청</h1>
          <p className="text-blue-100 text-sm mt-1">
            근무 중 빠질 날을 신청하세요
          </p>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4 space-y-4">
        {/* ── 휴무 신청 폼 ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              휴무 신청서
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 근무 선택 */}
              <div className="space-y-2">
                <Label>빠질 근무 선택</Label>
                {loadingShifts ? (
                  <p className="text-sm text-gray-400 py-2">
                    근무 목록 불러오는 중...
                  </p>
                ) : availableShifts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
                    신청 가능한 근무가 없습니다
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableShifts.map((shift) => {
                      const datePart = getDatePart(shift.work_date);
                      const isSelected = selectedShiftId === shift.id;
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() =>
                            setSelectedShiftId(isSelected ? "" : shift.id)
                          }
                          className={`w-full text-left rounded-lg border-2 p-3 transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-center min-w-[36px]">
                                <p className="text-xs text-gray-500">
                                  {getDayLabel(shift.work_date)}
                                </p>
                                <p className="text-lg font-bold">
                                  {Number(datePart.split("-")[2])}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {format(new Date(datePart), "M월 d일", {
                                    locale: ko,
                                  })}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {formatTimePart(shift.start_at)} -{" "}
                                  {formatTimePart(shift.end_at)}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 사유 입력 */}
              <div className="space-y-2">
                <Label>사유</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="휴무 사유를 입력하세요 (예: 병원 진료, 가족 행사 등)"
                  rows={3}
                />
              </div>

              {/* 상태 알림 */}
              {submitStatus === "success" && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    휴무 신청이 완료되었습니다. 관리자 승인을 기다려주세요.
                  </AlertDescription>
                </Alert>
              )}
              {submitStatus === "error" && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={
                  submitStatus === "loading" ||
                  !selectedShiftId ||
                  !reason.trim()
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                {submitStatus === "loading" ? "신청 중..." : "신청서 제출"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── 신청 내역 ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">신청 내역</CardTitle>
              {/* 월 이동 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setHistoryMonth((prev) => subMonths(prev, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-16 text-center">
                  {format(historyMonth, "yyyy.MM")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setHistoryMonth((prev) => addMonths(prev, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingHistory ? (
              <p className="text-center py-6 text-sm text-gray-400">
                불러오는 중...
              </p>
            ) : leaveHistory.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-400">
                이 달의 신청 내역이 없습니다
              </p>
            ) : (
              leaveHistory.map((leave) => {
                const shift = shiftMap[leave.shift_id];
                const datePart = shift ? getDatePart(shift.work_date) : "";
                return (
                  <div
                    key={leave.id}
                    className={`p-4 rounded-lg border-2 ${
                      leave.status === "PENDING"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : leave.status === "APPROVED"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : leave.status === "REJECTED"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">휴무</Badge>
                          {getStatusBadge(leave.status)}
                        </div>
                        {shift ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">
                              {format(new Date(datePart), "M월 d일 (eee)", {
                                locale: ko,
                              })}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatTimePart(shift.start_at)} -{" "}
                              {formatTimePart(shift.end_at)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {storeName}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            근무 정보 없음
                          </p>
                        )}
                      </div>
                      {leave.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => handleCancel(leave.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                      <p className="text-xs text-gray-500">사유</p>
                      <p className="text-sm">{leave.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        신청일: {formatTimestamp(leave.requested_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 안내 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              안내
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• 신청 후 관리자 승인 시 해당 근무는 공석 처리됩니다</p>
            <p>• 대기중(PENDING) 상태일 때만 취소 가능합니다</p>
            <p>• 급한 사정은 관리자에게 직접 문의해주세요</p>
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

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  ChevronLeft, ChevronRight, Search, Calendar
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import ProfilePanel from './ProfilePanel';

const API = axios.create({ baseURL: "http://localhost:8080/api" });

// 한국 공휴일 (2025~2026)
const HOLIDAYS: { [key: string]: string } = {
  "2025-01-01": "신정",
  "2025-01-28": "설 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설 연휴",
  "2025-03-01": "삼일절",
  "2025-05-05": "어린이날",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-09": "한글날",
  "2025-12-25": "크리스마스",
  "2026-01-01": "신정",
  "2026-01-27": "설 연휴",
  "2026-01-28": "설날",
  "2026-01-29": "설 연휴",
  "2026-03-01": "삼일절",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-09": "한글날",
  "2026-12-25": "크리스마스",
};

interface Employee {
  id: string;
  name: string;
  phone: string;
  username: string;
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

const getWeekDates = (baseDate: Date) => {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

const getDateStr = (dateStr: string) => {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return "";
  if (isoStr.includes("T")) return isoStr.split("T")[1].substring(0, 5);
  if (isoStr.includes(" ")) return isoStr.split(" ")[1].substring(0, 5);
  return isoStr.substring(0, 5);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200";
    case "pending":
      return "bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/30";
    case "cancelled":
      return "bg-red-100 border-red-300 border-dashed text-red-900 dark:bg-red-900/30";
    default:
      return "bg-gray-100 border-gray-300 text-gray-900";
  }
};

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.weeklySchedule[language];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const weekDates = getWeekDates(currentWeek);

  useEffect(() => {
    if (!branchId) return;
    fetchEmployees();
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    fetchShifts();
  }, [currentWeek, branchId]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/users", { params: { store_id: branchId } });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("직원 조회 실패:", err);
    }
  };

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const startDate = format(weekDates[0], "yyyy-MM-dd");
      const endDate = format(weekDates[6], "yyyy-MM-dd");
      const res = await API.get("/shift", {
        params: {
          store_id: branchId,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("근무표 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const getShiftsForEmployee = (userId: string, date: Date): ShiftVO[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter(
      (s) => s.user_id === userId && getDateStr(s.work_date) === dateStr,
    );
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Row 1: 제목 + 프로필 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/admin/dashboard/${branchId}`)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {format(weekDates[0], "yyyy년 M월 d일", { locale: ko })} -{" "}
                  {format(weekDates[6], "M월 d일", { locale: ko })}
                </p>
              </div>
            </div>
            <ProfilePanel />
          </div>

          {/* Row 2: 범례 + 주 이동 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded" />
                <span>{t.legendConfirmed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
                <span>{t.legendPending}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-dashed border-red-300 rounded" />
                <span>{t.legendCancelled}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-red-600 font-medium">{t.legendHoliday}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek((prev) => addDays(prev, -7))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>{t.today}</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeek(prev => addDays(prev, 7))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* 검색 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 스케줄 그리드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 뷰 전환 버튼 */}
        <div className="flex gap-3 mb-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/monthly/${branchId}`)}>
            <Calendar className="w-4 h-4 mr-2" />{t.monthlyView}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/daily/${branchId}/${format(new Date(), 'yyyy-MM-dd')}`)}>
            <Calendar className="w-4 h-4 mr-2" />{t.dailyView}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-4 text-left border-b border-r border-gray-200 dark:border-gray-700 min-w-[150px]">
                      {t.employeeName}
                    </th>
                    {weekDates.map((date, index) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const holiday = HOLIDAYS[dateStr];
                      const isSunday = date.getDay() === 0;
                      const isSaturday = date.getDay() === 6;

                      return (
                        <th
                          key={index}
                          className={`p-4 text-center border-b border-gray-200 dark:border-gray-700 min-w-[130px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            holiday || isSunday
                              ? "bg-red-50 dark:bg-red-900/10"
                              : isSaturday
                                ? "bg-blue-50 dark:bg-blue-900/10"
                                : ""
                          }`}
                          onClick={() =>
                            navigate(
                              `/admin/schedule/daily/${branchId}/${dateStr}`,
                            )
                          }
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`text-sm font-medium ${holiday || isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : ""}`}
                            >
                              {format(date, "EEE", { locale: ko })}
                            </span>
                            <span
                              className={`text-lg font-bold ${holiday || isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : ""}`}
                            >
                              {format(date, "d")}
                            </span>
                            {holiday && (
                              <span className="text-xs text-red-500 font-medium leading-tight">
                                {holiday}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">{t.loading}</td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">{t.noEmployees}</td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        {/* 직원 정보 */}
                        <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 p-4 border-b border-r border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {employee.name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {employee.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {employee.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 요일별 근무 셀 */}
                        {weekDates.map((date, dateIndex) => {
                          const dayShifts = getShiftsForEmployee(
                            employee.id,
                            date,
                          );
                          const dateStr = format(date, "yyyy-MM-dd");
                          const isHoliday = !!HOLIDAYS[dateStr];
                          const isSunday = date.getDay() === 0;
                          const isSaturday = date.getDay() === 6;

                          return (
                            <td
                              key={dateIndex}
                              className={`p-2 border-b border-gray-200 dark:border-gray-700 text-center align-top ${
                                isHoliday || isSunday
                                  ? "bg-red-50/30"
                                  : isSaturday
                                    ? "bg-blue-50/30"
                                    : ""
                              }`}
                            >
                              <div className="space-y-1">
                                {dayShifts.length === 0 ? (
                                  <div
                                    className="h-12 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                                    onClick={() =>
                                      navigate(
                                        `/admin/schedule/daily/${branchId}/${dateStr}`,
                                      )
                                    }
                                  />
                                ) : (
                                  dayShifts.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className={`p-1.5 rounded-lg border-2 text-xs cursor-pointer transition-all hover:shadow-md ${getStatusColor(shift.status)}`}
                                      onClick={() =>
                                        navigate(
                                          `/admin/schedule/daily/${branchId}/${dateStr}`,
                                        )
                                      }
                                    >
                                      <div className="font-semibold">{formatTime(shift.start_at)}</div>
                                      <div className="font-semibold">{formatTime(shift.end_at)}</div>
                                      {shift.status !== 'confirmed' && (
                                        <Badge className={`text-xs mt-0.5 px-1 py-0 h-4 ${shift.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                                          {shift.status === 'pending' ? t.statusPending : t.statusCancelled}
                                        </Badge>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 하단 버튼 */}
        <div className="mt-6">
          <Button
            className="w-full bg-gray-900 hover:bg-gray-700 text-white dark:bg-gray-950 dark:hover:bg-gray-800"
            onClick={() => navigate(`/admin/substitute/${branchId}`)}
          >
            대타 근무자 관리
          </Button>
        </div>
      </div>
    </div>
  );
}

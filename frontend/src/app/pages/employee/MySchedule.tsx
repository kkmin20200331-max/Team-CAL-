import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar } from '../../components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Home,
  Calendar as CalendarIcon,
  QrCode,
  Wallet,
  MessageSquare,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, addDays, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

// 한국 공휴일 (2025~2026)
const HOLIDAYS: { [key: string]: string } = {
  '2025-01-01': '신정',
  '2025-01-28': '설 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설 연휴',
  '2025-03-01': '삼일절',
  '2025-05-05': '어린이날',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-09': '한글날',
  '2025-12-25': '크리스마스',
  '2026-01-01': '신정',
  '2026-01-27': '설 연휴',
  '2026-01-28': '설날',
  '2026-01-29': '설 연휴',
  '2026-03-01': '삼일절',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-09': '한글날',
  '2026-12-25': '크리스마스',
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

const formatTime = (isoStr: string) => {
  if (!isoStr) return '';
  if (isoStr.includes('T')) return isoStr.split('T')[1].substring(0, 5);
  if (isoStr.includes(' ')) return isoStr.split(' ')[1].substring(0, 5);
  return isoStr.substring(0, 5);
};

const getWorkDate = (shift: ShiftVO): string => {
  const raw = shift.work_date || '';
  if (raw.includes('T')) return raw.split('T')[0];
  if (raw.includes(' ')) return raw.split(' ')[0];
  return raw;
};

const calcHours = (start: string, end: string): number => {
  const [sh, sm] = formatTime(start).split(':').map(Number);
  const [eh, em] = formatTime(end).split(':').map(Number);
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;
};

const getDayLabel = (dateStr: string): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
};

export default function MySchedule() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeName = localStorage.getItem('store_name') || '매장';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');


  // 월간 조회
  useEffect(() => {
    if (!user.id) return;
    if (viewMode === 'month') fetchMonthShifts();
  }, [currentMonth, viewMode]);

  // 주간 조회
  useEffect(() => {
    if (!user.id) return;
    if (viewMode === 'week') fetchWeekShifts();
  }, [currentWeekStart, viewMode]);

  const fetchMonthShifts = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const res = await API.get('/shift/staff', {
        params: { user_id: user.id, start_date: start, end_date: end }
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('근무 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekShifts = async () => {
    setLoading(true);
    try {
      const start = format(currentWeekStart, 'yyyy-MM-dd');
      const end = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      const res = await API.get('/shift/staff', {
        params: { user_id: user.id, start_date: start, end_date: end }
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('근무 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeShifts = shifts.filter(s => s.status !== 'cancelled');
  const totalHours = activeShifts.reduce((sum, s) => sum + calcHours(s.start_at, s.end_at), 0);
  const completedShifts = activeShifts.filter(s => getWorkDate(s) < today).length;
  const upcomingShifts = activeShifts.filter(s => getWorkDate(s) >= today).length;

  // 날짜별 상태 맵 (달력 점 표시용)
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    shifts.forEach(s => {
      const date = getWorkDate(s);
      if (!map[date]) map[date] = new Set();
      map[date].add(s.status);
    });
    return map;
  }, [shifts]);

  // 달력 커스텀 DayContent - 컬러 점 + 공휴일 표시
  const CustomDayContent = useCallback(({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const statuses = shiftsByDate[dateStr];
    const isHoliday = !!HOLIDAYS[dateStr];
    const isSunday = date.getDay() === 0;
    const isRed = isHoliday || isSunday;
    return (
      <div className="flex flex-col items-center justify-center py-0.5">
        <span className={`text-sm leading-none ${isRed ? 'text-red-500' : ''}`}>
          {date.getDate()}
        </span>
        {isHoliday && (
          <span className="text-[8px] text-red-400 leading-none mt-0.5 truncate max-w-[30px] text-center">
            {HOLIDAYS[dateStr]}
          </span>
        )}
        {statuses && statuses.size > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {statuses.has('confirmed') && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            )}
            {statuses.has('pending') && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
            )}
            {[...statuses].some(s => s !== 'confirmed' && s !== 'pending') && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            )}
          </div>
        )}
      </div>
    );
  }, [shiftsByDate]);

  // 주간 뷰 7일
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="w-3 h-3" />확정</Badge>;
      case 'pending':
        return <Badge variant="outline" className="gap-1 border-yellow-400 text-yellow-600"><AlertCircle className="w-3 h-3" />대기</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />취소</Badge>;
      default:
        return <Badge className="gap-1 bg-red-500"><XCircle className="w-3 h-3" />대타</Badge>;
    }
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: CalendarIcon, label: '근무표', path: '/employee/schedule', active: true },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">

      {/* Header */}
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">내 근무표</h1>
          {/* 월간 통계 */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
              <p className="text-xs text-blue-100">총 근무</p>
              <p className="text-lg font-bold mt-1">{activeShifts.length}일</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
              <p className="text-xs text-blue-100">총 시간</p>
              <p className="text-lg font-bold mt-1">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
              <p className="text-xs text-blue-100">완료</p>
              <p className="text-lg font-bold mt-1">{completedShifts}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
              <p className="text-xs text-blue-100">예정</p>
              <p className="text-lg font-bold mt-1">{upcomingShifts}</p>
            </div>
          </div>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4">
        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="month">월간 보기</TabsTrigger>
            <TabsTrigger value="week">주간 보기</TabsTrigger>
          </TabsList>

          {/* 월간 뷰 */}
          <TabsContent value="month" className="space-y-4 mt-4">
            {/* 월 이동 */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="w-4 h-4 mr-1" />이전 달
              </Button>
              <h2 className="font-bold">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h2>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                다음 달<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* 달력 - 컬러 점 표시 */}
            <Card>
              <CardContent className="p-4">
                {/* 범례 */}
                <div className="flex gap-4 mb-3 text-xs text-gray-500 justify-center">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />확정
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />대기
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />대타/취소
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-200 inline-block" />공휴일
                  </span>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md"
                  components={{ DayContent: CustomDayContent }}
                />
              </CardContent>
            </Card>

            {/* 근무 목록 */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg px-1">이번 달 근무 일정</h3>
              {loading ? (
                <p className="text-center py-8 text-gray-400">불러오는 중...</p>
              ) : shifts.length === 0 ? (
                <p className="text-center py-8 text-gray-400">등록된 근무가 없습니다.</p>
              ) : (
                shifts.map((shift) => {
                  const dateStr = getWorkDate(shift);
                  const hours = calcHours(shift.start_at, shift.end_at);
                  return (
                    <Card key={shift.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-center min-w-[48px]">
                              <p className="text-xs text-gray-600 dark:text-gray-400">{getDayLabel(dateStr)}</p>
                              <p className="text-2xl font-bold">{dateStr.split('-')[2]}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-bold text-lg">
                                  {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                                </span>
                                <Badge variant="secondary" className="text-xs">{hours}시간</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{storeName}</span>
                              </div>
                            </div>
                          </div>
                          <div>{getStatusBadge(shift.status)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* 주간 뷰 */}
          <TabsContent value="week" className="space-y-2 mt-4">
            {/* 주 이동 */}
            <div className="flex items-center justify-between mb-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-bold text-sm">
                {format(currentWeekStart, 'M월 d일', { locale: ko })} - {format(addDays(currentWeekStart, 6), 'M월 d일', { locale: ko })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-400">불러오는 중...</p>
            ) : (
              weekDates.map((date, index) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayShifts = shifts.filter(s => getWorkDate(s) === dateStr);
                const isToday = isSameDay(date, new Date());
                const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

                return (
                  <Card key={index} className={isToday ? 'border-purple-400 border-2' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className={`text-xs ${index === 5 ? 'text-blue-500' : index === 6 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                            {format(date, 'M/d')}
                          </p>
                          <p className={`font-bold ${isToday ? 'text-purple-600' : index === 5 ? 'text-blue-500' : index === 6 ? 'text-red-500' : ''}`}>
                            {dayLabels[index]}
                            {isToday && <span className="block text-xs text-purple-500">오늘</span>}
                          </p>
                        </div>

                        {dayShifts.length > 0 ? (
                          <div className="flex-1 space-y-2">
                            {dayShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold">
                                      {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                                    </span>
                                  </div>
                                  {getStatusBadge(shift.status)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  <span>{storeName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center py-4 text-gray-400 dark:text-gray-600">
                            <p className="text-sm">휴무</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* 요약 카드 */}
        <Card className="mt-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">이번 달 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 근무 시간</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {totalHours.toFixed(1)}시간
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 근무일</p>
                <p className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                  {activeShifts.length}일
                </p>
              </div>
            </div>
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
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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

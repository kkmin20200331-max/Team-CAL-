import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  format, addMonths, startOfMonth, endOfMonth,
  startOfWeek, addDays, isSameMonth, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import ProfilePanel from '../../components/admin/ProfilePanel';

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

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function MonthlySchedule() {
  const navigate = useNavigate();
  const { branchId } = useParams();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (branchId) fetchShifts();
  }, [currentMonth, branchId]);

  const fetchShifts = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    try {
      const res = await API.get('/shift', {
        params: { store_id: branchId, start_date: start, end_date: end }
      });
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('근무 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 달력 날짜 배열 생성 (월요일 시작, 6주)
  const getCalendarDates = (): Date[] => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  };

  const getWorkDateStr = (shift: ShiftVO): string => {
    const raw = shift.work_date || '';
    if (raw.includes('T')) return raw.split('T')[0];
    if (raw.includes(' ')) return raw.split(' ')[0];
    return raw;
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => getWorkDateStr(s) === dateStr);
  };

  const calendarDates = getCalendarDates();
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Row 1: 제목 + 프로필 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">월간 근무표</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </p>
              </div>
            </div>
            <ProfilePanel />
          </div>

          {/* Row 2: 범례 + 월 이동 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">대기</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">취소</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-300 rounded-full" />
                <span className="text-red-500 dark:text-red-400">공휴일</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>오늘</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 뷰 전환 버튼 */}
        <div className="flex gap-3 mb-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/weekly/${branchId}`)}>
            주간 근무표 보기
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/daily/${branchId}/${format(new Date(), 'yyyy-MM-dd')}`)}>
            <Calendar className="w-4 h-4 mr-2" />일간 근무표 보기
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-sm font-semibold py-2
                    ${i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 셀 */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">불러오는 중...</div>
            ) : (
              <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700">
                {calendarDates.map((date, index) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayShifts = getShiftsForDate(date);
                  const pendingCount = dayShifts.filter(s => s.status === 'pending').length;
                  const cancelledCount = dayShifts.filter(s => s.status === 'cancelled').length;
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isToday = isSameDay(date, today);
                  const isHoliday = !!HOLIDAYS[dateStr];
                  const isSunday = date.getDay() === 0;
                  const isSaturday = date.getDay() === 6;

                  const isRed = isHoliday || isSunday;

                  return (
                    <div
                      key={index}
                      onClick={() => isCurrentMonth && navigate(`/admin/schedule/daily/${branchId}/${dateStr}`)}
                      className={`
                        min-h-[90px] p-2 border-r border-b border-gray-200 dark:border-gray-700
                        flex flex-col items-center
                        ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'cursor-default'}
                        ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''}
                        ${isCurrentMonth && isRed ? 'bg-red-50/40 dark:bg-red-900/10' : ''}
                        ${isCurrentMonth && isSaturday ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                        transition-colors
                      `}
                    >
                      {/* 날짜 숫자 */}
                      <div className={`
                        w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mt-0.5 shrink-0
                        ${isToday && isCurrentMonth ? 'bg-blue-600 text-white' : ''}
                        ${!isToday && isCurrentMonth && isRed ? 'text-red-500' : ''}
                        ${!isToday && isCurrentMonth && isSaturday ? 'text-blue-500' : ''}
                        ${!isToday && isCurrentMonth && !isRed && !isSaturday ? 'text-gray-800 dark:text-gray-200' : ''}
                        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>

                      {/* 공휴일 이름 */}
                      {isHoliday && isCurrentMonth && (
                        <span className="text-[10px] text-red-400 leading-tight text-center mt-0.5 px-0.5">
                          {HOLIDAYS[dateStr]}
                        </span>
                      )}

                      {/* 이벤트 동그라미 */}
                      {isCurrentMonth && (pendingCount > 0 || cancelledCount > 0) && (
                        <div className="flex flex-wrap gap-1 mt-auto justify-center pb-1">
                          {/* 대기 - 노란 점 (최대 3개) */}
                          {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
                            <div key={`p-${i}`} className="w-2 h-2 rounded-full bg-yellow-400" />
                          ))}
                          {pendingCount > 3 && (
                            <span className="text-[9px] text-yellow-600 font-medium">+{pendingCount - 3}</span>
                          )}
                          {/* 취소 - 빨간 점 (최대 3개) */}
                          {Array.from({ length: Math.min(cancelledCount, 3) }).map((_, i) => (
                            <div key={`c-${i}`} className="w-2 h-2 rounded-full bg-red-500" />
                          ))}
                          {cancelledCount > 3 && (
                            <span className="text-[9px] text-red-600 font-medium">+{cancelledCount - 3}</span>
                          )}
                        </div>
                      )}
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

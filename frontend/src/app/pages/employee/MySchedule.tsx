import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function MySchedule() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const currentMonth = new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'long' });

  const monthlyShifts = [
    { date: '2024-05-19', day: '일', time: '09:00-15:00', hours: 6, status: 'scheduled', location: '미금점' },
    { date: '2024-05-20', day: '월', time: '12:00-18:00', hours: 6, status: 'scheduled', location: '미금점' },
    { date: '2024-05-22', day: '수', time: '17:00-22:00', hours: 5, status: 'scheduled', location: '미금점' },
    { date: '2024-05-24', day: '금', time: '12:00-18:00', hours: 6, status: 'confirmed', location: '미금점' },
    { date: '2024-05-26', day: '일', time: '09:00-15:00', hours: 6, status: 'confirmed', location: '미금점' },
    { date: '2024-05-27', day: '월', time: '12:00-18:00', hours: 6, status: 'pending', location: '미금점' },
    { date: '2024-05-29', day: '수', time: '17:00-22:00', hours: 5, status: 'pending', location: '미금점' },
  ];

  const weeklyView = [
    {
      date: '2024-05-19',
      day: '일요일',
      shifts: [{ time: '09:00-15:00', location: '미금점', status: 'scheduled' }]
    },
    {
      date: '2024-05-20',
      day: '월요일',
      shifts: [{ time: '12:00-18:00', location: '미금점', status: 'scheduled' }]
    },
    {
      date: '2024-05-21',
      day: '화요일',
      shifts: []
    },
    {
      date: '2024-05-22',
      day: '수요일',
      shifts: [{ time: '17:00-22:00', location: '미금점', status: 'scheduled' }]
    },
    {
      date: '2024-05-23',
      day: '목요일',
      shifts: []
    },
    {
      date: '2024-05-24',
      day: '금요일',
      shifts: [{ time: '12:00-18:00', location: '미금점', status: 'confirmed' }]
    },
    {
      date: '2024-05-25',
      day: '토요일',
      shifts: []
    }
  ];

  const monthlyStats = {
    totalShifts: 12,
    totalHours: 68,
    completedShifts: 8,
    upcomingShifts: 4,
    estimatedPay: 680000
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            확정
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="gap-1 bg-blue-500">
            <Clock className="w-3 h-3" />
            예정
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            대기
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            취소
          </Badge>
        );
      default:
        return null;
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">내 근무표</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => {}}
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-purple-100">총 근무</p>
            <p className="text-lg font-bold mt-1">{monthlyStats.totalShifts}일</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-purple-100">총 시간</p>
            <p className="text-lg font-bold mt-1">{monthlyStats.totalHours}h</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-purple-100">완료</p>
            <p className="text-lg font-bold mt-1">{monthlyStats.completedShifts}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-purple-100">예정</p>
            <p className="text-lg font-bold mt-1">{monthlyStats.upcomingShifts}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전 달
          </Button>
          <h2 className="font-bold">{currentMonth}</h2>
          <Button variant="outline" size="sm">
            다음 달
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="month">월간 보기</TabsTrigger>
            <TabsTrigger value="week">주간 보기</TabsTrigger>
          </TabsList>

          {/* Month View */}
          <TabsContent value="month" className="space-y-4 mt-4">
            {/* Calendar */}
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  modifiers={{
                    hasShift: monthlyShifts.map(s => new Date(s.date))
                  }}
                  modifiersStyles={{
                    hasShift: {
                      backgroundColor: 'rgb(59 130 246 / 0.2)',
                      fontWeight: 'bold',
                      color: 'rgb(37 99 235)'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Shift List */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg px-1">이번 달 근무 일정</h3>
              {monthlyShifts.map((shift, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-center min-w-[48px]">
                          <p className="text-xs text-gray-600 dark:text-gray-400">{shift.day}</p>
                          <p className="text-2xl font-bold">{shift.date.split('-')[2]}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-lg">{shift.time}</span>
                            <Badge variant="secondary" className="text-xs">
                              {shift.hours}시간
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>컴포즈 {shift.location}</span>
                          </div>
                        </div>
                      </div>
                      <div>{getStatusBadge(shift.status)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Week View */}
          <TabsContent value="week" className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">이번 주 (5월 19일 - 5월 25일)</h3>
            </div>

            {weeklyView.map((day, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {day.date.split('-')[1]}/{day.date.split('-')[2]}
                      </p>
                      <p className="font-bold">{day.day}</p>
                    </div>

                    {day.shifts.length > 0 ? (
                      <div className="flex-1 space-y-2">
                        {day.shifts.map((shift, shiftIndex) => (
                          <div
                            key={shiftIndex}
                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-bold">{shift.time}</span>
                              </div>
                              {getStatusBadge(shift.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span>컴포즈 {shift.location}</span>
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
            ))}
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card className="mt-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">이번 달 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 근무 시간</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {monthlyStats.totalHours}시간
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예상 급여</p>
                <p className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                  {(monthlyStats.estimatedPay / 10000).toFixed(0)}만원
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">근무 상태 안내</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">확정</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">확정된 근무</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">예정</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">예정된 근무</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">대기</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">승인 대기</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
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

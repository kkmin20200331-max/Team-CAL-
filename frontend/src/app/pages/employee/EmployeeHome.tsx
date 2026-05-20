import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Home,
  Calendar,
  QrCode,
  FileText,
  UserPlus,
  Wallet,
  MessageSquare,
  Clock,
  MapPin,
  Bell,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function EmployeeHome() {
  const navigate = useNavigate();

  const currentUser = {
    name: '김민수',
    role: '일반',
    employeeId: 'EMP-2024-001',
    branch: '컴포즈 미금점'
  };

  const todayShift = {
    date: '2024-05-19',
    dayOfWeek: '일요일',
    startTime: '09:00',
    endTime: '15:00',
    status: 'scheduled',
    location: '컴포즈 미금점',
    address: '경기도 성남시 분당구 미금로',
    checkedIn: false,
    checkInTime: null
  };

  const upcomingShifts = [
    { date: '2024-05-20', day: '월', time: '12:00-18:00', location: '미금점' },
    { date: '2024-05-22', day: '수', time: '17:00-22:00', location: '미금점' },
    { date: '2024-05-24', day: '금', time: '12:00-18:00', location: '미금점' },
    { date: '2024-05-26', day: '일', time: '09:00-15:00', location: '미금점' }
  ];

  const notifications = [
    { id: 1, type: 'info', message: '다음 주 근무표가 확정되었습니다', time: '10분 전', read: false },
    { id: 2, type: 'warning', message: '보건증 갱신 기한이 7일 남았습니다', time: '1시간 전', read: false },
    { id: 3, type: 'success', message: '대타 신청이 승인되었습니다', time: '3시간 전', read: true },
    { id: 4, type: 'info', message: '신규 게시물: 6월 행사 안내', time: '어제', read: true }
  ];

  const weeklyStats = {
    totalHours: 24,
    completedShifts: 3,
    totalShifts: 4,
    estimatedPay: 240000
  };

  const quickActions = [
    { icon: QrCode, label: 'QR 체크인', path: '/employee/checkin', color: 'bg-blue-500' },
    { icon: Calendar, label: '내 근무표', path: '/employee/schedule', color: 'bg-purple-500' },
    { icon: FileText, label: '휴가 신청', path: '/employee/leave', color: 'bg-green-500' },
    { icon: UserPlus, label: '대타 구하기', path: '/employee/substitute', color: 'bg-orange-500' },
    { icon: Wallet, label: '급여 조회', path: '/employee/payroll', color: 'bg-pink-500' },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', color: 'bg-indigo-500' }
  ];

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: true },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarFallback className="bg-white text-blue-600 font-bold">
                {currentUser.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{currentUser.name}</h1>
              <p className="text-blue-100 text-sm">{currentUser.branch}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white relative"
            onClick={() => {}}
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">이번 주 근무</p>
            <p className="text-2xl font-bold mt-1">{weeklyStats.totalHours}시간</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">완료/전체</p>
            <p className="text-2xl font-bold mt-1">
              {weeklyStats.completedShifts}/{weeklyStats.totalShifts}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-blue-100">예상 급여</p>
            <p className="text-xl font-bold mt-1">
              {(weeklyStats.estimatedPay / 10000).toFixed(0)}만원
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Today's Shift */}
        <Card className="mb-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">오늘의 근무</CardTitle>
              <Badge variant={todayShift.checkedIn ? 'default' : 'outline'} className="gap-1">
                {todayShift.checkedIn ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    출근 완료
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    출근 전
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{todayShift.dayOfWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {todayShift.startTime} - {todayShift.endTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">{todayShift.location}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{todayShift.address}</p>
              </div>
            </div>

            {!todayShift.checkedIn && (
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
                onClick={() => navigate('/employee/checkin')}
              >
                <QrCode className="w-5 h-5 mr-2" />
                QR 체크인하기
              </Button>
            )}

            {todayShift.checkedIn && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-medium">출근 완료</p>
                    <p className="text-sm">체크인: {todayShift.checkInTime}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3 px-1">빠른 메뉴</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Shifts */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">다가오는 근무</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/employee/schedule')}
              >
                전체보기
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingShifts.map((shift, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">{shift.day}</p>
                    <p className="text-lg font-bold">{shift.date.split('-')[2]}</p>
                  </div>
                  <div>
                    <p className="font-medium">{shift.time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{shift.location}</p>
                  </div>
                </div>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  notification.read
                    ? 'bg-gray-50 dark:bg-gray-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="mt-0.5">
                  {notification.type === 'warning' && (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                  {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
                  {notification.type === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                )}
              </div>
            ))}
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
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
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

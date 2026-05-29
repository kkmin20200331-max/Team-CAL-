import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Home, Calendar, QrCode, FileText, UserPlus,
  Wallet, MessageSquare, Clock, Bell,
  ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

const toDateStr = (date: Date) => date.toISOString().split('T')[0];

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
};

const getDayOfWeek = (dateStr: string) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
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
  const [shifts, setShifts] = useState<ShiftVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth/login');
      return;
    }
    const user: UserInfo = JSON.parse(userStr);
    setCurrentUser(user);

    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const fetchShifts = async () => {
      try {
        const res = await API.get('/shift/staff', {
          params: {
            user_id: user.id,
            start_date: toDateStr(today),
            end_date: toDateStr(twoWeeksLater),
          },
        });
        setShifts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('근무 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  const todayStr = toDateStr(new Date());
  const todayShiftData = shifts.find(s => toDateStr(new Date(s.work_date)) === todayStr);
  const upcomingShifts = shifts
      .filter(s => toDateStr(new Date(s.work_date)) > todayStr)
      .slice(0, 4);

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  const thisWeekShifts = shifts.filter(s => {
    const d = new Date(s.work_date);
    return d >= thisWeekStart && d <= thisWeekEnd;
  });

  const totalHours = Math.round(
      thisWeekShifts.reduce((sum, s) => {
        const diff = new Date(s.end_at).getTime() - new Date(s.start_at).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0)
  );
  const completedShifts = thisWeekShifts.filter(s => s.status === 'COMPLETED').length;

  // TODO: API 호출로 교체
  const notifications = [
    { id: 1, type: 'info', message: '다음 주 근무표가 확정되었습니다', time: '10분 전', read: false },
    { id: 2, type: 'warning', message: '보건증 갱신 기한이 7일 남았습니다', time: '1시간 전', read: false },
    { id: 3, type: 'success', message: '대타 신청이 승인되었습니다', time: '3시간 전', read: true },
  ];

  const quickActions = [
    { icon: QrCode, label: 'QR 체크인', path: '/employee/checkin', color: 'bg-blue-500' },
    { icon: Calendar, label: '내 근무표', path: '/employee/schedule', color: 'bg-purple-500' },
    { icon: FileText, label: '휴가 신청', path: '/employee/leave', color: 'bg-green-500' },
    { icon: UserPlus, label: '대타 구하기', path: '/employee/substitute', color: 'bg-orange-500' },
    { icon: Wallet, label: '급여 조회', path: '/employee/payroll', color: 'bg-pink-500' },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', color: 'bg-indigo-500' },
  ];

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: true },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false },
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
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarFallback className="bg-white text-blue-600 font-bold">
                  {currentUser?.name?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{currentUser?.name ?? '직원'}</h1>
                <p className="text-blue-100 text-sm">{currentUser?.role ?? ''}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white relative" onClick={() => {}}>
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
              <p className="text-2xl font-bold mt-1">{totalHours}시간</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-blue-100">완료/전체</p>
              <p className="text-2xl font-bold mt-1">{completedShifts}/{thisWeekShifts.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-blue-100">예상 급여</p>
              <p className="text-xl font-bold mt-1">-</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4">
          {/* Today's Shift */}
          <Card className="mb-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">오늘의 근무</CardTitle>
                <Badge variant={todayShiftData ? 'default' : 'outline'} className="gap-1">
                  <Clock className="w-3 h-3" />
                  {todayShiftData ? '근무 있음' : '근무 없음'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayShiftData ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{getDayOfWeek(todayShiftData.work_date)}요일</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold">
                    {formatTime(todayShiftData.start_at)} - {formatTime(todayShiftData.end_at)}
                  </span>
                    </div>
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        size="lg"
                        onClick={() => navigate('/employee/checkin')}
                    >
                      <QrCode className="w-5 h-5 mr-2" />
                      QR 체크인하기
                    </Button>
                  </>
              ) : (
                  <p className="text-center text-gray-400 py-4">오늘은 근무가 없습니다 🎉</p>
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
                <Button variant="ghost" size="sm" onClick={() => navigate('/employee/schedule')}>
                  전체보기 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingShifts.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">예정된 근무가 없습니다</p>
              ) : (
                  upcomingShifts.map((shift, index) => (
                      <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600">{getDayOfWeek(shift.work_date)}</p>
                            <p className="text-lg font-bold">{new Date(shift.work_date).getDate()}</p>
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
                            </p>
                            <p className="text-sm text-gray-500">{shift.status}</p>
                          </div>
                        </div>
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">알림</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((notification) => (
                  <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                          notification.read
                              ? 'bg-gray-50 dark:bg-gray-800'
                              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      }`}
                  >
                    <div className="mt-0.5">
                      {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                      {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
                      {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                  </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
import { useState, useEffect, useMemo } from 'react';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  History
} from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const getTimePart = (s: string) => {
  if (!s) return '';
  const t = s.includes('T') ? s.split('T')[1] : s.split(' ')[1];
  return t ? t.substring(0, 5) : '';
};

const getDatePart = (s: string) =>
  !s ? '' : s.includes('T') ? s.split('T')[0] : s.split(' ')[0];

const calcHours = (start: string, end: string) => {
  const getMin = (s: string) => {
    const t = s.includes('T') ? s.split('T')[1] : s.split(' ')[1];
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  return Math.max(0, (getMin(end) - getMin(start)) / 60);
};

const DAY = ['일', '월', '화', '수', '목', '금', '토'];
const getDayName = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return DAY[new Date(y, m - 1, dd).getDay()];
};

export default function QRCheckIn() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const storeName = localStorage.getItem('store_name') || '매장';

  const [isScanning, setIsScanning] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [recentShifts, setRecentShifts] = useState<ShiftVO[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  // 실시간 시계
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 오늘의 근무 조회
  useEffect(() => {
    if (!user.id) return;
    const today = toDateStr(new Date());
    API.get('/shift/staff', { params: { user_id: user.id, start_date: today, end_date: today } })
      .then(res => setTodayShifts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingToday(false));
  }, [user.id]);

  // 최근 14일 기록 조회
  useEffect(() => {
    if (!user.id) return;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    API.get('/shift/staff', {
      params: { user_id: user.id, start_date: toDateStr(twoWeeksAgo), end_date: toDateStr(yesterday) }
    })
      .then(res =>
        setRecentShifts(
          (Array.isArray(res.data) ? res.data : [])
            .filter((s: ShiftVO) => s.status !== 'VACANT' && s.status !== 'CANCELLED')
            .slice(0, 5)
        )
      )
      .catch(() => {});
  }, [user.id]);

  // 오늘 유효한 근무 (VACANT, CANCELLED 제외)
  const todayShift = todayShifts.find(
    s => s.status !== 'VACANT' && s.status !== 'CANCELLED'
  ) ?? null;

  const getTimeStatus = () => {
    if (!todayShift) return null;
    const startTime = getTimePart(todayShift.start_at);
    if (!startTime) return null;

    const now = currentTime;
    const scheduled = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    scheduled.setHours(hours, minutes, 0);

    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / 60000);

    if (diffMinutes < -10) return { status: 'early', text: '출근 시간 전입니다', color: 'text-gray-600' };
    if (diffMinutes <= 5) return { status: 'ontime', text: '정시 출근', color: 'text-green-600' };
    if (diffMinutes <= 30) return { status: 'late', text: `${diffMinutes}분 지각`, color: 'text-orange-600' };
    return { status: 'verylate', text: `${diffMinutes}분 지각`, color: 'text-red-600' };
  };

  const timeStatus = getTimeStatus();

  const handleScan = () => {
    setIsScanning(true);
    setCheckInStatus('loading');
    setTimeout(() => {
      setCheckInStatus('success');
      setIsScanning(false);
    }, 2000);
  };

  const handleManualCheckIn = () => {
    setCheckInStatus('loading');
    setTimeout(() => setCheckInStatus('success'), 1000);
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: true },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">QR 체크인</h1>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-blue-100" />
            <span className="text-lg font-mono text-blue-100">
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4">

        {/* ── 오늘의 근무 ── */}
        <Card className="mb-4 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">오늘의 근무</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingToday ? (
              <p className="text-sm text-gray-400 text-center py-2">불러오는 중...</p>
            ) : !todayShift ? (
              <div className="flex items-center gap-2 text-gray-500 py-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">오늘 예정된 근무가 없습니다</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-xl font-bold">
                      {getTimePart(todayShift.start_at)} - {getTimePart(todayShift.end_at)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {calcHours(todayShift.start_at, todayShift.end_at).toFixed(1)}시간
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{storeName}</span>
                </div>

                {timeStatus && (
                  <div className={`flex items-center gap-2 font-medium ${timeStatus.color}`}>
                    <AlertCircle className="w-5 h-5" />
                    <span>{timeStatus.text}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── 체크인 상태 ── */}
        {checkInStatus === 'idle' && (
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="relative mb-6">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl flex items-center justify-center border-4 border-dashed border-blue-300 dark:border-blue-700">
                  {isScanning ? (
                    <div className="text-center">
                      <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-blue-600 font-medium">QR 코드 스캔 중...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        매장의 QR 코드를 스캔하세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  size="lg"
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  QR 코드 스캔하기
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManualCheckIn}
                  disabled={isScanning}
                >
                  수동 체크인
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {checkInStatus === 'loading' && (
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertDescription>
              <p className="font-medium">체크인 처리 중...</p>
            </AlertDescription>
          </Alert>
        )}

        {checkInStatus === 'success' && (
          <Card className="mb-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  출근 체크인 완료!
                </h3>
                <p className="text-green-600 dark:text-green-500 mb-4">
                  {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 체크인되었습니다
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">예정 시간</p>
                    <p className="text-lg font-bold">
                      {todayShift ? getTimePart(todayShift.start_at) : '-'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">실제 시간</p>
                    <p className="text-lg font-bold text-green-600">
                      {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/employee/home')}
                  >
                    홈으로 돌아가기
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCheckInStatus('idle')}
                  >
                    다시 체크인
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {checkInStatus === 'error' && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-600" />
            <AlertDescription>
              <p className="font-medium text-red-700 dark:text-red-400">체크인 실패</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                QR 코드를 인식하지 못했습니다. 다시 시도해주세요.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setCheckInStatus('idle')}
              >
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── 체크인 안내 ── */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">체크인 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { n: 1, title: '매장 입구의 QR 코드 찾기', desc: '출입구 또는 직원 공간에 비치된 QR 코드를 찾으세요' },
              { n: 2, title: 'QR 코드 스캔', desc: '스캔 버튼을 눌러 카메라로 QR 코드를 스캔하세요' },
              { n: 3, title: '체크인 완료', desc: '자동으로 출근이 기록됩니다' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">{n}</span>
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── 최근 근무 기록 ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              <CardTitle className="text-lg">최근 근무 기록</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentShifts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">최근 근무 기록이 없습니다</p>
            ) : (
              recentShifts.map((shift, index) => {
                const d = getDatePart(shift.work_date);
                const hours = calcHours(shift.start_at, shift.end_at);
                const startTime = getTimePart(shift.start_at);
                const endTime = getTimePart(shift.end_at);
                return (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-center min-w-[32px]">
                          <p className="text-xs text-gray-500">{getDayName(d)}</p>
                          <p className="font-bold">{d.split('-')[2]}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                        <div>
                          <p className="text-sm font-medium">
                            {startTime} - {endTime}
                          </p>
                          <p className="text-xs text-gray-500">
                            {d.slice(0, 7).replace('-', '.')} · {storeName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {hours.toFixed(1)}h
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 하단 네비 ── */}
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

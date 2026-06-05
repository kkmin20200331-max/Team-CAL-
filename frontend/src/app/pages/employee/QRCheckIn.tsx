import { useState, useEffect } from 'react';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import { useNavigate } from 'react-router';
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

export default function QRCheckIn() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayShift = {
    date: '2024-05-19',
    startTime: '09:00',
    endTime: '15:00',
    location: '컴포즈 미금점',
    address: '경기도 성남시 분당구 미금로 123',
    checkedIn: false,
    checkInTime: null,
    checkOutTime: null,
    expectedHours: 6
  };

  const checkInHistory = [
    {
      date: '2024-05-17',
      day: '금',
      checkIn: '12:03',
      checkOut: '18:05',
      scheduledIn: '12:00',
      scheduledOut: '18:00',
      hours: 6.03,
      status: 'completed'
    },
    {
      date: '2024-05-15',
      day: '수',
      checkIn: '16:58',
      checkOut: '21:56',
      scheduledIn: '17:00',
      scheduledOut: '22:00',
      hours: 4.97,
      status: 'completed'
    },
    {
      date: '2024-05-13',
      day: '월',
      checkIn: '11:55',
      checkOut: '17:58',
      scheduledIn: '12:00',
      scheduledOut: '18:00',
      hours: 6.05,
      status: 'completed'
    }
  ];

  const handleScan = () => {
    setIsScanning(true);
    setCheckInStatus('loading');

    // Simulate QR code scan
    setTimeout(() => {
      // Simulate successful check-in
      setCheckInStatus('success');
      setIsScanning(false);
    }, 2000);
  };

  const handleManualCheckIn = () => {
    setCheckInStatus('loading');
    setTimeout(() => {
      setCheckInStatus('success');
    }, 1000);
  };

  const getTimeStatus = () => {
    const now = currentTime;
    const scheduled = new Date();
    const [hours, minutes] = todayShift.startTime.split(':');
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0);

    const diff = now.getTime() - scheduled.getTime();
    const diffMinutes = Math.floor(diff / 60000);

    if (diffMinutes < -10) return { status: 'early', text: '출근 시간 전입니다', color: 'text-gray-600' };
    if (diffMinutes <= 5) return { status: 'ontime', text: '정시 출근', color: 'text-green-600' };
    if (diffMinutes <= 30) return { status: 'late', text: `${diffMinutes}분 지각`, color: 'text-orange-600' };
    return { status: 'verylate', text: `${diffMinutes}분 지각`, color: 'text-red-600' };
  };

  const timeStatus = getTimeStatus();

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: true },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
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
        {/* Today's Shift Info */}
        <Card className="mb-4 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">오늘의 근무</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold">
                  {todayShift.startTime} - {todayShift.endTime}
                </span>
              </div>
              <Badge variant="secondary">{todayShift.expectedHours}시간</Badge>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">{todayShift.location}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{todayShift.address}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 font-medium ${timeStatus.color}`}>
              <AlertCircle className="w-5 h-5" />
              <span>{timeStatus.text}</span>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Status */}
        {checkInStatus === 'idle' && (
          <Card className="mb-4">
            <CardContent className="p-6">
              {/* QR Scanner Area */}
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

              {/* Action Buttons */}
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

        {/* Loading Status */}
        {checkInStatus === 'loading' && (
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertDescription>
              <p className="font-medium">체크인 처리 중...</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Status */}
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
                    <p className="text-lg font-bold">{todayShift.startTime}</p>
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

        {/* Error Status */}
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

        {/* Check-in Instructions */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">체크인 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-xs">1</span>
              </div>
              <div>
                <p className="font-medium">매장 입구의 QR 코드 찾기</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  출입구 또는 직원 공간에 비치된 QR 코드를 찾으세요
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-xs">2</span>
              </div>
              <div>
                <p className="font-medium">QR 코드 스캔</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  스캔 버튼을 눌러 카메라로 QR 코드를 스캔하세요
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-xs">3</span>
              </div>
              <div>
                <p className="font-medium">체크인 완료</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  자동으로 출근이 기록됩니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              <CardTitle className="text-lg">최근 출퇴근 기록</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {checkInHistory.map((record, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{record.day}</p>
                      <p className="font-bold">{record.date.split('-')[2]}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                    <div>
                      <p className="text-sm font-medium">
                        {record.checkIn} - {record.checkOut}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        예정: {record.scheduledIn} - {record.scheduledOut}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {record.hours.toFixed(1)}h
                    </Badge>
                  </div>
                </div>

                {/* Attendance Status */}
                <div className="flex items-center gap-2 text-xs">
                  {record.checkIn <= record.scheduledIn ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      정시 출근
                    </span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      지각
                    </span>
                  )}
                </div>
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

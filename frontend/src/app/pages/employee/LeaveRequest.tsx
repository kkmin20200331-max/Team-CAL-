import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Home,
  Calendar as CalendarIcon,
  QrCode,
  Wallet,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const leaveHistory = [
    {
      id: 1,
      type: '연차',
      startDate: '2024-05-25',
      endDate: '2024-05-25',
      days: 1,
      reason: '개인 사유',
      status: 'pending',
      submittedDate: '2024-05-18',
      approver: '홍길동 매니저'
    },
    {
      id: 2,
      type: '반차',
      startDate: '2024-05-10',
      endDate: '2024-05-10',
      days: 0.5,
      reason: '병원 진료',
      status: 'approved',
      submittedDate: '2024-05-08',
      approvedDate: '2024-05-09',
      approver: '홍길동 매니저'
    },
    {
      id: 3,
      type: '병가',
      startDate: '2024-04-28',
      endDate: '2024-04-29',
      days: 2,
      reason: '몸살 감기',
      status: 'approved',
      submittedDate: '2024-04-27',
      approvedDate: '2024-04-27',
      approver: '홍길동 매니저'
    },
    {
      id: 4,
      type: '연차',
      startDate: '2024-04-15',
      endDate: '2024-04-15',
      days: 1,
      reason: '가족 행사',
      status: 'rejected',
      submittedDate: '2024-04-10',
      rejectedDate: '2024-04-11',
      approver: '홍길동 매니저',
      rejectReason: '해당 날짜에 최소 인원 확보 필요'
    }
  ];

  const leaveBalance = {
    annual: { total: 15, used: 3, remaining: 12 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 0, remaining: 5 }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !reason) {
      setSubmitStatus('error');
      return;
    }

    // Simulate submission
    setTimeout(() => {
      setSubmitStatus('success');
      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setLeaveType('');
        setStartDate(undefined);
        setEndDate(undefined);
        setReason('');
      }, 2000);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            승인
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="gap-1 bg-yellow-500">
            <Clock className="w-3 h-3" />
            대기중
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            거부
          </Badge>
        );
      default:
        return null;
    }
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: CalendarIcon, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">휴가 신청</h1>
        <p className="text-green-100 text-sm">연차 및 휴가를 신청하고 관리하세요</p>
      </div>

      <div className="px-4 py-4">
        {/* Leave Balance */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">연차</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {leaveBalance.annual.remaining}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                / {leaveBalance.annual.total}일
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">병가</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {leaveBalance.sick.remaining}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                / {leaveBalance.sick.total}일
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">개인</p>
              <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                {leaveBalance.personal.remaining}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                / {leaveBalance.personal.total}일
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Request Form */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              휴가 신청서
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label>휴가 종류</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder="휴가 종류를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">연차 (Annual Leave)</SelectItem>
                    <SelectItem value="half">반차 (Half Day)</SelectItem>
                    <SelectItem value="sick">병가 (Sick Leave)</SelectItem>
                    <SelectItem value="personal">개인 사유 (Personal Leave)</SelectItem>
                    <SelectItem value="family">경조사 (Family Event)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작 날짜</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>종료 날짜</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>사유</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="휴가 사유를 입력하세요"
                  rows={4}
                />
              </div>

              {/* Submit Status */}
              {submitStatus === 'success' && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    휴가 신청이 제출되었습니다. 승인을 기다려주세요.
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === 'error' && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    모든 필수 항목을 입력해주세요.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                신청서 제출
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">신청 내역</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaveHistory.map((leave) => (
              <div
                key={leave.id}
                className={`p-4 rounded-lg border-2 ${
                  leave.status === 'pending'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : leave.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{leave.type}</Badge>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="font-medium">
                      {leave.startDate === leave.endDate
                        ? leave.startDate
                        : `${leave.startDate} ~ ${leave.endDate}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {leave.days}일
                    </p>
                  </div>
                  {leave.status === 'pending' && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">사유</p>
                    <p className="font-medium">{leave.reason}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">승인자</p>
                      <p className="font-medium text-xs">{leave.approver}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">신청일</p>
                      <p className="font-medium text-xs">{leave.submittedDate}</p>
                    </div>
                  </div>

                  {leave.status === 'approved' && leave.approvedDate && (
                    <div className="bg-green-100 dark:bg-green-900/40 rounded p-2">
                      <p className="text-xs text-green-700 dark:text-green-400">
                        승인일: {leave.approvedDate}
                      </p>
                    </div>
                  )}

                  {leave.status === 'rejected' && leave.rejectReason && (
                    <div className="bg-red-100 dark:bg-red-900/40 rounded p-2">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        거부 사유
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        {leave.rejectReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              휴가 신청 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p>• 휴가는 최소 3일 전에 신청해주세요</p>
            <p>• 반차는 전일 18시까지 신청 가능합니다</p>
            <p>• 병가는 진단서 제출이 필요할 수 있습니다</p>
            <p>• 승인 여부는 알림으로 안내됩니다</p>
            <p>• 거부된 신청은 수정 후 재신청 가능합니다</p>
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
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
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

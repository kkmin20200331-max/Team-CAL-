import { useState } from 'react';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  CreditCard,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function EmployeePayroll() {
  const navigate = useNavigate();
  const [weeklyPayDialogOpen, setWeeklyPayDialogOpen] = useState(false);

  const currentPeriod = {
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    month: '5월',
    workedHours: 72,
    expectedHours: 88,
    completedShifts: 12,
    totalShifts: 15,
    basePay: 720000,
    weekendPay: 110000,
    overtimePay: 50000,
    deductions: 38000,
    estimatedTotal: 842000
  };

  const weeklyPayAvailable = {
    available: true,
    workedHours: 24,
    amount: 240000,
    lastRequestDate: '2024-05-12',
    eligibleDate: '2024-05-19'
  };

  const paymentHistory = [
    {
      id: 1,
      period: '2024년 4월',
      payDate: '2024-05-10',
      totalHours: 88,
      basePay: 880000,
      bonuses: 120000,
      deductions: 50000,
      netPay: 950000,
      status: 'paid'
    },
    {
      id: 2,
      period: '2024년 3월',
      payDate: '2024-04-10',
      totalHours: 84,
      basePay: 840000,
      bonuses: 100000,
      deductions: 47000,
      netPay: 893000,
      status: 'paid'
    },
    {
      id: 3,
      period: '2024년 2월',
      payDate: '2024-03-10',
      totalHours: 80,
      basePay: 800000,
      bonuses: 90000,
      deductions: 44500,
      netPay: 845500,
      status: 'paid'
    }
  ];

  const weeklyPayHistory = [
    { date: '2024-05-12', amount: 240000, hours: 24, status: 'approved' },
    { date: '2024-05-05', amount: 200000, hours: 20, status: 'approved' },
    { date: '2024-04-28', amount: 180000, hours: 18, status: 'approved' }
  ];

  const monthlyTrend = [
    { month: '1월', hours: 78, pay: 820000 },
    { month: '2월', hours: 80, pay: 845500 },
    { month: '3월', hours: 84, pay: 893000 },
    { month: '4월', hours: 88, pay: 950000 },
    { month: '5월', hours: 72, pay: 842000 }
  ];

  const handleWeeklyPayRequest = () => {
    setWeeklyPayDialogOpen(true);
  };

  const confirmWeeklyPay = () => {
    // Handle weekly pay request
    setWeeklyPayDialogOpen(false);
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: true },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">급여 조회</h1>
          <p className="text-blue-100 text-sm mt-1">급여 내역과 주급을 확인하세요</p>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4">
        {/* Current Period Summary */}
        <Card className="mb-4 border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{currentPeriod.month} 예상 급여</span>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">예상 총 급여</p>
              <p className="text-4xl font-bold text-pink-700 dark:text-pink-400">
                {currentPeriod.estimatedTotal.toLocaleString()}원
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">기본급</span>
                <span className="font-medium">{currentPeriod.basePay.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">주말 수당</span>
                <span className="font-medium text-green-600">
                  +{currentPeriod.weekendPay.toLocaleString()}원
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">초과 근무</span>
                <span className="font-medium text-green-600">
                  +{currentPeriod.overtimePay.toLocaleString()}원
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">공제액</span>
                <span className="font-medium text-red-600">
                  -{currentPeriod.deductions.toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>근무 시간</span>
                    <span className="font-medium">
                      {currentPeriod.workedHours} / {currentPeriod.expectedHours}시간
                    </span>
                  </div>
                  <Progress
                    value={(currentPeriod.workedHours / currentPeriod.expectedHours) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>완료한 근무</span>
                    <span className="font-medium">
                      {currentPeriod.completedShifts} / {currentPeriod.totalShifts}일
                    </span>
                  </div>
                  <Progress
                    value={(currentPeriod.completedShifts / currentPeriod.totalShifts) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Pay Request */}
        {weeklyPayAvailable.available && (
          <Card className="mb-4 border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">주급 신청 가능</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    이번 주 근무한 {weeklyPayAvailable.workedHours}시간에 대한 주급을 신청할 수
                    있습니다
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">신청 가능 금액</p>
                      <p className="text-2xl font-bold text-green-600">
                        {weeklyPayAvailable.amount.toLocaleString()}원
                      </p>
                    </div>
                    <Button
                      onClick={handleWeeklyPayRequest}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      주급 신청
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">급여 내역</TabsTrigger>
            <TabsTrigger value="weekly">주급 내역</TabsTrigger>
            <TabsTrigger value="trends">통계</TabsTrigger>
          </TabsList>

          {/* Payment History */}
          <TabsContent value="history" className="space-y-3">
            {paymentHistory.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{payment.period}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        지급일: {payment.payDate}
                      </p>
                    </div>
                    <Badge className="gap-1 bg-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      지급 완료
                    </Badge>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">실수령액</span>
                      <span className="text-2xl font-bold text-green-600">
                        {payment.netPay.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        기본급 ({payment.totalHours}시간)
                      </span>
                      <span className="font-medium">{payment.basePay.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">수당</span>
                      <span className="font-medium text-green-600">
                        +{payment.bonuses.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">공제</span>
                      <span className="font-medium text-red-600">
                        -{payment.deductions.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-3" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    급여명세서 다운로드
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Weekly Pay History */}
          <TabsContent value="weekly" className="space-y-3">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                주급은 매주 일요일에 신청 가능하며, 승인 후 1-2일 내 지급됩니다.
              </AlertDescription>
            </Alert>

            {weeklyPayHistory.map((record, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{record.date}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {record.hours}시간 근무
                      </p>
                    </div>
                    <Badge className="gap-1 bg-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      승인됨
                    </Badge>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">지급액</span>
                      <span className="text-xl font-bold text-green-600">
                        {record.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  월별 근무 시간
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  월별 급여 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pay" stroke="#a855f7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="text-lg">급여 통계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">월 평균 급여</p>
                    <p className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                      {(monthlyTrend.reduce((acc, m) => acc + m.pay, 0) / monthlyTrend.length / 10000).toFixed(0)}만원
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">월 평균 시간</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {(monthlyTrend.reduce((acc, m) => acc + m.hours, 0) / monthlyTrend.length).toFixed(0)}시간
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-pink-200 dark:border-pink-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    5개월 총 수입
                  </p>
                  <p className="text-3xl font-bold text-pink-700 dark:text-pink-400">
                    {(monthlyTrend.reduce((acc, m) => acc + m.pay, 0) / 10000).toFixed(0)}만원
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Weekly Pay Dialog */}
      <Dialog open={weeklyPayDialogOpen} onOpenChange={setWeeklyPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주급 신청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                주급은 승인 후 1-2일 내에 등록된 계좌로 입금됩니다.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">근무 시간</span>
                <span className="font-medium">{weeklyPayAvailable.workedHours}시간</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">시급</span>
                <span className="font-medium">10,000원</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">신청 금액</span>
                  <span className="text-2xl font-bold text-green-600">
                    {weeklyPayAvailable.amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              위 금액으로 주급을 신청하시겠습니까?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeeklyPayDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={confirmWeeklyPay}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              신청하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                item.active
                  ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20'
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

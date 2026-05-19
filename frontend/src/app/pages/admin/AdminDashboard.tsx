import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  FileWarning,
  CalendarDays,
  Menu,
  Home,
  Calendar,
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronRight
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

const customerData = [
  { time: '09:00', customers: 5, staff: 1 },
  { time: '10:00', customers: 8, staff: 1 },
  { time: '11:00', customers: 12, staff: 2 },
  { time: '12:00', customers: 25, staff: 3 },
  { time: '13:00', customers: 28, staff: 3 },
  { time: '14:00', customers: 18, staff: 3 },
  { time: '15:00', customers: 15, staff: 2 },
  { time: '16:00', customers: 12, staff: 2 },
  { time: '17:00', customers: 20, staff: 2 },
  { time: '18:00', customers: 32, staff: 2 },
  { time: '19:00', customers: 28, staff: 2 },
  { time: '20:00', customers: 22, staff: 2 },
];

const todayStaff = [
  { name: '김민수', shift: '09:00-15:00', role: '일반', status: 'checked-in' },
  { name: '이지영', shift: '12:00-18:00', role: '마감가능', status: 'checked-in' },
  { name: '박서준', shift: '12:00-18:00', role: '일반', status: 'checked-in' },
  { name: '최유나', shift: '17:00-22:00', role: '마감가능', status: 'pending' },
  { name: '정태현', shift: '17:00-22:00', role: '일반', status: 'pending' },
];

const alerts = [
  { type: 'warning', message: '금요일 18:00-20:00 고객 수가 평균보다 35% 높습니다', action: '대타 추가 배치 추천' },
  { type: 'danger', message: '보건증 만료 예정: 김민수 (D-7)', action: '갱신 안내' },
  { type: 'info', message: '주급 신청 대기 2건', action: '승인 필요' },
  { type: 'warning', message: '근무표 작성 미완료: 다음주', action: '작성 필요' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { branchId } = useParams();

  const branchNames: { [key: string]: string } = {
    migeum: '컴포즈 미금점',
    sunae: '컴포즈 수내점',
    dongcheon: '컴포즈 동천점'
  };

  const currentBranch = branchNames[branchId || 'migeum'];

  const menuItems = [
    { icon: Home, label: '대시보드', path: `/admin/dashboard/${branchId}`, active: true },
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/weekly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
    { icon: Settings, label: '설정', path: `/admin/settings/${branchId}` },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">ShiftOps AI</h1>
          </div>

          {/* Branch Info */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/admin/branch-selection')}
            >
              <span className="truncate">{currentBranch}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">메인 대시보드</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 근무 인원
                </CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8명</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  출근 완료 3명
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  현재 매장 인원
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12명</div>
                <p className="text-xs text-green-600 mt-1">
                  ↑ 보통 수준
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  대타 필요
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">2건</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  긴급 1건 포함
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 예상 인건비
                </CardTitle>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₩720,000</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  평균 대비 +5%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Analytics Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>실시간 매장 인원 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="customers"
                      stroke="#3b82f6"
                      name="고객 수"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="staff"
                      stroke="#10b981"
                      name="근무 인원"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alerts Panel */}
            <Card>
              <CardHeader>
                <CardTitle>오늘의 운영 알림</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'danger'
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : alert.type === 'warning'
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{alert.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Today's Staff and AI Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Today's Staff */}
            <Card>
              <CardHeader>
                <CardTitle>오늘 근무자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayStaff.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {staff.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{staff.shift}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{staff.role}</Badge>
                        <Badge className={
                          staff.status === 'checked-in'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }>
                          {staff.status === 'checked-in' ? '출근 완료' : '출근 전'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  AI 운영 추천
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">
                    인력 배치 추천
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    금요일 18:00~20:00 고객 수가 평균보다 35% 높습니다.
                    해당 시간대 대타 1명 추가 배치를 권장합니다.
                  </p>
                  <Button size="sm" className="w-full">
                    대타 모집하기
                  </Button>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-2">메뉴 추천</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    14:00~16:00에 20대 고객 방문 비율이 높습니다.
                    디저트 세트 프로모션을 추천합니다.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-2">유휴 시간 업무</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    월요일 15:00~17:00는 저혼잡 시간대입니다.
                    재고 정리와 청소 체크리스트 배정을 추천합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/schedule/weekly/${branchId}`)}
            >
              <CalendarDays className="w-6 h-6" />
              <span>근무표 보기</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/substitute/${branchId}`)}
            >
              <UserPlus className="w-6 h-6" />
              <span>대타 모집</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/analytics/${branchId}`)}
            >
              <BarChart3 className="w-6 h-6" />
              <span>고객 분석</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate(`/admin/payroll/${branchId}`)}
            >
              <Wallet className="w-6 h-6" />
              <span>급여 관리</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

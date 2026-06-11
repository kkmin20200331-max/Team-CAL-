import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
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
  Camera,
  Settings,
  ChevronRight,
  Store,
  Loader2
} from 'lucide-react';
import ProfilePanel from '../../components/admin/ProfilePanel';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

// ── 유틸 ──
const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** "yyyy-MM-dd HH:mm:ss" → "HH:mm" */
const fmt = (s: string) => {
  if (!s) return '';
  const part = s.includes(' ') ? s.split(' ')[1] : s;
  return part.substring(0, 5);
};

/** 근무 시간 계산 (시간) */
const calcHours = (startAt: string, endAt: string): number => {
  const t1 = (startAt?.split(' ')[1] || '00:00:00').split(':').map(Number);
  const t2 = (endAt?.split(' ')[1] || '00:00:00').split(':').map(Number);
  return Math.max(0, (t2[0] * 60 + t2[1] - t1[0] * 60 - t1[1]) / 60);
};

// ── 인터페이스 ──
interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface UserVO {
  id: string;
  name: string;
  role: string;
  username: string;
}

interface PayInfo {
  pay_type: string;   // 'HOURLY' | 'MONTHLY'
  pay_amount: number;
}

// 실시간 매장 인원 - 고객 DB 없음, 목업 유지
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { branchId } = useParams();

  const currentBranch = localStorage.getItem('store_name') || '지점 선택';

  // ── 상태 ──
  const [loading, setLoading] = useState(true);
  const [todayShifts, setTodayShifts] = useState<ShiftVO[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, UserVO>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [payMap, setPayMap] = useState<Record<string, PayInfo>>({});
  const [substituteCount, setSubstituteCount] = useState(0);

  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        const today = toDateStr(new Date());

        const [shiftRes, userRes, subRes] = await Promise.allSettled([
          API.get('/shift', { params: { store_id: branchId, start_date: today, end_date: today } }),
          API.get('/users', { params: { store_id: branchId } }),
          API.get('/substitute', { params: { store_id: branchId } }),
        ]);

        // 오늘 근무표
        const shifts: ShiftVO[] =
          shiftRes.status === 'fulfilled' && Array.isArray(shiftRes.value.data)
            ? shiftRes.value.data : [];
        setTodayShifts(shifts);

        // 직원 맵
        const users: UserVO[] =
          userRes.status === 'fulfilled' && Array.isArray(userRes.value.data)
            ? userRes.value.data : [];
        setTotalEmployees(users.length);
        const empMap: Record<string, UserVO> = {};
        users.forEach(u => { empMap[u.id] = u; });
        setEmployeeMap(empMap);

        // 대타 오픈 건수
        const subs =
          subRes.status === 'fulfilled' && Array.isArray(subRes.value.data)
            ? subRes.value.data : [];
        setSubstituteCount(
          subs.filter((s: any) => (s.status || '').toLowerCase() === 'open').length
        );

        // 시급/급여 조회 (오늘 근무자 한정)
        const uniqueIds = [...new Set(shifts.map(s => s.user_id))];
        if (uniqueIds.length > 0) {
          const payResults = await Promise.allSettled(
            uniqueIds.map(uid =>
              API.get('/store_member/pay', { params: { user_id: uid, store_id: branchId } })
                .then(r => ({ uid, data: r.data as PayInfo }))
            )
          );
          const pm: Record<string, PayInfo> = {};
          payResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value.data) pm[r.value.uid] = r.value.data;
          });
          setPayMap(pm);
        }
      } catch (err) {
        console.error('[AdminDashboard] 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId]);

  // ── 파생 값 ──
  const checkedIn = todayShifts.filter(s =>
    (s.status || '').toUpperCase() === 'CHECKED_IN'
  ).length;

  const estimatedPay = todayShifts.reduce((sum, shift) => {
    const pay = payMap[shift.user_id];
    if (!pay || pay.pay_type !== 'HOURLY') return sum;
    return sum + pay.pay_amount * calcHours(shift.start_at, shift.end_at);
  }, 0);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_IN') return '출근 완료';
    if (s === 'CHECKED_OUT') return '퇴근';
    if (s === 'ABSENT') return '결근';
    return '출근 전';
  };

  const getStatusClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_IN') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (s === 'ABSENT') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (s === 'CHECKED_OUT') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const menuItems = [
    { icon: Home, label: '대시보드', path: `/admin/dashboard/${branchId}`, active: true },
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
    { icon: Camera, label: 'CCTV 분석', path: `/admin/cctv/${branchId}` },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">ShiftOps AI</h1>
          </div>
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
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
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
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                })}
              </p>
            </div>
          </div>
          <ProfilePanel />
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 오늘 근무 인원 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 근무 인원
                </CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{todayShifts.length}명</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      출근 완료 {checkedIn}명
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 등록 직원 수 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  등록 직원 수
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{totalEmployees}명</div>
                    <p className="text-xs text-green-600 mt-1">이 지점 전체 직원</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 대타 모집 중 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  대타 모집 중
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${substituteCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {substituteCount}건
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {substituteCount > 0 ? '지원자를 기다리는 중' : '모집 중인 공고 없음'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 오늘 예상 인건비 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  오늘 예상 인건비
                </CardTitle>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ₩{estimatedPay.toLocaleString('ko-KR')}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      시급제 직원 기준
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 실시간 매장 인원 추이 (목업 유지 - 고객 DB 미연결) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  실시간 매장 인원 추이
                  <span className="text-xs font-normal text-gray-400">(샘플 데이터)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke="#3b82f6" name="고객 수" strokeWidth={2} />
                    <Line type="monotone" dataKey="staff" stroke="#10b981" name="근무 인원" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 오늘의 운영 알림 */}
            <Card>
              <CardHeader>
                <CardTitle>오늘의 운영 알림</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!loading && substituteCount > 0 && (
                  <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                    <p className="text-sm font-medium mb-1">대타 모집 중 {substituteCount}건</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">지원자 확인 필요</p>
                  </div>
                )}
                {!loading && checkedIn < todayShifts.length && todayShifts.length > 0 && (
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <p className="text-sm font-medium mb-1">
                      미출근 {todayShifts.length - checkedIn}명
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">출근 확인 필요</p>
                  </div>
                )}
                {!loading && todayShifts.length === 0 && (
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700">
                    <p className="text-sm font-medium mb-1">오늘 근무 없음</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">근무표를 확인하세요</p>
                  </div>
                )}
                <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                  <p className="text-sm font-medium mb-1">보건증 만료 예정 확인</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">문서 관리에서 확인</p>
                </div>
                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="text-sm font-medium mb-1">다음 주 근무표 작성</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">근무표 관리에서 작성</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── 오늘 근무자 + AI 추천 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* 오늘 근무자 목록 (DB 연결) */}
            <Card>
              <CardHeader>
                <CardTitle>오늘 근무자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : todayShifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    오늘 등록된 근무자가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayShifts.map(shift => {
                      const emp = employeeMap[shift.user_id];
                      const name = emp?.name || '알 수 없음';
                      const startTime = fmt(shift.start_at);
                      const endTime = fmt(shift.end_at);
                      return (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {startTime} ~ {endTime}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusClass(shift.status)}>
                            {getStatusLabel(shift.status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI 운영 추천 */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  AI 운영 추천
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">인력 배치 추천</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    금요일 18:00~20:00 고객 수가 평균보다 35% 높습니다.
                    해당 시간대 대타 1명 추가 배치를 권장합니다.
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/admin/substitute/${branchId}`)}
                  >
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
              onClick={() => navigate(`/admin/schedule/monthly/${branchId}`)}
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
              onClick={() => navigate(`/admin/cctv/${branchId}`)}
            >
              <Camera className="w-6 h-6" />
              <span>CCTV 분석</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

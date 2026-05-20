import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  UserPlus,
  Search,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Filter,
  TrendingUp,
  Star
} from 'lucide-react';

export default function SubstituteList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const availableShifts = [
    {
      id: 1,
      date: '2024-05-22',
      day: '수요일',
      time: '17:00-22:00',
      hours: 5,
      location: '미금점',
      address: '경기도 성남시 분당구 미금로',
      hourlyPay: 10000,
      totalPay: 50000,
      urgency: 'high',
      postedBy: '홍길동 매니저',
      postedDate: '2024-05-19',
      applicants: 3,
      description: '저녁 피크타임 마감 가능자 우대'
    },
    {
      id: 2,
      date: '2024-05-23',
      day: '목요일',
      time: '09:00-15:00',
      hours: 6,
      location: '수내점',
      address: '경기도 성남시 분당구 수내로',
      hourlyPay: 10000,
      totalPay: 60000,
      urgency: 'medium',
      postedBy: '김영희 매니저',
      postedDate: '2024-05-19',
      applicants: 1,
      description: '아침 오픈 근무'
    },
    {
      id: 3,
      date: '2024-05-24',
      day: '금요일',
      time: '12:00-18:00',
      hours: 6,
      location: '미금점',
      address: '경기도 성남시 분당구 미금로',
      hourlyPay: 10000,
      totalPay: 60000,
      urgency: 'medium',
      postedBy: '홍길동 매니저',
      postedDate: '2024-05-18',
      applicants: 2,
      description: '점심~저녁 피크타임'
    },
    {
      id: 4,
      date: '2024-05-25',
      day: '토요일',
      time: '17:00-22:00',
      hours: 5,
      location: '동천점',
      address: '경기도 용인시 수지구 동천로',
      hourlyPay: 11000,
      totalPay: 55000,
      urgency: 'high',
      postedBy: '박철수 매니저',
      postedDate: '2024-05-19',
      applicants: 5,
      description: '주말 저녁 마감 근무, 주말 수당 적용'
    },
    {
      id: 5,
      date: '2024-05-26',
      day: '일요일',
      time: '09:00-15:00',
      hours: 6,
      location: '미금점',
      address: '경기도 성남시 분당구 미금로',
      hourlyPay: 11000,
      totalPay: 66000,
      urgency: 'low',
      postedBy: '홍길동 매니저',
      postedDate: '2024-05-17',
      applicants: 0,
      description: '주말 오픈 근무, 주말 수당 적용'
    }
  ];

  const myApplications = [
    {
      id: 1,
      shiftId: 3,
      date: '2024-05-24',
      day: '금요일',
      time: '12:00-18:00',
      location: '미금점',
      status: 'pending',
      appliedDate: '2024-05-18',
      totalPay: 60000
    },
    {
      id: 2,
      shiftId: 2,
      date: '2024-05-20',
      day: '월요일',
      time: '12:00-18:00',
      location: '수내점',
      status: 'approved',
      appliedDate: '2024-05-15',
      approvedDate: '2024-05-16',
      totalPay: 60000
    },
    {
      id: 3,
      shiftId: 4,
      date: '2024-05-18',
      day: '토요일',
      time: '17:00-22:00',
      location: '동천점',
      status: 'rejected',
      appliedDate: '2024-05-13',
      rejectedDate: '2024-05-14',
      totalPay: 55000,
      rejectReason: '다른 지원자가 선정되었습니다'
    }
  ];

  const stats = {
    totalApplied: 8,
    approved: 5,
    pending: 2,
    totalEarned: 350000
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            급구
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="gap-1 bg-yellow-500">
            <Clock className="w-3 h-3" />
            보통
          </Badge>
        );
      case 'low':
        return <Badge variant="secondary">여유</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            승인됨
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
            거부됨
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleApply = (shift: any) => {
    setSelectedShift(shift);
    setApplyDialogOpen(true);
  };

  const confirmApply = () => {
    // Handle application submission
    setApplyDialogOpen(false);
    setSelectedShift(null);
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">대타 구하기</h1>
        <p className="text-orange-100 text-sm">추가 근무 기회를 찾아보세요</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-orange-100">지원</p>
            <p className="text-lg font-bold">{stats.totalApplied}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-orange-100">승인</p>
            <p className="text-lg font-bold">{stats.approved}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-orange-100">대기</p>
            <p className="text-lg font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xs text-orange-100">수입</p>
            <p className="text-sm font-bold">{(stats.totalEarned / 10000).toFixed(0)}만</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="지점, 날짜 검색..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              모집중 ({availableShifts.length})
            </TabsTrigger>
            <TabsTrigger value="applied">
              내 지원 ({myApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Shifts */}
          <TabsContent value="available" className="space-y-3">
            {availableShifts.map((shift) => (
              <Card key={shift.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs text-gray-600 dark:text-gray-400">{shift.day}</p>
                        <p className="text-2xl font-bold">{shift.date.split('-')[2]}</p>
                      </div>
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="font-bold">{shift.time}</span>
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
                    {getUrgencyBadge(shift.urgency)}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">급여</p>
                          <p className="font-bold text-lg">
                            {shift.totalPay.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">시급</p>
                        <p className="font-medium">{shift.hourlyPay.toLocaleString()}원</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {shift.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>담당: {shift.postedBy}</p>
                      <p className="flex items-center gap-1 mt-1">
                        <UserPlus className="w-3 h-3" />
                        {shift.applicants}명 지원
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApply(shift)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      지원하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* My Applications */}
          <TabsContent value="applied" className="space-y-3">
            {myApplications.map((application) => (
              <Card
                key={application.id}
                className={`${
                  application.status === 'approved'
                    ? 'border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : application.status === 'rejected'
                    ? 'border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {application.day}
                        </p>
                        <p className="text-2xl font-bold">
                          {application.date.split('-')[2]}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="font-bold">{application.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>컴포즈 {application.location}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">급여</p>
                        <p className="font-bold text-lg">
                          {application.totalPay.toLocaleString()}원
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">지원일</p>
                        <p className="text-sm font-medium">{application.appliedDate}</p>
                      </div>
                    </div>
                  </div>

                  {application.status === 'approved' && (
                    <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-2">
                      <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        승인됨 - {application.approvedDate}
                      </p>
                    </div>
                  )}

                  {application.status === 'rejected' && application.rejectReason && (
                    <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-2">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">
                        거부 사유:
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500">
                        {application.rejectReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Performance Card */}
        <Card className="mt-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              이번 달 대타 실적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">승인된 근무</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {stats.approved}회
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">추가 수입</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {(stats.totalEarned / 10000).toFixed(0)}만원
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  승인율: <span className="font-bold">{((stats.approved / stats.totalApplied) * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대타 근무 지원</DialogTitle>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedShift.day}
                    </p>
                    <p className="text-2xl font-bold">{selectedShift.date.split('-')[2]}</p>
                  </div>
                  <div>
                    <p className="font-bold">{selectedShift.time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      컴포즈 {selectedShift.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">급여</span>
                  <span className="text-xl font-bold text-green-600">
                    {selectedShift.totalPay.toLocaleString()}원
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                이 근무에 지원하시겠습니까? 승인 여부는 알림으로 안내됩니다.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={confirmApply}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              지원하기
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
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
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

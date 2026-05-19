import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Store,
  Users,
  AlertCircle,
  Clock,
  FileWarning,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';

const branches = [
  {
    id: 'migeum',
    name: '컴포즈 미금점',
    nameEn: 'Compose Migeum',
    todayStaff: 8,
    currentCustomers: 12,
    congestion: 'normal',
    substituteNeeded: 2,
    leaveRequests: 3,
    healthCertExpiring: 1,
    unreadNotices: 5
  },
  {
    id: 'sunae',
    name: '컴포즈 수내점',
    nameEn: 'Compose Sunae',
    todayStaff: 6,
    currentCustomers: 18,
    congestion: 'high',
    substituteNeeded: 1,
    leaveRequests: 1,
    healthCertExpiring: 0,
    unreadNotices: 2
  },
  {
    id: 'dongcheon',
    name: '컴포즈 동천점',
    nameEn: 'Compose Dongcheon',
    todayStaff: 7,
    currentCustomers: 8,
    congestion: 'low',
    substituteNeeded: 0,
    leaveRequests: 2,
    healthCertExpiring: 2,
    unreadNotices: 3
  }
];

export default function BranchSelection() {
  const navigate = useNavigate();

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'normal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCongestionText = (level: string) => {
    switch (level) {
      case 'high':
        return '혼잡';
      case 'normal':
        return '보통';
      case 'low':
        return '여유';
      default:
        return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">지점 선택</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">관리할 지점을 선택해주세요</p>
            </div>
            <Button
              onClick={() => navigate('/admin/multibranch')}
              variant="outline"
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              전체 지점 통합 보기
            </Button>
          </div>
        </div>
      </div>

      {/* Branch Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/admin/dashboard/${branch.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-blue-600" />
                      {branch.name}
                    </CardTitle>
                    <CardDescription>{branch.nameEn}</CardDescription>
                  </div>
                  <Badge className={getCongestionColor(branch.congestion)}>
                    {getCongestionText(branch.congestion)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">오늘 근무</p>
                      <p className="text-lg font-semibold">{branch.todayStaff}명</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">현재 고객</p>
                      <p className="text-lg font-semibold">{branch.currentCustomers}명</p>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                <div className="space-y-2">
                  {branch.substituteNeeded > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>대타 필요 {branch.substituteNeeded}건</span>
                    </div>
                  )}
                  {branch.leaveRequests > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span>휴무 신청 대기 {branch.leaveRequests}건</span>
                    </div>
                  )}
                  {branch.healthCertExpiring > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <FileWarning className="w-4 h-4" />
                      <span>보건증 만료 예정 {branch.healthCertExpiring}명</span>
                    </div>
                  )}
                  {branch.unreadNotices > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>공지 미확인 {branch.unreadNotices}명</span>
                    </div>
                  )}
                </div>

                <Button className="w-full mt-4" onClick={() => navigate(`/admin/dashboard/${branch.id}`)}>
                  지점 상세 보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

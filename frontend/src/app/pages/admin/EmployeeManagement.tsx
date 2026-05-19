import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  location: string;
  employmentType: '정규직' | '계약직' | '아르바이트';
  status: 'active' | 'inactive' | 'on_leave';
  startDate: string;
  hourlyRate?: number;
  monthlyRate?: number;
  weeklyHours: number;
  totalHoursWorked: number;
  attendanceRate: number;
  emergencyContact: string;
  address: string;
  birthDate: string;
  bankAccount: string;
  taxId: string;
  certifications: string[];
  notes?: string;
}

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data - 직원 목록
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'EMP001',
      name: '김민수',
      phone: '010-1234-5678',
      email: 'kim.minsu@example.com',
      position: '주방장',
      location: '강남점',
      employmentType: '정규직',
      status: 'active',
      startDate: '2023-01-15',
      monthlyRate: 3500000,
      weeklyHours: 40,
      totalHoursWorked: 1560,
      attendanceRate: 98.5,
      emergencyContact: '010-9999-0001',
      address: '서울시 강남구',
      birthDate: '1990-05-20',
      bankAccount: '국민 123-456-789012',
      taxId: '900520-1******',
      certifications: ['조리기능사', '위생사', '식품안전관리사'],
      notes: '우수 직원, 리더십 있음'
    },
    {
      id: 'EMP002',
      name: '이지은',
      phone: '010-2345-6789',
      email: 'lee.jieun@example.com',
      position: '서빙',
      location: '강남점',
      employmentType: '아르바이트',
      status: 'active',
      startDate: '2023-06-01',
      hourlyRate: 12000,
      weeklyHours: 20,
      totalHoursWorked: 780,
      attendanceRate: 96.2,
      emergencyContact: '010-9999-0002',
      address: '서울시 서초구',
      birthDate: '2000-08-15',
      bankAccount: '신한 987-654-321098',
      taxId: '000815-2******',
      certifications: ['위생교육 수료']
    },
    {
      id: 'EMP003',
      name: '박철수',
      phone: '010-3456-7890',
      email: 'park.cs@example.com',
      position: '매니저',
      location: '홍대점',
      employmentType: '정규직',
      status: 'active',
      startDate: '2022-03-01',
      monthlyRate: 3200000,
      weeklyHours: 40,
      totalHoursWorked: 3120,
      attendanceRate: 99.1,
      emergencyContact: '010-9999-0003',
      address: '서울시 마포구',
      birthDate: '1988-12-10',
      bankAccount: 'IBK 111-222-333444',
      taxId: '881210-1******',
      certifications: ['식품안전관리사', '서비스경영사'],
      notes: '매장 관리 우수'
    },
    {
      id: 'EMP004',
      name: '최영희',
      phone: '010-4567-8901',
      email: 'choi.yh@example.com',
      position: '서빙',
      location: '홍대점',
      employmentType: '계약직',
      status: 'active',
      startDate: '2023-09-15',
      monthlyRate: 2400000,
      weeklyHours: 35,
      totalHoursWorked: 560,
      attendanceRate: 94.8,
      emergencyContact: '010-9999-0004',
      address: '서울시 용산구',
      birthDate: '1995-03-25',
      bankAccount: '우리 555-666-777888',
      taxId: '950325-2******',
      certifications: ['위생교육 수료']
    },
    {
      id: 'EMP005',
      name: '정대호',
      phone: '010-5678-9012',
      email: 'jung.dh@example.com',
      position: '주방보조',
      location: '신촌점',
      employmentType: '아르바이트',
      status: 'on_leave',
      startDate: '2023-11-01',
      hourlyRate: 11000,
      weeklyHours: 25,
      totalHoursWorked: 320,
      attendanceRate: 91.5,
      emergencyContact: '010-9999-0005',
      address: '서울시 서대문구',
      birthDate: '2001-07-30',
      bankAccount: '하나 999-888-777666',
      taxId: '010730-1******',
      certifications: ['위생교육 수료'],
      notes: '개인 사정으로 휴직 중'
    }
  ]);

  const locations = ['all', '강남점', '홍대점', '신촌점'];
  const positions = ['all', '주방장', '매니저', '서빙', '주방보조', '캐셔'];
  const statuses = ['all', 'active', 'inactive', 'on_leave'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.phone.includes(searchTerm) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || emp.location === filterLocation;
    const matchesPosition = filterPosition === 'all' || emp.position === filterPosition;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesLocation && matchesPosition && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />재직중</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" />퇴사</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />휴직</Badge>;
      default:
        return null;
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      '정규직': 'bg-blue-100 text-blue-700',
      '계약직': 'bg-purple-100 text-purple-700',
      '아르바이트': 'bg-orange-100 text-orange-700'
    };
    return <Badge className={colors[type as keyof typeof colors]} variant="outline">{type}</Badge>;
  };

  const calculateStats = () => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const onLeave = employees.filter(e => e.status === 'on_leave').length;
    const avgAttendance = employees.reduce((sum, e) => sum + e.attendanceRate, 0) / total;
    const totalPayroll = employees
      .filter(e => e.status === 'active')
      .reduce((sum, e) => {
        if (e.monthlyRate) return sum + e.monthlyRate;
        if (e.hourlyRate && e.weeklyHours) return sum + (e.hourlyRate * e.weeklyHours * 4.3);
        return sum;
      }, 0);

    return { total, active, onLeave, avgAttendance, totalPayroll };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 돌아가기
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">직원 관리</h1>
              <p className="text-gray-600 mt-1">직원 정보 조회 및 관리</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                가져오기
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                직원 추가
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 직원</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">재직중</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">휴직</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.onLeave}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 출석률</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.avgAttendance.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">월 인건비</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(stats.totalPayroll / 10000).toFixed(0)}만원
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 전화번호, 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? '모든 매장' : loc}
                  </option>
                ))}
              </select>

              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos}>
                    {pos === 'all' ? '모든 직책' : pos}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? '모든 상태' :
                     status === 'active' ? '재직중' :
                     status === 'inactive' ? '퇴사' : '휴직'}
                  </option>
                ))}
              </select>

              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                고급 필터
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>직원 목록 ({filteredEmployees.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">직원명</th>
                    <th className="text-left py-3 px-4">직책</th>
                    <th className="text-left py-3 px-4">매장</th>
                    <th className="text-left py-3 px-4">고용형태</th>
                    <th className="text-left py-3 px-4">연락처</th>
                    <th className="text-left py-3 px-4">입사일</th>
                    <th className="text-left py-3 px-4">급여</th>
                    <th className="text-left py-3 px-4">출석률</th>
                    <th className="text-left py-3 px-4">상태</th>
                    <th className="text-left py-3 px-4">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{employee.position}</td>
                      <td className="py-3 px-4">{employee.location}</td>
                      <td className="py-3 px-4">{getEmploymentTypeBadge(employee.employmentType)}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{employee.phone}</div>
                          <div className="text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{employee.startDate}</td>
                      <td className="py-3 px-4">
                        {employee.monthlyRate ? (
                          <span>{(employee.monthlyRate / 10000).toFixed(0)}만원/월</span>
                        ) : (
                          <span>{employee.hourlyRate?.toLocaleString()}원/시</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${employee.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{employee.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(employee.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDetailModal(true);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Employee Detail Modal */}
        {showDetailModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">직원 상세 정보</h2>
                  <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">이름</label>
                        <p className="font-medium">{selectedEmployee.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">직원 ID</label>
                        <p className="font-medium">{selectedEmployee.id}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">생년월일</label>
                        <p className="font-medium">{selectedEmployee.birthDate}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">주민번호</label>
                        <p className="font-medium">{selectedEmployee.taxId}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">주소</label>
                        <p className="font-medium">{selectedEmployee.address}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">비상연락망</label>
                        <p className="font-medium">{selectedEmployee.emergencyContact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">고용 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">직책</label>
                        <p className="font-medium">{selectedEmployee.position}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">근무지</label>
                        <p className="font-medium">{selectedEmployee.location}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">고용형태</label>
                        <p className="font-medium">{selectedEmployee.employmentType}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">입사일</label>
                        <p className="font-medium">{selectedEmployee.startDate}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">근무시간 (주)</label>
                        <p className="font-medium">{selectedEmployee.weeklyHours}시간</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">총 근무시간</label>
                        <p className="font-medium">{selectedEmployee.totalHoursWorked}시간</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">급여 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">급여</label>
                        <p className="font-medium">
                          {selectedEmployee.monthlyRate
                            ? `${(selectedEmployee.monthlyRate / 10000).toFixed(0)}만원/월`
                            : `${selectedEmployee.hourlyRate?.toLocaleString()}원/시`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">계좌번호</label>
                        <p className="font-medium">{selectedEmployee.bankAccount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">근무 성과</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">출석률</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full"
                              style={{ width: `${selectedEmployee.attendanceRate}%` }}
                            />
                          </div>
                          <span className="font-medium">{selectedEmployee.attendanceRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  {selectedEmployee.certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">자격증/교육</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.certifications.map((cert, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700">
                            <Award className="w-3 h-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedEmployee.notes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">메모</h3>
                      <p className="text-gray-700">{selectedEmployee.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      계약서
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      내보내기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;

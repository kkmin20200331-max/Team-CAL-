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
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Briefcase,
  Award,
  MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Substitute {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string[];
  availableLocations: string[];
  rating: number;
  completedShifts: number;
  status: 'available' | 'busy' | 'inactive';
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  preferredHours: string;
  experience: string;
  lastWorked?: string;
  certifications: string[];
  notes?: string;
}

interface ShiftRequest {
  id: string;
  location: string;
  position: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'filled' | 'cancelled';
  assignedTo?: string;
  urgency: 'high' | 'medium' | 'low';
}

const SubstituteManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'substitutes' | 'requests'>('substitutes');

  // Mock data - 대타 근무자 목록
  const [substitutes, setSubstitutes] = useState<Substitute[]>([
    {
      id: 'SUB001',
      name: '김대타',
      phone: '010-1111-2222',
      email: 'kim.sub@example.com',
      position: ['서빙', '주방보조'],
      availableLocations: ['강남점', '홍대점'],
      rating: 4.8,
      completedShifts: 45,
      status: 'available',
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: false,
        friday: true,
        saturday: true,
        sunday: false
      },
      preferredHours: '09:00-18:00',
      experience: '3년',
      lastWorked: '2024-03-10',
      certifications: ['위생교육 수료', '식품안전 자격증'],
      notes: '성실하고 책임감 있음'
    },
    {
      id: 'SUB002',
      name: '이보조',
      phone: '010-2222-3333',
      email: 'lee.sub@example.com',
      position: ['주방보조', '설거지'],
      availableLocations: ['신촌점'],
      rating: 4.5,
      completedShifts: 28,
      status: 'available',
      availability: {
        monday: false,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      preferredHours: '저녁 시간대',
      experience: '1년 6개월',
      lastWorked: '2024-03-12',
      certifications: ['위생교육 수료']
    },
    {
      id: 'SUB003',
      name: '박서빙',
      phone: '010-3333-4444',
      email: 'park.sub@example.com',
      position: ['서빙', '캐셔'],
      availableLocations: ['강남점', '홍대점', '신촌점'],
      rating: 4.9,
      completedShifts: 67,
      status: 'busy',
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      preferredHours: '주중 전체',
      experience: '5년',
      lastWorked: '2024-03-14',
      certifications: ['위생교육 수료', '바리스타 자격증', '서비스 매니저'],
      notes: '경험 많고 신뢰도 높음'
    },
    {
      id: 'SUB004',
      name: '최긴급',
      phone: '010-4444-5555',
      email: 'choi.sub@example.com',
      position: ['서빙'],
      availableLocations: ['홍대점'],
      rating: 4.2,
      completedShifts: 15,
      status: 'available',
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      preferredHours: '전체',
      experience: '6개월',
      lastWorked: '2024-03-08',
      certifications: ['위생교육 수료']
    }
  ]);

  // Mock data - 대타 요청 목록
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([
    {
      id: 'REQ001',
      location: '강남점',
      position: '서빙',
      date: '2024-03-16',
      startTime: '10:00',
      endTime: '19:00',
      status: 'pending',
      urgency: 'high'
    },
    {
      id: 'REQ002',
      location: '홍대점',
      position: '주방보조',
      date: '2024-03-17',
      startTime: '11:00',
      endTime: '20:00',
      status: 'pending',
      urgency: 'medium'
    },
    {
      id: 'REQ003',
      location: '신촌점',
      position: '서빙',
      date: '2024-03-15',
      startTime: '17:00',
      endTime: '22:00',
      status: 'filled',
      assignedTo: '이보조',
      urgency: 'low'
    }
  ]);

  const positions = ['all', '서빙', '주방보조', '주방장', '캐셔', '설거지'];
  const statuses = ['all', 'available', 'busy', 'inactive'];

  const filteredSubstitutes = substitutes.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.phone.includes(searchTerm);
    const matchesPosition = filterPosition === 'all' || sub.position.includes(filterPosition);
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />근무 가능</Badge>;
      case 'busy':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />근무 중</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" />비활성</Badge>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-500">긴급</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">보통</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">여유</Badge>;
      default:
        return null;
    }
  };

  const getDayName = (day: keyof Substitute['availability']) => {
    const days = {
      monday: '월',
      tuesday: '화',
      wednesday: '수',
      thursday: '목',
      friday: '금',
      saturday: '토',
      sunday: '일'
    };
    return days[day];
  };

  const stats = {
    totalSubstitutes: substitutes.length,
    available: substitutes.filter(s => s.status === 'available').length,
    busy: substitutes.filter(s => s.status === 'busy').length,
    pendingRequests: shiftRequests.filter(r => r.status === 'pending').length
  };

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
              <h1 className="text-3xl font-bold text-gray-900">대타 근무자 관리</h1>
              <p className="text-gray-600 mt-1">대타 근무자 모집 및 배정 관리</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                일괄 연락
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                대타 등록
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 대타</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSubstitutes}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">근무 가능</p>
                  <p className="text-3xl font-bold text-green-600">{stats.available}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">근무 중</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.busy}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">대기 요청</p>
                  <p className="text-3xl font-bold text-red-600">{stats.pendingRequests}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'substitutes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('substitutes')}
          >
            대타 근무자 목록
          </Button>
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            대타 요청 관리
          </Button>
        </div>

        {activeTab === 'substitutes' && (
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="이름 또는 전화번호로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>

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
                         status === 'available' ? '근무 가능' :
                         status === 'busy' ? '근무 중' : '비활성'}
                      </option>
                    ))}
                  </select>

                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Substitutes List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSubstitutes.map(substitute => (
                <Card key={substitute.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {substitute.name[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{substitute.name}</h3>
                          <p className="text-sm text-gray-500">{substitute.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(substitute.status)}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{substitute.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{substitute.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{substitute.position.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{substitute.availableLocations.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{substitute.preferredHours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span>경력 {substitute.experience}</span>
                      </div>
                    </div>

                    {/* Rating and Stats */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{substitute.rating}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        완료 근무: {substitute.completedShifts}회
                      </div>
                      {substitute.lastWorked && (
                        <div className="text-sm text-gray-600">
                          최근: {substitute.lastWorked}
                        </div>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">근무 가능 요일</p>
                      <div className="flex gap-1">
                        {Object.entries(substitute.availability).map(([day, available]) => (
                          <div
                            key={day}
                            className={`flex-1 text-center py-1 rounded text-sm ${
                              available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {getDayName(day as keyof Substitute['availability'])}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {substitute.certifications.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">자격증/교육</p>
                        <div className="flex flex-wrap gap-2">
                          {substitute.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {substitute.notes && (
                      <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-gray-700">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {substitute.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        연락
                      </Button>
                      <Button className="flex-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        배정
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <Card>
            <CardHeader>
              <CardTitle>대타 요청 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shiftRequests.map(request => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{request.location}</h3>
                          {getUrgencyBadge(request.urgency)}
                          <Badge variant={request.status === 'filled' ? 'default' : 'outline'}>
                            {request.status === 'pending' ? '대기 중' :
                             request.status === 'filled' ? '배정 완료' : '취소됨'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {request.position}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {request.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.startTime} - {request.endTime}
                          </span>
                        </div>
                        {request.assignedTo && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">배정: </span>
                            <span className="font-medium">{request.assignedTo}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button size="sm">
                              <UserPlus className="w-4 h-4 mr-2" />
                              배정
                            </Button>
                            <Button size="sm" variant="outline">
                              수정
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubstituteManagement;

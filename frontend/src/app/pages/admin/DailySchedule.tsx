import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  phone: string;
  position: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  breakTime: number;
  notes?: string;
}

const DailySchedule: React.FC = () => {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  const [selectedDate, setSelectedDate] = useState(date || '2024-03-15');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Mock data - 일일 근무 스케줄
  const [schedules, setSchedules] = useState<ShiftAssignment[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: '김민수',
      phone: '010-1234-5678',
      position: '주방장',
      startTime: '09:00',
      endTime: '18:00',
      location: '강남점',
      status: 'confirmed',
      breakTime: 60,
      notes: '오픈 담당'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: '이지은',
      phone: '010-2345-6789',
      position: '서빙',
      startTime: '10:00',
      endTime: '19:00',
      location: '강남점',
      status: 'confirmed',
      breakTime: 60
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: '박철수',
      phone: '010-3456-7890',
      position: '주방보조',
      startTime: '11:00',
      endTime: '20:00',
      location: '강남점',
      status: 'pending',
      breakTime: 60
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: '최영희',
      phone: '010-4567-8901',
      position: '서빙',
      startTime: '17:00',
      endTime: '22:00',
      location: '홍대점',
      status: 'confirmed',
      breakTime: 30
    },
    {
      id: '5',
      employeeId: 'EMP005',
      employeeName: '정대호',
      phone: '010-5678-9012',
      position: '주방장',
      startTime: '08:00',
      endTime: '17:00',
      location: '홍대점',
      status: 'cancelled',
      breakTime: 60,
      notes: '개인 사정으로 결근'
    }
  ]);

  const locations = ['all', '강남점', '홍대점', '신촌점'];

  const filteredSchedules = selectedLocation === 'all'
    ? schedules
    : schedules.filter(s => s.location === selectedLocation);

  // 시간별로 그룹화
  const groupByHour = () => {
    const hours: { [key: string]: ShiftAssignment[] } = {};

    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      hours[hour] = filteredSchedules.filter(schedule => {
        const startHour = parseInt(schedule.startTime.split(':')[0]);
        const endHour = parseInt(schedule.endTime.split(':')[0]);
        return i >= startHour && i < endHour;
      });
    }

    return hours;
  };

  const hourlySchedule = groupByHour();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />확정</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />대기</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />취소</Badge>;
      default:
        return null;
    }
  };

  const calculateStats = () => {
    const total = filteredSchedules.length;
    const confirmed = filteredSchedules.filter(s => s.status === 'confirmed').length;
    const pending = filteredSchedules.filter(s => s.status === 'pending').length;
    const cancelled = filteredSchedules.filter(s => s.status === 'cancelled').length;
    const totalHours = filteredSchedules
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, s) => {
        const start = parseInt(s.startTime.split(':')[0]) * 60 + parseInt(s.startTime.split(':')[1]);
        const end = parseInt(s.endTime.split(':')[0]) * 60 + parseInt(s.endTime.split(':')[1]);
        return sum + (end - start - s.breakTime) / 60;
      }, 0);

    return { total, confirmed, pending, cancelled, totalHours };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/schedule')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            스케줄로 돌아가기
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">일일 근무 스케줄</h1>
              <p className="text-gray-600 mt-1">상세 시간별 근무 현황</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                일괄 수정
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                근무 추가
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? '전체 매장' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 근무자</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">확정</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">대기</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">취소</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 근무시간</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}h</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              시간별 근무 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(hourlySchedule).map(([hour, assignments]) => {
                if (assignments.length === 0) return null;

                return (
                  <div key={hour} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-semibold text-lg mb-3">{hour}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold">{assignment.employeeName}</span>
                            </div>
                            {getStatusBadge(assignment.status)}
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-3 h-3" />
                              {assignment.startTime} - {assignment.endTime}
                              <span className="text-xs text-gray-500">
                                (휴게 {assignment.breakTime}분)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {assignment.location} · {assignment.position}
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3 h-3" />
                              {assignment.phone}
                            </div>

                            {assignment.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                {assignment.notes}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              수정
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              연락
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Assignments List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>전체 근무 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">직원명</th>
                    <th className="text-left py-3 px-4">매장</th>
                    <th className="text-left py-3 px-4">직책</th>
                    <th className="text-left py-3 px-4">근무시간</th>
                    <th className="text-left py-3 px-4">휴게시간</th>
                    <th className="text-left py-3 px-4">연락처</th>
                    <th className="text-left py-3 px-4">상태</th>
                    <th className="text-left py-3 px-4">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map(schedule => (
                    <tr key={schedule.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{schedule.employeeName}</td>
                      <td className="py-3 px-4">{schedule.location}</td>
                      <td className="py-3 px-4">{schedule.position}</td>
                      <td className="py-3 px-4">
                        {schedule.startTime} - {schedule.endTime}
                      </td>
                      <td className="py-3 px-4">{schedule.breakTime}분</td>
                      <td className="py-3 px-4">{schedule.phone}</td>
                      <td className="py-3 px-4">{getStatusBadge(schedule.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default DailySchedule;

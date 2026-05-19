import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  UserCheck,
  Calendar
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

// Mock data for weekly schedule
const employees = [
  { id: 1, name: '김민수', role: 'general', level: '일반' },
  { id: 2, name: '이지영', role: 'closing', level: '마감가능' },
  { id: 3, name: '박서준', role: 'general', level: '일반' },
  { id: 4, name: '최유나', role: 'closing', level: '마감가능' },
  { id: 5, name: '정태현', role: 'newbie', level: '신입' },
  { id: 6, name: '강민지', role: 'general', level: '일반' },
  { id: 7, name: '윤서아', role: 'manager', level: '관리자' },
  { id: 8, name: '조현우', role: 'general', level: '일반' },
];

type ShiftStatus = 'normal' | 'substitute-needed' | 'leave-requested' | 'substitute-pending';

interface Shift {
  start: string;
  end: string;
  status: ShiftStatus;
  warning?: string;
}

const getWeekDates = (baseDate: Date) => {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const weekDates = getWeekDates(currentWeek);

  // Mock schedule data
  const getShiftForEmployee = (employeeId: number, dateIndex: number): Shift | null => {
    const schedules: { [key: string]: Shift | null } = {
      '1-0': { start: '09:00', end: '15:00', status: 'normal' },
      '1-2': { start: '09:00', end: '15:00', status: 'normal' },
      '1-4': { start: '09:00', end: '15:00', status: 'normal' },
      '2-0': { start: '12:00', end: '18:00', status: 'normal' },
      '2-1': { start: '12:00', end: '18:00', status: 'normal' },
      '2-3': { start: '17:00', end: '22:00', status: 'normal' },
      '2-5': { start: '17:00', end: '22:00', status: 'normal' },
      '2-6': { start: '17:00', end: '22:00', status: 'normal' },
      '3-1': { start: '12:00', end: '18:00', status: 'substitute-needed' },
      '3-3': { start: '12:00', end: '18:00', status: 'leave-requested' },
      '3-5': { start: '12:00', end: '18:00', status: 'normal' },
      '3-6': { start: '12:00', end: '18:00', status: 'normal' },
      '4-0': { start: '17:00', end: '22:00', status: 'normal' },
      '4-2': { start: '17:00', end: '22:00', status: 'normal' },
      '4-4': { start: '17:00', end: '22:00', status: 'normal' },
      '4-6': { start: '17:00', end: '22:00', status: 'normal' },
      '5-1': { start: '18:00', end: '22:00', status: 'normal', warning: 'newbie-alone' },
      '5-3': { start: '18:00', end: '22:00', status: 'normal' },
      '5-5': { start: '18:00', end: '22:00', status: 'normal' },
      '6-2': { start: '09:00', end: '17:00', status: 'normal' },
      '6-4': { start: '09:00', end: '17:00', status: 'normal' },
      '7-0': { start: '14:00', end: '20:00', status: 'normal' },
      '7-6': { start: '14:00', end: '20:00', status: 'normal' },
      '8-5': { start: '12:00', end: '18:00', status: 'normal' },
      '8-6': { start: '12:00', end: '18:00', status: 'substitute-pending' },
    };

    return schedules[`${employeeId}-${dateIndex}`] || null;
  };

  const getShiftColor = (status: ShiftStatus) => {
    switch (status) {
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200';
      case 'substitute-needed':
        return 'bg-red-100 border-red-300 border-dashed text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
      case 'leave-requested':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200';
      case 'substitute-pending':
        return 'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/admin/dashboard/${branchId}`)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">주간 근무표</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {format(weekDates[0], 'yyyy년 M월 d일', { locale: ko })} - {format(weekDates[6], 'M월 d일', { locale: ko })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(prev => addDays(prev, -7))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
              >
                오늘
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(prev => addDays(prev, 7))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="직원 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedRole === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('all')}
              >
                전체
              </Button>
              <Button
                variant={selectedRole === 'newbie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('newbie')}
              >
                신입
              </Button>
              <Button
                variant={selectedRole === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('general')}
              >
                일반
              </Button>
              <Button
                variant={selectedRole === 'closing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('closing')}
              >
                마감가능
              </Button>
              <Button
                variant={selectedRole === 'manager' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('manager')}
              >
                관리자
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded dark:bg-blue-900/30"></div>
              <span>정상 근무</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-dashed border-red-300 rounded dark:bg-red-900/30"></div>
              <span>대타 필요</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded dark:bg-yellow-900/30"></div>
              <span>휴무 신청</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded dark:bg-orange-900/30"></div>
              <span>대타 승인 대기</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-4 text-left border-b border-r border-gray-200 dark:border-gray-700 min-w-[150px]">
                      직원명
                    </th>
                    {weekDates.map((date, index) => (
                      <th
                        key={index}
                        className="p-4 text-center border-b border-gray-200 dark:border-gray-700 min-w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => navigate(`/admin/schedule/daily/${branchId}/${format(date, 'yyyy-MM-dd')}`)}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium">
                            {format(date, 'EEE', { locale: ko })}
                          </span>
                          <span className="text-lg font-bold">
                            {format(date, 'd')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 p-4 border-b border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {employee.name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {employee.level}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      {weekDates.map((_, dateIndex) => {
                        const shift = getShiftForEmployee(employee.id, dateIndex);
                        return (
                          <td
                            key={dateIndex}
                            className="p-2 border-b border-gray-200 dark:border-gray-700 text-center"
                          >
                            {shift && (
                              <div
                                className={`relative p-2 rounded-lg border-2 text-xs cursor-pointer transition-all hover:shadow-md ${getShiftColor(shift.status)}`}
                                onClick={() => {
                                  // Open shift detail modal
                                }}
                              >
                                <div className="font-semibold">{shift.start}</div>
                                <div className="font-semibold">{shift.end}</div>
                                {shift.warning === 'newbie-alone' && (
                                  <AlertTriangle className="absolute -top-1 -right-1 w-4 h-4 text-orange-600" />
                                )}
                                {shift.status === 'substitute-needed' && (
                                  <div className="mt-1 text-xs font-medium">대타 필요</div>
                                )}
                                {shift.status === 'leave-requested' && (
                                  <div className="mt-1 text-xs font-medium">휴무 신청</div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-4 mt-6">
          <Button className="flex-1" onClick={() => navigate(`/admin/substitute/${branchId}`)}>
            <UserCheck className="w-4 h-4 mr-2" />
            대타 모집 관리
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate(`/admin/schedule/daily/${branchId}/${format(new Date(), 'yyyy-MM-dd')}`)}>
            <Calendar className="w-4 h-4 mr-2" />
            일간 타임표 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

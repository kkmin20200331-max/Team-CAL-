import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Download,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard,
  User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ProfilePanel from './ProfilePanel';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  location: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  hourlyRate: number;
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  deductions: {
    tax: number;
    insurance: number;
    pension: number;
  };
  totalPay: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestedDate: string;
  paidDate?: string;
}

interface WeeklyPayRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  weekEnd: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestDate: string;
  reason: string;
}

const PayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.payrollManagement[language];
  const [selectedPeriod, setSelectedPeriod] = useState('2024-03');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'payroll' | 'weekly' | 'analytics'>('payroll');

  // Mock data - 급여 내역
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([
    {
      id: 'PAY001',
      employeeId: 'EMP001',
      employeeName: '김민수',
      position: '주방장',
      location: '강남점',
      period: '2024-03',
      regularHours: 160,
      overtimeHours: 12,
      holidayHours: 8,
      hourlyRate: 20000,
      basePay: 3200000,
      overtimePay: 360000,
      holidayPay: 320000,
      deductions: {
        tax: 387000,
        insurance: 145000,
        pension: 193000
      },
      totalPay: 3155000,
      status: 'paid',
      requestedDate: '2024-03-25',
      paidDate: '2024-03-31'
    },
    {
      id: 'PAY002',
      employeeId: 'EMP002',
      employeeName: '이지은',
      position: '서빙',
      location: '강남점',
      period: '2024-03',
      regularHours: 80,
      overtimeHours: 5,
      holidayHours: 0,
      hourlyRate: 12000,
      basePay: 960000,
      overtimePay: 90000,
      holidayPay: 0,
      deductions: {
        tax: 52500,
        insurance: 31500,
        pension: 42000
      },
      totalPay: 924000,
      status: 'approved',
      requestedDate: '2024-03-28'
    },
    {
      id: 'PAY003',
      employeeId: 'EMP003',
      employeeName: '박철수',
      position: '매니저',
      location: '홍대점',
      period: '2024-03',
      regularHours: 160,
      overtimeHours: 20,
      holidayHours: 16,
      hourlyRate: 18000,
      basePay: 2880000,
      overtimePay: 540000,
      holidayPay: 576000,
      deductions: {
        tax: 398400,
        insurance: 149100,
        pension: 199800
      },
      totalPay: 3449700,
      status: 'pending',
      requestedDate: '2024-03-29'
    }
  ]);

  // Mock data - 주급 요청
  const [weeklyPayRequests, setWeeklyPayRequests] = useState<WeeklyPayRequest[]>([
    {
      id: 'WPR001',
      employeeId: 'EMP002',
      employeeName: '이지은',
      weekStart: '2024-03-18',
      weekEnd: '2024-03-24',
      requestedAmount: 240000,
      approvedAmount: 240000,
      status: 'approved',
      requestDate: '2024-03-24',
      reason: '긴급 생활비'
    },
    {
      id: 'WPR002',
      employeeId: 'EMP004',
      employeeName: '최영희',
      weekStart: '2024-03-25',
      weekEnd: '2024-03-31',
      requestedAmount: 200000,
      status: 'pending',
      requestDate: '2024-03-30',
      reason: '학비 납부'
    }
  ]);

  // Chart data
  const monthlyPayrollData = [
    { month: '10월', amount: 12500000 },
    { month: '11월', amount: 13200000 },
    { month: '12월', amount: 14100000 },
    { month: '1월', amount: 13800000 },
    { month: '2월', amount: 13500000 },
    { month: '3월', amount: 14500000 }
  ];

  const payrollByPosition = [
    { name: '주방장', value: 6400000, percentage: 44 },
    { name: '매니저', value: 3200000, percentage: 22 },
    { name: '서빙', value: 2880000, percentage: 20 },
    { name: '주방보조', value: 2020000, percentage: 14 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const filteredPayroll = payrollEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesPeriod = entry.period === selectedPeriod;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t.statusPaid}</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />{t.statusApproved}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />{t.statusPending}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />{t.statusRejected}</Badge>;
      default:
        return null;
    }
  };

  const calculateStats = () => {
    const totalPayroll = filteredPayroll.reduce((sum, entry) => sum + entry.totalPay, 0);
    const pending = filteredPayroll.filter(e => e.status === 'pending').length;
    const approved = filteredPayroll.filter(e => e.status === 'approved').length;
    const paid = filteredPayroll.filter(e => e.status === 'paid').length;
    const weeklyPending = weeklyPayRequests.filter(r => r.status === 'pending').length;

    return { totalPayroll, pending, approved, paid, weeklyPending };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/dashboard/${branchId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToDashboard}
            </Button>
            <ProfilePanel />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {t.exportPayslip}
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                {t.bulkPay}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t.totalPay}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.totalPayroll / 10000).toFixed(0)}만원
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t.paid}</p>
                <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t.approved}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t.pending}</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t.weeklyRequest}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.weeklyPending}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'payroll' ? 'default' : 'outline'}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {t.tabPayroll}
          </Button>
          <Button
            variant={activeTab === 'weekly' ? 'default' : 'outline'}
            onClick={() => setActiveTab('weekly')}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {t.tabWeekly}
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {t.tabAnalytics}
          </Button>
        </div>

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">{t.allStatus}</option>
                    <option value="pending">{t.statusPending}</option>
                    <option value="approved">{t.statusApproved}</option>
                    <option value="paid">{t.statusPaid}</option>
                    <option value="rejected">{t.statusRejected}</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Payroll List */}
            <Card>
              <CardHeader>
                <CardTitle>{t.payrollList(filteredPayroll.length)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t.colEmployee}</th>
                        <th className="text-left py-3 px-4">{t.colPositionStore}</th>
                        <th className="text-left py-3 px-4">{t.colHours}</th>
                        <th className="text-left py-3 px-4">{t.colBase}</th>
                        <th className="text-left py-3 px-4">{t.colOvertime}</th>
                        <th className="text-left py-3 px-4">{t.colDeduction}</th>
                        <th className="text-left py-3 px-4">{t.colNet}</th>
                        <th className="text-left py-3 px-4">{t.colStatus}</th>
                        <th className="text-left py-3 px-4">{t.colActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayroll.map(entry => (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{entry.employeeName}</div>
                              <div className="text-sm text-gray-500">{entry.employeeId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div>{entry.position}</div>
                              <div className="text-sm text-gray-500">{entry.location}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div>{t.regularHours(entry.regularHours)}</div>
                              <div className="text-blue-600">{t.overtimeHours(entry.overtimeHours)}</div>
                              <div className="text-green-600">{t.holidayHours(entry.holidayHours)}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{(entry.basePay / 10000).toFixed(0)}만원</td>
                          <td className="py-3 px-4">
                            {((entry.overtimePay + entry.holidayPay) / 10000).toFixed(0)}만원
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-red-600">
                              {((entry.deductions.tax + entry.deductions.insurance + entry.deductions.pension) / 10000).toFixed(0)}만원
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-blue-600">
                              {(entry.totalPay / 10000).toFixed(0)}만원
                            </div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(entry.status)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4" />
                              </Button>
                              {entry.status === 'pending' && (
                                <Button size="sm">{t.approveBtn}</Button>
                              )}
                              {entry.status === 'approved' && (
                                <Button size="sm">{t.payBtn}</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Weekly Pay Requests Tab */}
        {activeTab === 'weekly' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t.weeklyRequestList}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyPayRequests.map(request => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{request.employeeName}</h3>
                          <p className="text-sm text-gray-500">{request.employeeId}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">{t.workPeriod}</p>
                        <p className="font-medium">{request.weekStart} ~ {request.weekEnd}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.requestAmount}</p>
                        <p className="font-medium text-blue-600">
                          {(request.requestedAmount / 10000).toFixed(0)}만원
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.approvedAmount}</p>
                        <p className="font-medium">
                          {request.approvedAmount
                            ? `${(request.approvedAmount / 10000).toFixed(0)}만원`
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.requestDate}</p>
                        <p className="font-medium">{request.requestDate}</p>
                      </div>
                    </div>

                    <div className="mb-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-1">{t.requestReason}</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t.approveRequest}
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <XCircle className="w-4 h-4 mr-2" />
                          {t.rejectRequest}
                        </Button>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <Button className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        {t.payRequest}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t.monthlyTrend}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPayrollData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      name={t.totalPay}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Position */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.byPosition}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={payrollByPosition}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {payrollByPosition.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.payrollSummary}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payrollByPosition.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{(item.value / 10000).toFixed(0)}만원</div>
                          <div className="text-sm text-gray-500">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;

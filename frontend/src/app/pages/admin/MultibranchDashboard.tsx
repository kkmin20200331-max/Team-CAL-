import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
} from "recharts";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';

interface BranchMetrics {
  id: string;
  name: string;
  location: string;
  status: "excellent" | "good" | "warning" | "critical";
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  customers: {
    today: number;
    thisWeek: number;
    avgSatisfaction: number;
  };
  employees: {
    total: number;
    working: number;
    onLeave: number;
    attendanceRate: number;
  };
  operations: {
    openingTime: string;
    closingTime: string;
    tableOccupancy: number;
    avgWaitTime: number;
  };
  issues: {
    count: number;
    critical: number;
  };
}

const MultibranchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "customers" | "employees"
  >("revenue");
  const [comparisonPeriod, setComparisonPeriod] = useState("thisMonth");

  // Mock data - 매장별 지표
  const branchMetrics: BranchMetrics[] = [
    {
      id: "BR001",
      name: "강남점",
      location: "서울시 강남구",
      status: "excellent",
      revenue: {
        today: 4500000,
        thisWeek: 28000000,
        thisMonth: 115000000,
        growth: 15.5,
      },
      customers: {
        today: 245,
        thisWeek: 1580,
        avgSatisfaction: 4.6,
      },
      employees: {
        total: 15,
        working: 12,
        onLeave: 1,
        attendanceRate: 96.5,
      },
      operations: {
        openingTime: "09:00",
        closingTime: "22:00",
        tableOccupancy: 78,
        avgWaitTime: 12,
      },
      issues: {
        count: 2,
        critical: 0,
      },
    },
    {
      id: "BR002",
      name: "홍대점",
      location: "서울시 마포구",
      status: "good",
      revenue: {
        today: 3800000,
        thisWeek: 24500000,
        thisMonth: 98000000,
        growth: 8.3,
      },
      customers: {
        today: 198,
        thisWeek: 1320,
        avgSatisfaction: 4.4,
      },
      employees: {
        total: 12,
        working: 10,
        onLeave: 0,
        attendanceRate: 94.2,
      },
      operations: {
        openingTime: "10:00",
        closingTime: "23:00",
        tableOccupancy: 65,
        avgWaitTime: 8,
      },
      issues: {
        count: 1,
        critical: 0,
      },
    },
    {
      id: "BR003",
      name: "신촌점",
      location: "서울시 서대문구",
      status: "warning",
      revenue: {
        today: 2900000,
        thisWeek: 19800000,
        thisMonth: 82000000,
        growth: -3.2,
      },
      customers: {
        today: 156,
        thisWeek: 980,
        avgSatisfaction: 4.1,
      },
      employees: {
        total: 10,
        working: 7,
        onLeave: 2,
        attendanceRate: 88.5,
      },
      operations: {
        openingTime: "10:00",
        closingTime: "22:00",
        tableOccupancy: 52,
        avgWaitTime: 5,
      },
      issues: {
        count: 5,
        critical: 2,
      },
    },
    {
      id: "BR004",
      name: "판교점",
      location: "경기도 성남시",
      status: "excellent",
      revenue: {
        today: 5200000,
        thisWeek: 32000000,
        thisMonth: 128000000,
        growth: 22.7,
      },
      customers: {
        today: 289,
        thisWeek: 1850,
        avgSatisfaction: 4.7,
      },
      employees: {
        total: 18,
        working: 15,
        onLeave: 0,
        attendanceRate: 98.1,
      },
      operations: {
        openingTime: "08:00",
        closingTime: "22:00",
        tableOccupancy: 85,
        avgWaitTime: 15,
      },
      issues: {
        count: 1,
        critical: 0,
      },
    },
  ];

  // Chart data - 매장별 매출 비교
  const revenueComparisonData = branchMetrics.map((branch) => ({
    name: branch.name,
    thisMonth: branch.revenue.thisMonth / 1000000,
    growth: branch.revenue.growth,
  }));

  // Chart data - 매장별 종합 성과
  const performanceRadarData = [
    {
      metric: "매출",
      강남점: 85,
      홍대점: 72,
      신촌점: 58,
      판교점: 92,
    },
    {
      metric: "고객만족",
      강남점: 92,
      홍대점: 88,
      신촌점: 82,
      판교점: 94,
    },
    {
      metric: "직원출석",
      강남점: 96.5,
      홍대점: 94.2,
      신촌점: 88.5,
      판교점: 98.1,
    },
    {
      metric: "테이블점유",
      강남점: 78,
      홍대점: 65,
      신촌점: 52,
      판교점: 85,
    },
    {
      metric: "운영효율",
      강남점: 88,
      홍대점: 82,
      신촌점: 68,
      판교점: 90,
    },
  ];

  // Chart data - 주간 추이
  const weeklyTrendData = [
    { day: "월", 강남점: 3800, 홍대점: 3200, 신촌점: 2600, 판교점: 4200 },
    { day: "화", 강남점: 3500, 홍대점: 3000, 신촌점: 2400, 판교점: 3900 },
    { day: "수", 강남점: 3900, 홍대점: 3400, 신촌점: 2800, 판교점: 4500 },
    { day: "목", 강남점: 4200, 홍대점: 3600, 신촌점: 2900, 판교점: 4800 },
    { day: "금", 강남점: 5100, 홍대점: 4300, 신촌점: 3500, 판교점: 5600 },
    { day: "토", 강남점: 5800, 홍대점: 4900, 신촌점: 4100, 판교점: 6400 },
    { day: "일", 강남점: 5200, 홍대점: 4400, 신촌점: 3700, 판교점: 5800 },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return (
          <Badge className="bg-green-500">
            <Award className="w-3 h-3 mr-1" />
            우수
          </Badge>
        );
      case "good":
        return (
          <Badge className="bg-blue-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            양호
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            주의
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            위험
          </Badge>
        );
      default:
        return null;
    }
  };

  const calculateTotalStats = () => {
    const totalRevenue = branchMetrics.reduce(
      (sum, b) => sum + b.revenue.thisMonth,
      0,
    );
    const totalCustomers = branchMetrics.reduce(
      (sum, b) => sum + b.customers.thisWeek,
      0,
    );
    const avgSatisfaction =
      branchMetrics.reduce((sum, b) => sum + b.customers.avgSatisfaction, 0) /
      branchMetrics.length;
    const totalEmployees = branchMetrics.reduce(
      (sum, b) => sum + b.employees.total,
      0,
    );
    const avgAttendance =
      branchMetrics.reduce((sum, b) => sum + b.employees.attendanceRate, 0) /
      branchMetrics.length;

    return {
      totalRevenue,
      totalCustomers,
      avgSatisfaction,
      totalEmployees,
      avgAttendance,
    };
  };

  const totalStats = calculateTotalStats();

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)', fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate("/admin/branch-selection")} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><ChevronLeft size={20} /></button>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F2F5EB', display: 'flex', alignItems: 'center', gap: 10 }}><BarChart3 size={28} />다중 매장 대시보드</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>전체 매장 실시간 비교 분석</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 54, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
              <RefreshCw size={16} />새로고침
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 54, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
              <Download size={16} />리포트 다운로드
            </button>
          </div>
        </div>
      </AdminHeader>
      <div className="max-w-7xl mx-auto p-6">

        {/* Total Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 매장</p>
                <p className="text-3xl font-bold text-gray-900">
                  {branchMetrics.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 매출 (월)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(totalStats.totalRevenue / 100000000).toFixed(1)}억
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">주간 고객</p>
                <p className="text-3xl font-bold text-green-600">
                  {totalStats.totalCustomers.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">평균 만족도</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {totalStats.avgSatisfaction.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">평균 출석률</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalStats.avgAttendance.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branch Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {branchMetrics.map((branch, index) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="w-5 h-5"
                      style={{ color: COLORS[index] }}
                    />
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                  </div>
                  {getStatusBadge(branch.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Revenue */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">월 매출</span>
                      <div className="flex items-center gap-1">
                        {branch.revenue.growth >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span
                          className={`text-xs ${branch.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {branch.revenue.growth > 0 ? "+" : ""}
                          {branch.revenue.growth}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xl font-bold">
                      {(branch.revenue.thisMonth / 10000000).toFixed(1)}천만원
                    </p>
                  </div>

                  {/* Customers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">일 방문객</span>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">
                        {branch.customers.today}명
                      </p>
                      <span className="text-sm text-gray-600">
                        만족도 {branch.customers.avgSatisfaction}
                      </span>
                    </div>
                  </div>

                  {/* Employees */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">근무 인원</span>
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">
                        {branch.employees.working} / {branch.employees.total}
                      </p>
                      <span className="text-sm text-gray-600">
                        출석 {branch.employees.attendanceRate}%
                      </span>
                    </div>
                  </div>

                  {/* Operations */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        테이블 점유율
                      </span>
                      <Activity className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${branch.operations.tableOccupancy}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {branch.operations.tableOccupancy}%
                      </span>
                    </div>
                  </div>

                  {/* Issues */}
                  {branch.issues.count > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle
                          className={`w-4 h-4 ${branch.issues.critical > 0 ? "text-red-500" : "text-yellow-500"}`}
                        />
                        <span className="text-gray-700">
                          이슈 {branch.issues.count}건
                          {branch.issues.critical > 0 &&
                            ` (긴급 ${branch.issues.critical})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button className="w-full mt-2" variant="outline" size="sm">
                    상세 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>매장별 월 매출 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="thisMonth"
                    fill="#3B82F6"
                    name="매출 (백만원)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="growth"
                    stroke="#10B981"
                    name="성장률 (%)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>매장별 종합 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={performanceRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="강남점"
                    dataKey="강남점"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="홍대점"
                    dataKey="홍대점"
                    stroke={COLORS[1]}
                    fill={COLORS[1]}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="신촌점"
                    dataKey="신촌점"
                    stroke={COLORS[2]}
                    fill={COLORS[2]}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="판교점"
                    dataKey="판교점"
                    stroke={COLORS[3]}
                    fill={COLORS[3]}
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>주간 매출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="강남점"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="홍대점"
                  stroke={COLORS[1]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="신촌점"
                  stroke={COLORS[2]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="판교점"
                  stroke={COLORS[3]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>상세 지표 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">매장</th>
                    <th className="text-left py-3 px-4">상태</th>
                    <th className="text-left py-3 px-4">일 매출</th>
                    <th className="text-left py-3 px-4">월 매출</th>
                    <th className="text-left py-3 px-4">성장률</th>
                    <th className="text-left py-3 px-4">방문객</th>
                    <th className="text-left py-3 px-4">만족도</th>
                    <th className="text-left py-3 px-4">출석률</th>
                    <th className="text-left py-3 px-4">점유율</th>
                    <th className="text-left py-3 px-4">이슈</th>
                  </tr>
                </thead>
                <tbody>
                  {branchMetrics.map((branch) => (
                    <tr key={branch.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{branch.name}</div>
                        <div className="text-sm text-gray-500">
                          {branch.location}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(branch.status)}
                      </td>
                      <td className="py-3 px-4">
                        {(branch.revenue.today / 10000).toFixed(0)}만원
                      </td>
                      <td className="py-3 px-4">
                        {(branch.revenue.thisMonth / 10000000).toFixed(1)}천만원
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            branch.revenue.growth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {branch.revenue.growth > 0 ? "+" : ""}
                          {branch.revenue.growth}%
                        </span>
                      </td>
                      <td className="py-3 px-4">{branch.customers.today}명</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {branch.customers.avgSatisfaction}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {branch.employees.attendanceRate}%
                      </td>
                      <td className="py-3 px-4">
                        {branch.operations.tableOccupancy}%
                      </td>
                      <td className="py-3 px-4">
                        {branch.issues.count > 0 ? (
                          <Badge
                            variant={
                              branch.issues.critical > 0
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {branch.issues.count}건
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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

export default MultibranchDashboard;

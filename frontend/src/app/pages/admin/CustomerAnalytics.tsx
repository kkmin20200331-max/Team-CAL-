import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Calendar,
  MapPin,
  Clock,
  Filter,
  Download,
  Brain,
  Target,
  Award,
  ThumbsUp
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  Radar
} from 'recharts';

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  avgSpending: number;
  visitFrequency: number;
  characteristics: string[];
}

interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const CustomerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Chart data - 방문객 추이
  const visitorTrendData = [
    { date: '3/1', visitors: 245, newVisitors: 45, returning: 200 },
    { date: '3/5', visitors: 289, newVisitors: 52, returning: 237 },
    { date: '3/10', visitors: 312, newVisitors: 48, returning: 264 },
    { date: '3/15', visitors: 276, newVisitors: 38, returning: 238 },
    { date: '3/20', visitors: 334, newVisitors: 61, returning: 273 },
    { date: '3/25', visitors: 298, newVisitors: 44, returning: 254 },
    { date: '3/30', visitors: 356, newVisitors: 67, returning: 289 }
  ];

  // Chart data - 시간대별 방문
  const hourlyVisitData = [
    { hour: '09시', count: 45 },
    { hour: '10시', count: 62 },
    { hour: '11시', count: 89 },
    { hour: '12시', count: 156 },
    { hour: '13시', count: 134 },
    { hour: '14시', count: 78 },
    { hour: '15시', count: 56 },
    { hour: '16시', count: 67 },
    { hour: '17시', count: 92 },
    { hour: '18시', count: 145 },
    { hour: '19시', count: 178 },
    { hour: '20시', count: 156 },
    { hour: '21시', count: 89 }
  ];

  // Chart data - 연령대별 분포
  const ageDistributionData = [
    { name: '10대', value: 8, percentage: 5 },
    { name: '20대', value: 62, percentage: 38 },
    { name: '30대', value: 48, percentage: 29 },
    { name: '40대', value: 32, percentage: 20 },
    { name: '50대+', value: 13, percentage: 8 }
  ];

  // Chart data - 고객 만족도
  const satisfactionData = [
    { category: '음식 품질', score: 4.5, maxScore: 5 },
    { category: '서비스', score: 4.3, maxScore: 5 },
    { category: '청결도', score: 4.7, maxScore: 5 },
    { category: '가격', score: 3.8, maxScore: 5 },
    { category: '분위기', score: 4.2, maxScore: 5 },
    { category: '접근성', score: 4.6, maxScore: 5 }
  ];

  // Chart data - 매출 기여도
  const revenueContributionData = [
    { segment: 'VIP 고객', value: 4500000, percentage: 35 },
    { segment: '단골 고객', value: 5200000, percentage: 40 },
    { segment: '신규 고객', value: 2600000, percentage: 20 },
    { segment: '일회성 고객', value: 650000, percentage: 5 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // 고객 세그먼트
  const customerSegments: CustomerSegment[] = [
    {
      id: 'SEG001',
      name: 'VIP 고객',
      count: 89,
      percentage: 5,
      avgSpending: 85000,
      visitFrequency: 12.5,
      characteristics: ['고액 결제', '주 2-3회 방문', '프리미엄 메뉴 선호', '추천 고객 높음']
    },
    {
      id: 'SEG002',
      name: '단골 고객',
      count: 342,
      percentage: 20,
      avgSpending: 45000,
      visitFrequency: 6.2,
      characteristics: ['정기 방문', '특정 메뉴 선호', '높은 만족도', '리뷰 작성']
    },
    {
      id: 'SEG003',
      name: '신규 고객',
      count: 156,
      percentage: 9,
      avgSpending: 32000,
      visitFrequency: 1.2,
      characteristics: ['첫 방문', '프로모션 반응', '탐색 단계', '다양한 메뉴 시도']
    },
    {
      id: 'SEG004',
      name: '주말 방문객',
      count: 445,
      percentage: 26,
      avgSpending: 38000,
      visitFrequency: 2.8,
      characteristics: ['주말 집중', '그룹 방문', '가족 단위', '브런치 선호']
    }
  ];

  // AI 인사이트
  const aiInsights: AIInsight[] = [
    {
      id: 'AI001',
      type: 'trend',
      title: '주말 저녁 시간대 방문객 20% 증가',
      description: '최근 3주간 주말 저녁(18-21시) 방문객이 지속적으로 증가하고 있습니다. 추가 인력 배치를 고려하세요.',
      impact: 'high',
      actionable: true
    },
    {
      id: 'AI002',
      type: 'recommendation',
      title: '20대 고객 타겟 프로모션 추천',
      description: '20대 고객의 재방문율이 38%로 높습니다. 소셜미디어 이벤트를 통해 신규 유입을 늘릴 수 있습니다.',
      impact: 'high',
      actionable: true
    },
    {
      id: 'AI003',
      type: 'alert',
      title: '평일 오후 시간대 방문객 감소',
      description: '평일 14-17시 방문객이 전월 대비 15% 감소했습니다. 오후 할인 이벤트를 고려하세요.',
      impact: 'medium',
      actionable: true
    },
    {
      id: 'AI004',
      type: 'opportunity',
      title: '신메뉴 런칭 최적 타이밍',
      description: '고객 만족도가 높고 신규 고객 유입이 증가하는 시점입니다. 신메뉴 출시에 적합한 타이밍입니다.',
      impact: 'high',
      actionable: true
    },
    {
      id: 'AI005',
      type: 'trend',
      title: 'VIP 고객 증가 추세',
      description: 'VIP 고객 수가 전월 대비 12% 증가했습니다. 멤버십 프로그램 강화를 권장합니다.',
      impact: 'medium',
      actionable: true
    }
  ];

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-500">높음</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">보통</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">낮음</Badge>;
      default:
        return null;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'recommendation':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'opportunity':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const stats = {
    totalVisitors: 8943,
    newVisitors: 1567,
    returningRate: 82.5,
    avgSatisfaction: 4.35,
    totalRevenue: 12950000
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-500" />
                AI 고객 분석
              </h1>
              <p className="text-gray-600 mt-1">실시간 고객 행동 분석 및 인사이트</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                리포트 다운로드
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 90일</option>
                <option value="1year">최근 1년</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">전체 매장</option>
                <option value="강남점">강남점</option>
                <option value="홍대점">홍대점</option>
                <option value="신촌점">신촌점</option>
              </select>
            </div>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              고급 필터
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 방문객</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalVisitors.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12.5%
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">신규 고객</p>
                  <p className="text-3xl font-bold text-green-600">{stats.newVisitors.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +8.3%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">재방문율</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.returningRate}%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +3.2%
                  </p>
                </div>
                <ThumbsUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 만족도</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.avgSatisfaction}</p>
                  <p className="text-xs text-gray-500 mt-1">/ 5.0</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 매출</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(stats.totalRevenue / 10000).toFixed(0)}만원
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +15.7%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI 인사이트 및 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map(insight => (
                <div
                  key={insight.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          {getImpactBadge(insight.impact)}
                        </div>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm">조치하기</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Visitor Trend */}
          <Card>
            <CardHeader>
              <CardTitle>방문객 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={visitorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="newVisitors"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    name="신규 고객"
                  />
                  <Area
                    type="monotone"
                    dataKey="returning"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    name="재방문 고객"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Visits */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 방문</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyVisitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="방문객 수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>연령대별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ageDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ageDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Satisfaction Radar */}
          <Card>
            <CardHeader>
              <CardTitle>고객 만족도 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={satisfactionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="만족도"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Customer Segments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>고객 세그먼트 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerSegments.map(segment => (
                <div
                  key={segment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{segment.name}</h3>
                    <Badge className="bg-blue-100 text-blue-700" variant="outline">
                      {segment.percentage}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">고객 수</p>
                      <p className="font-bold text-xl">{segment.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">평균 지출</p>
                      <p className="font-bold text-xl">
                        {(segment.avgSpending / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">방문 빈도</p>
                      <p className="font-bold text-xl">{segment.visitFrequency}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">특징</p>
                    <div className="flex flex-wrap gap-2">
                      {segment.characteristics.map((char, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Contribution */}
        <Card>
          <CardHeader>
            <CardTitle>세그먼트별 매출 기여도</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueContributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="segment" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3B82F6" name="매출 (원)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerAnalytics;

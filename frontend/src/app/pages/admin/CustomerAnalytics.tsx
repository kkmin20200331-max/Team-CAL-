import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudSun,
  Download,
  LineChart as LineChartIcon,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const branchNames: Record<string, string> = {
  migeum: '컴포즈 미금점',
  sunae: '컴포즈 수내점',
  dongcheon: '컴포즈 동천점'
};

const trafficByHour = [
  { time: '09:00', visitors: 18, sales: 21, staff: 1, recommended: 1 },
  { time: '10:00', visitors: 24, sales: 27, staff: 1, recommended: 1 },
  { time: '11:00', visitors: 38, sales: 41, staff: 2, recommended: 2 },
  { time: '12:00', visitors: 72, sales: 78, staff: 3, recommended: 3 },
  { time: '13:00', visitors: 68, sales: 73, staff: 3, recommended: 3 },
  { time: '14:00', visitors: 42, sales: 39, staff: 2, recommended: 2 },
  { time: '15:00', visitors: 34, sales: 28, staff: 2, recommended: 2 },
  { time: '16:00', visitors: 39, sales: 33, staff: 2, recommended: 2 },
  { time: '17:00', visitors: 58, sales: 51, staff: 2, recommended: 3 },
  { time: '18:00', visitors: 86, sales: 80, staff: 2, recommended: 4 },
  { time: '19:00', visitors: 94, sales: 87, staff: 3, recommended: 4 },
  { time: '20:00', visitors: 76, sales: 70, staff: 3, recommended: 3 },
  { time: '21:00', visitors: 48, sales: 42, staff: 2, recommended: 2 }
];

const weeklyPattern = [
  { day: '월', morning: 45, lunch: 132, evening: 168 },
  { day: '화', morning: 42, lunch: 118, evening: 154 },
  { day: '수', morning: 48, lunch: 126, evening: 172 },
  { day: '목', morning: 53, lunch: 141, evening: 188 },
  { day: '금', morning: 58, lunch: 156, evening: 238 },
  { day: '토', morning: 74, lunch: 184, evening: 252 },
  { day: '일', morning: 69, lunch: 176, evening: 214 }
];

const flowSources = [
  { name: 'CCTV 집계', value: 46, color: '#2563eb' },
  { name: 'POS 매출', value: 31, color: '#16a34a' },
  { name: '스케줄', value: 15, color: '#f97316' },
  { name: '외부요인', value: 8, color: '#7c3aed' }
];

const aiInsights = [
  {
    label: '인력 부족 예상',
    title: '오늘 18:00-20:00 응대 지연 가능성이 높습니다',
    body: '최근 4주 금요일 저녁 방문 흐름과 오늘 예약/날씨 조건을 합산하면 피크 구간 방문량이 평소보다 24% 높게 예상됩니다.',
    action: '홀 1명 추가 배치',
    impact: '높음'
  },
  {
    label: '전환율 점검',
    title: '15:00-17:00 방문 대비 매출 전환이 낮습니다',
    body: '방문 흐름은 유지되지만 주문 건수는 같은 시간대 평균보다 낮습니다. 직원 증원보다 메뉴 노출이나 세트 안내 점검이 우선입니다.',
    action: '프로모션 배너 점검',
    impact: '보통'
  },
  {
    label: '스케줄 최적화',
    title: '점심 피크 이후 휴게 분산이 필요합니다',
    body: '12:00-14:00 집중 근무 후 14:30에 휴게가 몰려 16:00 준비 업무가 부족해질 수 있습니다.',
    action: '휴게 30분 분산',
    impact: '보통'
  }
];

const scheduleRecommendations = [
  { time: '11:00-14:00', current: '3명', recommended: '3명', status: '적정', reason: '점심 방문량과 POS 주문량이 균형적입니다.' },
  { time: '17:00-18:00', current: '2명', recommended: '3명', status: '보강', reason: '퇴근 전 유입이 빠르게 증가하는 전환 구간입니다.' },
  { time: '18:00-20:00', current: '2-3명', recommended: '4명', status: '긴급', reason: '방문량, 매출, 날씨, 주변 행사 지표가 모두 상승 방향입니다.' },
  { time: '20:00-21:00', current: '3명', recommended: '3명', status: '유지', reason: '피크 이후 정리 업무까지 현 배치로 대응 가능합니다.' }
];

const kpis = [
  { title: '현재 매장 인원', value: '32명', delta: '보통 대비 +18%', icon: Users, tone: 'text-blue-600' },
  { title: '오늘 누적 방문', value: '486명', delta: '전주 같은 요일 +12%', icon: Activity, tone: 'text-emerald-600' },
  { title: '피크 예상', value: '18-20시', delta: '필요 인원 4명', icon: Clock, tone: 'text-orange-600' },
  { title: '방문-매출 전환', value: '82%', delta: '목표 대비 -3%', icon: Wallet, tone: 'text-violet-600' }
];

export default function CustomerAnalytics() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [activeTab, setActiveTab] = useState<'live' | 'pattern' | 'insight' | 'schedule'>('live');

  const currentBranch = branchNames[branchId || 'migeum'] || '선택 매장';
  const peakHour = useMemo(
    () => trafficByHour.reduce((max, row) => (row.visitors > max.visitors ? row : max), trafficByHour[0]),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/dashboard/${branchId || 'migeum'}`)}
              aria-label="대시보드로 돌아가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{currentBranch}</span>
                <ChevronRight className="h-4 w-4" />
                <span>AI 고객 분석</span>
              </div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-950 md:text-3xl">
                <Brain className="h-7 w-7 text-blue-600" />
                실시간 고객 행동 분석 및 인사이트
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                CCTV 집계, POS, 날씨, 근무 데이터를 조합해 방문 흐름과 스케줄 추천을 제공합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              리포트
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <Card key={item.title} className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{item.title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.delta}</p>
                  </div>
                  <item.icon className={`h-6 w-6 ${item.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-lg lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-blue-600" />
                  시간대별 방문 흐름
                </CardTitle>
                <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 text-sm">
                  {[
                    ['live', '실시간'],
                    ['pattern', '패턴'],
                    ['insight', '인사이트'],
                    ['schedule', '스케줄']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value as typeof activeTab)}
                      className={`rounded-md px-3 py-2 font-medium transition ${
                        activeTab === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trafficByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="visitors" name="방문 인원" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Line dataKey="staff" name="현재 배치" stroke="#16a34a" strokeWidth={3} dot={false} />
                    <Line dataKey="recommended" name="추천 인원" stroke="#f97316" strokeWidth={3} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                현재 판단
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-700">가장 혼잡한 시간</p>
                <p className="mt-1 text-3xl font-bold text-orange-950">{peakHour.time}</p>
                <p className="mt-2 text-sm text-orange-800">예상 방문 {peakHour.visitors}명, 추천 배치 {peakHour.recommended}명</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <CloudSun className="mb-2 h-5 w-5 text-sky-600" />
                  <p className="text-sm text-slate-500">날씨 영향</p>
                  <p className="font-semibold">방문 +7%</p>
                </div>
                <div className="rounded-lg border p-3">
                  <Calendar className="mb-2 h-5 w-5 text-violet-600" />
                  <p className="text-sm text-slate-500">주변 일정</p>
                  <p className="font-semibold">행사 있음</p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-slate-700">데이터 조합 비중</p>
                <div className="mt-3 h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={flowSources} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3}>
                        {flowSources.map((source) => (
                          <Cell key={source.name} fill={source.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {activeTab === 'pattern' && (
          <Card className="mb-6 rounded-lg">
            <CardHeader>
              <CardTitle>요일별 방문 패턴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyPattern}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area dataKey="morning" stackId="1" name="오전" stroke="#60a5fa" fill="#93c5fd" />
                    <Area dataKey="lunch" stackId="1" name="점심" stroke="#22c55e" fill="#86efac" />
                    <Area dataKey="evening" stackId="1" name="저녁" stroke="#f97316" fill="#fdba74" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Gemini AI 인사이트 초안
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => (
                <div key={insight.title} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{insight.label}</Badge>
                        <Badge className={insight.impact === '높음' ? 'bg-red-600' : 'bg-amber-500'}>{insight.impact}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-950">{insight.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{insight.body}</p>
                    </div>
                    <Button variant="outline" className="shrink-0 gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {insight.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                운영 지표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['혼잡도', '높음', 'w-[78%]', 'bg-orange-500'],
                ['응대 여유', '주의', 'w-[42%]', 'bg-blue-500'],
                ['매출 전환', '양호', 'w-[82%]', 'bg-emerald-500'],
                ['스케줄 적합도', '보강 필요', 'w-[64%]', 'bg-violet-500']
              ].map(([label, value, width, color]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-950">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${width} ${color}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              AI 스케줄 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-3 font-medium">시간대</th>
                    <th className="py-3 font-medium">현재 배치</th>
                    <th className="py-3 font-medium">추천 배치</th>
                    <th className="py-3 font-medium">상태</th>
                    <th className="py-3 font-medium">추천 이유</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRecommendations.map((row) => (
                    <tr key={row.time} className="border-b last:border-0">
                      <td className="py-4 font-semibold text-slate-950">{row.time}</td>
                      <td className="py-4 text-slate-600">{row.current}</td>
                      <td className="py-4 text-slate-950">{row.recommended}</td>
                      <td className="py-4">
                        <Badge
                          className={
                            row.status === '긴급'
                              ? 'bg-red-600'
                              : row.status === '보강'
                                ? 'bg-orange-500'
                                : 'bg-slate-700'
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-slate-600">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
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
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

type TabKey = 'live' | 'pattern' | 'insight' | 'schedule';

type PeopleLog = {
  id?: string | number;
  record_time?: string;
  recordTime?: string;
  people_count?: number;
  peopleCount?: number;
};

type CctvMetrics = {
  running?: boolean;
  processedFrames?: number;
  droppedFrames?: number;
  lastCustomerCount?: number;
  lastConfidenceAvg?: number;
  lastMeasuredAt?: string;
  queueSize?: number;
};

type CctvAggregate = {
  available?: boolean;
  aggregate?: {
    avgCustomerCount?: number;
    maxCustomerCount?: number;
    minCustomerCount?: number;
    lastCustomerCount?: number;
    sampleCount?: number;
    measuredAt?: string;
  };
};

type TrafficRow = {
  time: string;
  visitors: number;
  recommended: number;
  wait: number;
};

type WeeklyPatternRow = {
  day: string;
  morning: number;
  lunch: number;
  evening: number;
};

type AiInsightResponse = {
  summary?: {
    overallStatus?: string;
    mainMessage?: string;
    riskLevel?: string;
  };
  insights?: Array<{
    id?: string;
    type?: string;
    severity?: string;
    badge?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
    reason?: string;
  }>;
  scheduleRecommendations?: Array<{
    timeRange?: string;
    currentStaff?: number;
    recommendedStaff?: number;
    recommendedExtraStaff?: number;
    status?: string;
    reason?: string;
  }>;
  source?: 'rule-based' | 'dummy' | 'llm' | 'llm-fallback';
};

const API_BASE = 'http://localhost:8080/api';
const AI_INSIGHT_API = `${API_BASE}/ai-insights`;

const branchNames: Record<string, string> = {
  migeum: '컴포즈 미금점',
  sunae: '컴포즈 수내점',
  dongcheon: '컴포즈 동천점'
};

const branchStoreIds: Record<string, number> = {
  migeum: 1,
  sunae: 2,
  dongcheon: 3
};

const branchShiftStoreIds: Record<string, string> = {
  '1': 'V1StGXR8_Z5jdHi6B-myT',
  migeum: 'V1StGXR8_Z5jdHi6B-myT',
  '2': 'N2xY8pQ3_a1BcDeFgH1jK',
  sunae: 'N2xY8pQ3_a1BcDeFgH1jK',
  '3': 'k9L0mN1o_P2qR3sT4uV5w',
  dongcheon: 'k9L0mN1o_P2qR3sT4uV5w'
};

const fallbackTraffic: TrafficRow[] = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 8;
  return {
    time: `${String(hour).padStart(2, '0')}:00`,
    visitors: 0,
    recommended: 1,
    wait: 0
  };
});

const fallbackWeeklyPattern: WeeklyPatternRow[] = [
  { day: '월', morning: 0, lunch: 0, evening: 0 },
  { day: '화', morning: 0, lunch: 0, evening: 0 },
  { day: '수', morning: 0, lunch: 0, evening: 0 },
  { day: '목', morning: 0, lunch: 0, evening: 0 },
  { day: '금', morning: 0, lunch: 0, evening: 0 },
  { day: '토', morning: 0, lunch: 0, evening: 0 },
  { day: '일', morning: 0, lunch: 0, evening: 0 }
];

const tabLabels: Array<[TabKey, string]> = [
  ['live', '실시간 현황'],
  ['pattern', '방문 패턴'],
  ['insight', 'AI 인사이트'],
  ['schedule', '스케줄 추천']
];

const resolveStoreId = (branchId?: string) => {
  if (!branchId) return 1;
  const numericId = Number(branchId);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return branchStoreIds[branchId] || 1;
};

const resolveShiftStoreId = (branchId?: string) => {
  if (!branchId) return 'V1StGXR8_Z5jdHi6B-myT';
  return branchShiftStoreIds[branchId] || branchId;
};

const toDateText = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPeopleCount = (log: PeopleLog) => Number(log.people_count ?? log.peopleCount ?? 0);

const getRecordTime = (log: PeopleLog) => String(log.record_time ?? log.recordTime ?? '');

const getMinutesFromDateTime = (value?: string) => {
  const time = value?.includes(' ') ? value.split(' ')[1] : value;
  const [hour = '0', minute = '0'] = (time || '').split(':');
  return Number(hour) * 60 + Number(minute);
};

const buildTrafficByHour = (logs: PeopleLog[]): TrafficRow[] => {
  if (logs.length === 0) return fallbackTraffic;

  const latestByHour = new Map<number, number>();
  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(' ', 'T')) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    latestByHour.set(date.getHours(), getPeopleCount(log));
  });

  return fallbackTraffic.map((row, index) => {
    const hour = index + 8;
    const visitors = latestByHour.get(hour) ?? 0;
    return {
      ...row,
      visitors,
      recommended: Math.max(1, Math.ceil(visitors / 25)),
      wait: Math.max(0, Math.ceil(visitors / 8))
    };
  });
};

const buildWeeklyPattern = (logs: PeopleLog[]): WeeklyPatternRow[] => {
  if (logs.length === 0) return fallbackWeeklyPattern;

  const rows = fallbackWeeklyPattern.map((row) => ({ ...row }));

  logs.forEach((log) => {
    const recordTime = getRecordTime(log);
    const date = recordTime ? new Date(recordTime.replace(' ', 'T')) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const hour = date.getHours();
    const count = getPeopleCount(log);

    if (hour >= 9 && hour < 11) rows[dayIndex].morning += count;
    if (hour >= 11 && hour < 14) rows[dayIndex].lunch += count;
    if (hour >= 18 && hour <= 20) rows[dayIndex].evening += count;
  });

  return rows;
};

const riskLevel = (count: number) => {
  if (count >= 30) return '높음';
  if (count >= 15) return '주의';
  return '정상';
};

const severityClass = (severity?: string) => {
  if (severity === 'HIGH' || severity === '높음' || severity === '긴급') return 'bg-red-600';
  if (severity === 'MEDIUM' || severity === '주의' || severity === 'WATCH' || severity === '보강') return 'bg-amber-500';
  return 'bg-emerald-600';
};

export default function CustomerAnalytics() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>('live');
  const [peopleLogs, setPeopleLogs] = useState<PeopleLog[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<PeopleLog[]>([]);
  const [metrics, setMetrics] = useState<CctvMetrics | null>(null);
  const [aggregate, setAggregate] = useState<CctvAggregate | null>(null);
  const [aiResult, setAiResult] = useState<AiInsightResponse | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState('-');
  const [syncError, setSyncError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const storeId = resolveStoreId(branchId);
  const currentBranch = branchNames[branchId || 'migeum'] || localStorage.getItem('store_name') || '선택 매장';
  const trafficByHour = useMemo(() => buildTrafficByHour(peopleLogs), [peopleLogs]);
  const weeklyPattern = useMemo(() => buildWeeklyPattern(weeklyLogs), [weeklyLogs]);
  const peakHour = useMemo(
    () => trafficByHour.reduce((max, row) => (row.visitors > max.visitors ? row : max), trafficByHour[0]),
    [trafficByHour]
  );
  const todayTotalVisitors = useMemo(
    () => peopleLogs.reduce((sum, log) => sum + getPeopleCount(log), 0),
    [peopleLogs]
  );
  const currentCount = metrics?.lastCustomerCount ?? aggregate?.aggregate?.lastCustomerCount ?? 0;
  const avgCount = aggregate?.aggregate?.avgCustomerCount ?? 0;
  const maxCount = aggregate?.aggregate?.maxCustomerCount ?? peakHour.visitors;

  /*
  Previous client-side AI payload builder removed.
    storeId,
    storeName: currentBranch,
    storeType: 'CAFE',
    storeTypeLabel: '카페',
    date: toDateText(new Date()),
    current: {
      currentCustomerCount: currentCount,
      todayTotalVisitors,
      conversionRate: 0,
      processedFrames: metrics?.processedFrames ?? 0,
      confidenceAvg: metrics?.lastConfidenceAvg ?? 0
    },
    cameraAggregates: [],
    historicalBaseline: {
      sameDayAverageVisitors: Math.max(todayTotalVisitors, 1),
      averagePeakCustomerCount: Math.max(maxCount, 1)
    },
    pos: {
      conversionRate: 0,
      hourlyOrders: trafficByHour.map((row) => ({
        time: row.time,
        orderCount: 0,
        conversionRate: 0
      }))
    },
    staffSchedule: [],
    externalFactors: {
      source: 'cctv-metrics-people-log',
      aggregate
    }
  });

  */
  const fallbackInsights = [
    {
      label: '혼잡도',
      title: `현재 매장 위험도는 ${riskLevel(currentCount)}입니다`,
      body: `최근 집계 평균은 ${avgCount}명, 최대 인원은 ${maxCount}명입니다. CCTV 분석 루프의 최신 값을 기준으로 판단했습니다.`,
      action: currentCount >= 15 ? '인력 배치 확인' : '현재 배치 유지',
      impact: riskLevel(currentCount)
    },
    {
      label: '분석 상태',
      title: metrics?.running ? 'OpenCV 분석이 실행 중입니다' : 'OpenCV 분석이 대기 중입니다',
      body: `처리 프레임 ${metrics?.processedFrames ?? 0}개, 드롭 프레임 ${metrics?.droppedFrames ?? 0}개, 큐 ${metrics?.queueSize ?? 0}개입니다.`,
      action: metrics?.running ? '모니터링 계속' : 'CCTV 분석 시작',
      impact: metrics?.running ? '정상' : '주의'
    }
  ];

  const renderedInsights =
    aiResult?.insights?.map((insight) => ({
      label: insight.badge || insight.type || 'AI',
      title: insight.title || '-',
      body: insight.message || insight.reason || '-',
      action: insight.actionLabel || '확인',
      impact: insight.severity || 'LOW'
    })) || fallbackInsights;

  const scheduleRecommendations =
    aiResult?.scheduleRecommendations?.map((row) => ({
      time: row.timeRange || peakHour.time,
      current: row.currentStaff ?? currentCount,
      recommended: row.recommendedStaff ?? Math.max(1, Math.ceil(maxCount / 25)),
      status: row.status || 'NORMAL',
      reason: row.reason || 'AI 분석 결과입니다.'
    })) || [
      {
        time: peakHour.time,
        current: currentCount,
        recommended: Math.max(1, Math.ceil(maxCount / 25)),
        status: maxCount >= 30 ? 'URGENT' : maxCount >= 15 ? 'WATCH' : 'NORMAL',
        reason: `최신 CCTV 집계 최대 인원 ${maxCount}명을 기준으로 계산했습니다.`
      }
    ];

  const kpis = [
    {
      title: '현재 매장 인원',
      value: `${currentCount}명`,
      delta: `${metrics?.running ? '분석 실행 중' : '분석 대기'} | ${lastSyncedAt}`,
      icon: Users,
      tone: 'text-blue-600'
    },
    {
      title: '오늘 누적 로그',
      value: `${todayTotalVisitors}명`,
      delta: `people_log ${peopleLogs.length}건`,
      icon: Activity,
      tone: 'text-emerald-600'
    },
    {
      title: 'AI 응답 출처',
      value: aiResult?.source === 'llm' ? 'OpenAI' : aiResult?.source || '대기',
      delta: aiResult?.summary?.riskLevel ? `risk ${aiResult.summary.riskLevel}` : '새로고침으로 분석',
      icon: Brain,
      tone: 'text-orange-600'
    },
    {
      title: 'AI 처리 프레임',
      value: `${metrics?.processedFrames ?? 0}`,
      delta: `confidence ${metrics?.lastConfidenceAvg ?? 0}`,
      icon: Wallet,
      tone: 'text-violet-600'
    }
  ];

  const operatingMetrics = [
    { label: '혼잡도', value: riskLevel(currentCount), width: `${Math.min(100, currentCount * 3)}%`, color: 'bg-orange-500' },
    { label: '분석 신뢰도', value: String(metrics?.lastConfidenceAvg ?? 0), width: `${Math.round((metrics?.lastConfidenceAvg ?? 0) * 100)}%`, color: 'bg-blue-500' },
    { label: '처리 프레임', value: String(metrics?.processedFrames ?? 0), width: `${Math.min(100, (metrics?.processedFrames ?? 0) / 10)}%`, color: 'bg-emerald-500' },
    { label: '전송 샘플', value: String(aggregate?.aggregate?.sampleCount ?? 0), width: `${Math.min(100, (aggregate?.aggregate?.sampleCount ?? 0) * 8)}%`, color: 'bg-violet-500' }
  ];

  const loadLiveData = async () => {
    const today = toDateText(new Date());
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const query = new URLSearchParams({
      store_id: String(storeId),
      start_date: `${today} 00:00:00`,
      end_date: `${today} 23:59:59`
    });
    const weeklyQuery = new URLSearchParams({
      store_id: String(storeId),
      start_date: `${toDateText(weekStart)} 00:00:00`,
      end_date: `${toDateText(weekEnd)} 23:59:59`
    });
    const [logsRes, metricsRes, aggregateRes, weeklyLogsRes] = await Promise.all([
      fetch(`${API_BASE}/people_log?${query.toString()}`),
      fetch(`${API_BASE}/cctv/metrics`),
      fetch(`${API_BASE}/cctv/aggregate/latest`),
      fetch(`${API_BASE}/people_log?${weeklyQuery.toString()}`)
    ]);

    if (!logsRes.ok || !metricsRes.ok || !aggregateRes.ok || !weeklyLogsRes.ok) {
      throw new Error('실시간 분석 데이터를 불러오지 못했습니다.');
    }

    const [logsData, metricsData, aggregateData, weeklyLogsData] = await Promise.all([
      logsRes.json(),
      metricsRes.json(),
      aggregateRes.json(),
      weeklyLogsRes.json()
    ]);

    setPeopleLogs(Array.isArray(logsData) ? logsData : []);
    setWeeklyLogs(Array.isArray(weeklyLogsData) ? weeklyLogsData : []);
    setMetrics(metricsData);
    setAggregate(aggregateData);
    setLastSyncedAt(
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );
    setSyncError('');

    return { logsData, metricsData, aggregateData };
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      await loadLiveData();
      const today = toDateText(new Date());
      const response = await fetch(`${AI_INSIGHT_API}/analyze/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: String(storeId),
          shift_store_id: resolveShiftStoreId(branchId),
          date: today,
          start_date: `${today} 00:00:00`,
          end_date: `${today} 23:59:59`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI 인사이트 분석 요청에 실패했습니다. (${response.status}) ${errorText}`);
      }

      setAiResult(await response.json());
      setSyncError('');
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'OpenAI 인사이트 분석 실패');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        await loadLiveData();
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : '실시간 분석 데이터 동기화 실패');
        }
      }
    };

    sync();
    const intervalId = window.setInterval(sync, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [storeId]);

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
                운영 데이터는 5초마다 동기화하고, 새로고침 버튼은 OpenAI/LLM 인사이트 분석까지 실행합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={runAiAnalysis} disabled={aiLoading}>
              <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'AI 분석 중' : '새로고침'}
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              리포트
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {syncError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {syncError}
          </div>
        )}

        {aiResult?.summary && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">{aiResult.source === 'llm' ? 'OpenAI 분석' : 'AI fallback 분석'}:</span>{' '}
            {aiResult.summary.mainMessage}
          </div>
        )}

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
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm md:grid-cols-4">
                  {tabLabels.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value)}
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
                    <Line dataKey="recommended" name="추천 인원" stroke="#f97316" strokeWidth={3} strokeDasharray="5 5" />
                    <Line dataKey="wait" name="예상 대기" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                현재 진단
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-700">가장 혼잡한 시간</p>
                <p className="mt-1 text-3xl font-bold text-orange-950">{peakHour.time}</p>
                <p className="mt-2 text-sm text-orange-800">
                  방문 {peakHour.visitors}명, 추천 배치 {peakHour.recommended}명, 예상 대기 {peakHour.wait}분
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <Calendar className="mb-2 h-5 w-5 text-blue-600" />
                  <p className="text-sm text-slate-500">마지막 분석</p>
                  <p className="font-semibold">{metrics?.lastMeasuredAt ? metrics.lastMeasuredAt.slice(11, 19) : '-'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <Wallet className="mb-2 h-5 w-5 text-blue-600" />
                  <p className="text-sm text-slate-500">AI 출처</p>
                  <p className="font-semibold">{aiResult?.source || '대기'}</p>
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
                AI 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderedInsights.map((insight) => (
                <div key={insight.title} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{insight.label}</Badge>
                        <Badge className={severityClass(insight.impact)}>{insight.impact}</Badge>
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
              {operatingMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{metric.label}</span>
                    <span className="font-medium text-slate-950">{metric.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${metric.color}`} style={{ width: metric.width }} />
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
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-3 font-medium">시간대</th>
                    <th className="py-3 font-medium">현재 인원</th>
                    <th className="py-3 font-medium">추천 배치</th>
                    <th className="py-3 font-medium">상태</th>
                    <th className="py-3 font-medium">추천 이유</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRecommendations.map((row) => (
                    <tr key={row.time} className="border-b last:border-0">
                      <td className="py-4 font-semibold text-slate-950">{row.time}</td>
                      <td className="py-4 text-slate-600">{row.current}명</td>
                      <td className="py-4 text-slate-950">{row.recommended}명</td>
                      <td className="py-4">
                        <Badge className={severityClass(row.status)}>{row.status}</Badge>
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

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Clock,
  Eye,
  Gauge,
  MapPin,
  Play,
  Radio,
  RotateCw,
  Save,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Video
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';

type SourceType = 'WEBCAM' | 'RTSP' | 'VIDEO_FILE';

type CameraConfig = {
  cameraId: string;
  name: string;
  location: string;
  source: string;
  sourceType: SourceType;
  intervalSec: number;
  aggregationIntervalSec: number;
  modelName: string;
  imageSize: number;
  confidence: number;
  crowdDetection: boolean;
  queueDetection: boolean;
  staffDetection: boolean;
  safetyDetection: boolean;
};

type CameraStartPayload = {
  storeId: number;
  cameraId: string;
  source: string;
  sourceType: SourceType;
  intervalSec: number;
  aggregationIntervalSec: number;
  modelName: string;
  imageSize: number;
  confidence: number;
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

const CCTV_API = 'http://localhost:8080/api/cctv';

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

const initialConfig: CameraConfig = {
  cameraId: 'CAM-001',
  name: '출입구 메인 CCTV',
  location: '1층 출입구',
  source: '0',
  sourceType: 'WEBCAM',
  intervalSec: 5,
  aggregationIntervalSec: 60,
  modelName: 'yolo11s',
  imageSize: 640,
  confidence: 0.3,
  crowdDetection: true,
  queueDetection: true,
  staffDetection: true,
  safetyDetection: false
};

const recentEvents = [
  { time: '14:28', title: '입장 고객 6명 감지', tone: 'bg-blue-600' },
  { time: '14:24', title: '대기열 4명 이상 유지', tone: 'bg-orange-500' },
  { time: '14:17', title: '카운터 근무자 2명 확인', tone: 'bg-emerald-600' },
  { time: '14:09', title: '혼잡도 정상 범위 복귀', tone: 'bg-slate-600' }
];

const resolveStoreId = (branchId?: string) => {
  if (!branchId) return 1;
  const numericId = Number(branchId);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return branchStoreIds[branchId] || 1;
};

export default function CctvAnalysis() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('-');
  const [metrics, setMetrics] = useState<CctvMetrics | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState('저장 전');
  const [lastResponse, setLastResponse] = useState('응답 대기');
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState<CameraConfig>(initialConfig);

  const storeId = resolveStoreId(branchId);
  const currentBranch = branchNames[branchId || 'migeum'] || localStorage.getItem('store_name') || '선택 매장';

  const startPayload = useMemo<CameraStartPayload>(
    () => ({
      storeId,
      cameraId: config.cameraId,
      source: config.source,
      sourceType: config.sourceType,
      intervalSec: config.intervalSec,
      aggregationIntervalSec: config.aggregationIntervalSec,
      modelName: config.modelName,
      imageSize: config.imageSize,
      confidence: config.confidence
    }),
    [config, storeId]
  );

  const activeDetections = useMemo(
    () =>
      [
        config.crowdDetection,
        config.queueDetection,
        config.staffDetection,
        config.safetyDetection
      ].filter(Boolean).length,
    [config]
  );

  const updateConfig = <K extends keyof CameraConfig>(key: K, value: CameraConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const parseJsonOrText = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  const requestCctv = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${CCTV_API}${path}`, options);
    const data = await parseJsonOrText(response);

    if (!response.ok) {
      const message =
        typeof data?.detail === 'string'
          ? data.detail
          : Array.isArray(data?.detail)
            ? data.detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.join('.')}: ${item.msg}`).join(', ')
            : data?.message || 'CCTV API 요청 실패';
      throw new Error(message);
    }

    return data;
  };

  useEffect(() => {
    let cancelled = false;

    const syncServerStatus = async () => {
      try {
        const [statusData, metricsData] = await Promise.all([
          requestCctv('/status'),
          requestCctv('/metrics')
        ]);

        if (cancelled) return;

        setIsRunning(Boolean(metricsData?.running ?? statusData?.running));
        setMetrics(metricsData);
        setLastSyncedAt(
          new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
        setLastResponse(JSON.stringify({ status: statusData, metrics: metricsData }, null, 2));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'CCTV 상태 동기화 실패';
        setErrorMessage(message);
      }
    };

    syncServerStatus();
    const intervalId = window.setInterval(syncServerStatus, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSave = () => {
    setLastSavedAt(
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await requestCctv('/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(startPayload)
      });

      setIsRunning(Boolean(data?.running ?? true));
      setLastResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 시작 요청 실패';
      setErrorMessage(message);
      setLastResponse(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await requestCctv('/stop', {
        method: 'POST'
      });

      setIsRunning(Boolean(data?.running));
      setLastResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 중지 요청 실패';
      setErrorMessage(message);
      setLastResponse(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <span>CCTV 분석</span>
              </div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-950 md:text-3xl">
                <Video className="h-7 w-7 text-blue-600" />
                CCTV 분석 제어
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                분석 시작 시 Spring 백엔드로 JSON body를 전송하고, Spring이 OpenCV 서버의 카메라 루프를 실행합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              설정 저장
            </Button>
            <Button
              className={`gap-2 ${isRunning ? 'bg-red-600 hover:bg-red-700' : ''}`}
              disabled={isSubmitting}
              onClick={isRunning ? handleStop : handleStart}
            >
              {isRunning ? <CircleStop className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSubmitting ? '요청 중' : isRunning ? '분석 중지' : '분석 시작'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">분석 상태</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {isRunning ? '실행 중' : '대기 중'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {isRunning ? `서버 동기화 ${lastSyncedAt}` : '시작 버튼으로 API 호출'}
                  </p>
                </div>
                <Badge className={isRunning ? 'bg-emerald-600' : 'bg-slate-600'}>
                  {isRunning ? 'LIVE' : 'STOP'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Store ID</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{storeId}</p>
                  <p className="mt-2 text-sm text-slate-500">요청 body에 포함</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">샘플링 주기</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{config.intervalSec}초</p>
                  <p className="mt-2 text-sm text-slate-500">집계 {config.aggregationIntervalSec}초</p>
                </div>
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">감지 옵션</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{activeDetections}개</p>
                  <p className="mt-2 text-sm text-slate-500">마지막 저장 {lastSavedAt}</p>
                </div>
                <SlidersHorizontal className="h-6 w-6 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                실시간 카메라
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-slate-950">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(30,64,175,0.28),rgba(15,23,42,0.08)),repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_36px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_48px)]" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className={isRunning ? 'bg-red-600' : 'bg-slate-700'}>
                    {isRunning ? 'REC' : 'OFF'}
                  </Badge>
                  <Badge variant="secondary">{config.sourceType}</Badge>
                  <Badge variant="secondary">{config.modelName}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    ['count', metrics?.lastCustomerCount ?? '-'],
                    ['frames', metrics?.processedFrames ?? '-'],
                    ['confidence', metrics?.lastConfidenceAvg ?? config.confidence]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-3 text-white backdrop-blur">
                      <p className="text-xs text-white/70">{label}</p>
                      <p className="mt-1 truncate text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                    {isRunning ? <Eye className="h-10 w-10" /> : <Radio className="h-10 w-10" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-700" />
                카메라 시작 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="camera-id">카메라 ID</Label>
                <Input
                  id="camera-id"
                  value={config.cameraId}
                  onChange={(event) => updateConfig('cameraId', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>소스 타입</Label>
                <Select value={config.sourceType} onValueChange={(value) => updateConfig('sourceType', value as SourceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBCAM">WEBCAM</SelectItem>
                    <SelectItem value="RTSP">RTSP</SelectItem>
                    <SelectItem value="VIDEO_FILE">VIDEO_FILE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">소스</Label>
                <Input
                  id="source"
                  value={config.source}
                  onChange={(event) => updateConfig('source', event.target.value)}
                  placeholder="웹캠은 0, RTSP는 rtsp://..., 파일은 test_assets/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interval-sec">샘플링 초</Label>
                  <Input
                    id="interval-sec"
                    type="number"
                    min={1}
                    max={3600}
                    value={config.intervalSec}
                    onChange={(event) => updateConfig('intervalSec', Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aggregation-sec">집계 초</Label>
                  <Input
                    id="aggregation-sec"
                    type="number"
                    min={1}
                    max={3600}
                    value={config.aggregationIntervalSec}
                    onChange={(event) => updateConfig('aggregationIntervalSec', Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>모델</Label>
                  <Select value={config.modelName} onValueChange={(value) => updateConfig('modelName', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yolo11s">yolo11s</SelectItem>
                      <SelectItem value="yolov8n">yolov8n</SelectItem>
                      <SelectItem value="yolov8s">yolov8s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>이미지 크기</Label>
                  <Select value={String(config.imageSize)} onValueChange={(value) => updateConfig('imageSize', Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="640">640</SelectItem>
                      <SelectItem value="960">960</SelectItem>
                      <SelectItem value="1280">1280</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence">confidence</Label>
                  <span className="text-sm font-medium text-slate-700">{config.confidence}</span>
                </div>
                <Input
                  id="confidence"
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={config.confidence}
                  onChange={(event) => updateConfig('confidence', Number(event.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-emerald-600" />
                분석 옵션
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { key: 'crowdDetection', title: '매장 혼잡도 감지', description: '입장/퇴장과 체류 인원을 집계합니다.', icon: Users },
                { key: 'queueDetection', title: '대기열 감지', description: '계산대 앞 대기 인원과 예상 시간을 추정합니다.', icon: Clock },
                { key: 'staffDetection', title: '근무자 배치 감지', description: '카운터와 홀 근무자 수를 확인합니다.', icon: CheckCircle2 },
                { key: 'safetyDetection', title: '안전 이벤트 감지', description: '넘어짐, 장시간 정체 같은 이상 상황을 표시합니다.', icon: ShieldAlert }
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 rounded-lg border bg-white p-4">
                  <div className="flex gap-3">
                    <item.icon className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(config[item.key as keyof CameraConfig])}
                    onCheckedChange={(checked) => updateConfig(item.key as keyof CameraConfig, checked as never)}
                    aria-label={item.title}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="h-5 w-5 text-orange-500" />
                요청/응답 확인
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {config.location}
                </div>
                <p className="mt-2 font-semibold text-slate-950">{config.name}</p>
                <p className="mt-1 text-sm text-slate-500">POST {CCTV_API}/start</p>
              </div>
              <div className="rounded-lg border bg-slate-950 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-300">start body</p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-emerald-100">
                  {JSON.stringify(startPayload, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">last response</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                  {lastResponse}
                </pre>
              </div>
              {recentEvents.map((event) => (
                <div key={`${event.time}-${event.title}`} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isRunning ? event.tone : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-950">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{isRunning ? event.time : '분석 대기'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

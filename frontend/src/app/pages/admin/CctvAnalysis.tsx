import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Camera,
  CircleStop,
  Clock,
  Eye,
  MapPin,
  Play,
  Radio,
  RotateCw,
  Save,
  Settings,
  Users,
  Video,
  Calendar,
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

type SourceType = "WEBCAM" | "RTSP" | "VIDEO_FILE";

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
};

type CameraStartPayload = {
  storeId: string;
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

type CctvStatus = CctvMetrics & {
  annotatedImage?: string;
  statusMessage?: string;
  lastError?: string;
};

const CCTV_API = "http://localhost:8080/api/cctv";
const OPENCV_CAMERA_STREAM = "http://localhost:8000/api/v1/camera/stream";

const initialConfig: CameraConfig = {
  cameraId: "CAM-001",
  name: "출입구 메인 CCTV",
  location: "1층 출입구",
  source: "0",
  sourceType: "WEBCAM",
  intervalSec: 5,
  aggregationIntervalSec: 60,
  modelName: "yolo11s",
  imageSize: 640,
  confidence: 0.3,
};

export default function CctvAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
    { icon: Video, label: 'CCTV 분석', path: `/admin/cctv/${branchId}` },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`http://localhost:8080/api/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("-");
  const [metrics, setMetrics] = useState<CctvMetrics | null>(null);
  const [cameraFrame, setCameraFrame] = useState("");
  const [cameraStatusMessage, setCameraStatusMessage] = useState("");
  const [streamNonce, setStreamNonce] = useState(Date.now());
  const [lastSavedAt, setLastSavedAt] = useState("저장 전");
  const [lastResponse, setLastResponse] = useState("응답 대기");
  const [errorMessage, setErrorMessage] = useState("");
  const storeId = branchId || sessionStorage.getItem("store_id") || "";
  const CONFIG_KEY = `cctv_config_${storeId}`;
  const [config, setConfig] = useState<CameraConfig>(() => {
    try {
      const saved = localStorage.getItem(`cctv_config_${branchId || sessionStorage.getItem("store_id") || ""}`);
      return saved ? { ...initialConfig, ...JSON.parse(saved) } : initialConfig;
    } catch { return initialConfig; }
  });
  const currentBranch =
    stores.find((s) => s.id === storeId)?.name ||
    sessionStorage.getItem("store_name") ||
    "선택 매장";

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
      confidence: config.confidence,
    }),
    [config, storeId],
  );

  const updateConfig = <K extends keyof CameraConfig>(
    key: K,
    value: CameraConfig[K],
  ) => {
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
        typeof data?.detail === "string"
          ? data.detail
          : Array.isArray(data?.detail)
            ? data.detail
                .map(
                  (item: { loc?: string[]; msg?: string }) =>
                    `${item.loc?.join(".")}: ${item.msg}`,
                )
                .join(", ")
            : data?.message || "CCTV API 요청 실패";
      throw new Error(message);
    }

    return data;
  };

  useEffect(() => {
    let cancelled = false;

    const syncServerStatus = async () => {
      try {
        const [statusData, metricsData] = await Promise.all([
          requestCctv("/status"),
          requestCctv("/metrics"),
        ]);

        if (cancelled) return;

        const status = statusData as CctvStatus;

        setIsRunning(Boolean(metricsData?.running ?? status.running));
        setMetrics(metricsData);
        setCameraFrame(status.annotatedImage || "");
        setCameraStatusMessage(status.lastError || status.statusMessage || "");
        setLastSyncedAt(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
        setLastResponse(
          JSON.stringify({ status: statusData, metrics: metricsData }, null, 2),
        );
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "CCTV 상태 동기화 실패";
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
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch {}
    setLastSavedAt(
      new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    );
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const data = await requestCctv("/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(startPayload),
      });

      setIsRunning(Boolean(data?.running ?? true));
      setStreamNonce(Date.now());
      setLastResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "분석 시작 요청 실패";
      setErrorMessage(message);
      setLastResponse(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const data = await requestCctv("/stop", {
        method: "POST",
      });

      setIsRunning(Boolean(data?.running));
      setStreamNonce(Date.now());
      setLastResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "분석 중지 요청 실패";
      setErrorMessage(message);
      setLastResponse(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)', fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* 사이드바 */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', background: isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)', borderRadius: 20, border: `1px solid ${isDark ? '#3a3a3c' : BORDER_GREEN}`, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#3a3a3c' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: isDark ? '#2c2c2e' : '#fff', border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {stores.map(s => (
                  <div key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); navigate(`/admin/dashboard/${s.id}`); setBranchDropdownOpen(false); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: isDark ? '#fff' : '#111', borderBottom: `1px solid ${isDark ? '#3a3a3c' : LIGHT_GREEN}` }}>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname.startsWith(`/admin/cctv/`) ? label === 'CCTV 분석' : (location.pathname === path || location.pathname.startsWith(path));
            return (
              <button key={label} onClick={() => navigate(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, background: isActive ? GREEN : 'transparent', color: isActive ? '#fff' : (isDark ? '#fff' : '#111'), transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, display: 'flex', alignItems: 'center', gap: 10 }}><Video size={28} />CCTV 분석 제어</h1>
              <p style={{ fontSize: 14, color: isDark ? '#aaa' : '#555', marginTop: 4 }}>{currentBranch} · 실시간 고객 인원 분석</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <Save size={16} />설정 저장
                </button>
                <span style={{ fontSize: 11, color: '#aaa' }}>최근 저장: {lastSavedAt}</span>
              </div>
              <button disabled={isSubmitting} onClick={isRunning ? handleStop : handleStart} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: isRunning ? '#ef4444' : GREEN, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>
                {isRunning ? <CircleStop size={16} /> : <Play size={16} />}
                {isSubmitting ? "요청 중" : isRunning ? "분석 중지" : "분석 시작"}
              </button>
            </div>
          </div>
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
                    {isRunning ? "실행 중" : "대기 중"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {isRunning
                      ? `서버 동기화 ${lastSyncedAt}`
                      : "시작 버튼으로 API 호출"}
                  </p>
                </div>
                <Badge
                  className={isRunning ? "bg-emerald-600" : "bg-slate-600"}
                >
                  {isRunning ? "LIVE" : "STOP"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">분석 매장</p>
                  <p className="mt-2 text-lg font-bold text-slate-950 leading-snug">
                    {currentBranch}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 truncate max-w-[140px]">
                    ID: {storeId || "미설정"}
                  </p>
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
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {config.intervalSec}초
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    집계 {config.aggregationIntervalSec}초
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">최근 측정</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {metrics?.lastCustomerCount ?? "-"}명
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {metrics?.lastMeasuredAt
                      ? new Date(metrics.lastMeasuredAt).toLocaleTimeString()
                      : "수신 대기"}
                  </p>
                </div>
                <Eye className="h-6 w-6 text-violet-600" />
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
                {isRunning ? (
                  <img
                    src={`${OPENCV_CAMERA_STREAM}?t=${streamNonce}`}
                    alt="실시간 CCTV 스트림"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : cameraFrame ? (
                  <img
                    src={cameraFrame}
                    alt="OpenCV가 분석한 최신 CCTV 프레임"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(30,64,175,0.28),rgba(15,23,42,0.08)),repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_36px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_48px)]" />
                )}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className={isRunning ? "bg-red-600" : "bg-slate-700"}>
                    {isRunning ? "REC" : "OFF"}
                  </Badge>
                  <Badge variant="secondary">{config.sourceType}</Badge>
                  <Badge variant="secondary">{config.modelName}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    ["count", metrics?.lastCustomerCount ?? "-"],
                    ["frames", metrics?.processedFrames ?? "-"],
                    [
                      "confidence",
                      metrics?.lastConfidenceAvg ?? config.confidence,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/15 bg-white/10 p-3 text-white backdrop-blur"
                    >
                      <p className="text-xs text-white/70">{label}</p>
                      <p className="mt-1 truncate text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {!isRunning && !cameraFrame && (
                    <div className="rounded-full border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                      {isRunning ? (
                        <Eye className="h-10 w-10" />
                      ) : (
                        <Radio className="h-10 w-10" />
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute right-4 top-4 max-w-[60%] rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-xs text-white backdrop-blur">
                  {isRunning
                    ? `실시간 스트림 ${lastSyncedAt}`
                    : cameraFrame
                      ? `최근 프레임 ${lastSyncedAt}`
                      : cameraStatusMessage ||
                        "분석 시작 후 최신 프레임이 표시됩니다"}
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
                  onChange={(event) =>
                    updateConfig("cameraId", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>소스 타입</Label>
                <Select
                  value={config.sourceType}
                  onValueChange={(value) =>
                    updateConfig("sourceType", value as SourceType)
                  }
                >
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
                  onChange={(event) =>
                    updateConfig("source", event.target.value)
                  }
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
                    onChange={(event) =>
                      updateConfig("intervalSec", Number(event.target.value))
                    }
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
                    onChange={(event) =>
                      updateConfig(
                        "aggregationIntervalSec",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>모델</Label>
                  <Select
                    value={config.modelName}
                    onValueChange={(value) => updateConfig("modelName", value)}
                  >
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
                  <Select
                    value={String(config.imageSize)}
                    onValueChange={(value) =>
                      updateConfig("imageSize", Number(value))
                    }
                  >
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
                  <span className="text-sm font-medium text-slate-700">
                    {config.confidence}
                  </span>
                </div>
                <Input
                  id="confidence"
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={config.confidence}
                  onChange={(event) =>
                    updateConfig("confidence", Number(event.target.value))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
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
                <p className="mt-2 font-semibold text-slate-950">
                  {config.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  POST {CCTV_API}/start
                </p>
              </div>
              <div className="rounded-lg border bg-slate-950 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-300">
                  start body
                </p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-emerald-100">
                  {JSON.stringify(startPayload, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  last response
                </p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                  {lastResponse}
                </pre>
              </div>
              {[
                ["최근 감지 인원", metrics?.lastCustomerCount ?? "-"],
                ["처리 프레임", metrics?.processedFrames ?? "-"],
                ["드롭 프레임", metrics?.droppedFrames ?? "-"],
                ["대기 큐", metrics?.queueSize ?? "-"],
                ["평균 confidence", metrics?.lastConfidenceAvg ?? "-"],
                [
                  "최근 측정 시각",
                  metrics?.lastMeasuredAt
                    ? new Date(metrics.lastMeasuredAt).toLocaleTimeString()
                    : "-",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-950">
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </div>
  );
}

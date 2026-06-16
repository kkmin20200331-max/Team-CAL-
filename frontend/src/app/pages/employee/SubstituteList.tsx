import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  Home, Calendar, QrCode, Wallet, MessageSquare,
  Search, MapPin, Clock, DollarSign,
  AlertCircle, Check, Save,
} from 'lucide-react';
import EmployeeProfilePanel from '../../components/employee/EmployeeProfilePanel';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

/* ─── 타입 ─────────────────────────────────────────── */
interface SubstitutePostVO {
  id: string;
  shift_id: string;
  store_id: string;
  requester_user_id: string;
  reason: string;
  status: string;
  created_at: string;
}
interface ShiftVO {
  id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}
interface SubstituteApplicationVO {
  id: string;
  substitute_post_id: string;
  applicant_user_id: string;
  message: string;
  status: string;
  applied_at: string;
}
interface StoreMemberVo {
  pay_type: string;
  pay_amount: number;
}
interface EnrichedPost extends SubstitutePostVO {
  shift?: ShiftVO;
}

/* ─── 가능 시간 설정 타입 ────────────────────────────── */
interface AvailabilitySetting {
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri')[]; // 선택된 요일들
  start: string; // "09:00"
  end: string;   // "18:00"
}

const DAY_OPTIONS_STATIC: { key: AvailabilitySetting['days'][number] }[] = [
  { key: 'mon' },
  { key: 'tue' },
  { key: 'wed' },
  { key: 'thu' },
  { key: 'fri' },
];

/* ─── 유틸 ─────────────────────────────────────────── */
const getDayName  = (d: string, days: string[]) => { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : days[dt.getDay()]; };
const getDayNum   = (d: string) => d ? (d.split('-')[2] ?? '--') : '--';
const getTimePart = (s: string) => { if (!s) return '--:--'; const p = s.split(' '); return p.length >= 2 ? p[1].slice(0,5) : s.slice(11,16); };
const calcHours   = (s: string, e: string) => {
  if (!s || !e) return 0;
  const toMin = (x: string) => { const t = x.includes(' ') ? x.split(' ')[1] : x.slice(11); const [h,m] = t.split(':').map(Number); return h*60+m; };
  return Math.max(0, (toMin(e) - toMin(s)) / 60);
};
const getUrgency = (d: string): 'high'|'medium'|'low' => {
  if (!d) return 'low';
  const diff = (new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000;
  return diff <= 2 ? 'high' : diff <= 5 ? 'medium' : 'low';
};

/* ─── 컴포넌트 ──────────────────────────────────────── */
export default function SubstituteList() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.substituteList[language];

  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const storeId   = localStorage.getItem('store_id')   || '';
  const storeName = localStorage.getItem('store_name') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<EnrichedPost | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  /* ── 모집중 데이터 ──────────────────────────────── */
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [memberInfo, setMemberInfo] = useState<StoreMemberVo | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  /* ── 가능 시간 설정 ─────────────────────────────── */
  const STORAGE_KEY = `substitute_availability_${user.id ?? 'guest'}`;
  const [availability, setAvailability] = useState<AvailabilitySetting>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : { days: [], start: '09:00', end: '18:00' };
    } catch { return { days: [], start: '09:00', end: '18:00' }; }
  });
  const [savedFlash, setSavedFlash] = useState(false);

  /* ── 모집중 로드 ────────────────────────────────── */
  useEffect(() => {
    if (!storeId) { setLoadingPosts(false); return; }
    API.get('/substitute', { params: { store_id: storeId } })
      .then(async r => {
        const open = (Array.isArray(r.data) ? r.data : []).filter((p: SubstitutePostVO) => p.status === 'open');
        const enriched: EnrichedPost[] = await Promise.all(
          open.map(async (p: SubstitutePostVO) => {
            if (!p.shift_id) return { ...p };
            try { const sr = await API.get(`/shift/${p.shift_id}`); return { ...p, shift: sr.data }; }
            catch { return { ...p }; }
          })
        );
        enriched.sort((a,b) => (a.shift?.work_date ?? '9999').localeCompare(b.shift?.work_date ?? '9999'));
        setPosts(enriched);
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [storeId]);

  useEffect(() => {
    if (!user.id || !storeId) return;
    API.get('/store_member/pay', { params: { user_id: user.id, store_id: storeId } })
      .then(r => setMemberInfo(r.data)).catch(() => {});
  }, [user.id, storeId]);

  useEffect(() => {
    if (!user.id) return;
    API.get('/substitute/staff', { params: { user_id: user.id } })
      .then(r => setAppliedIds(new Set((Array.isArray(r.data) ? r.data : []).map((a: SubstituteApplicationVO) => a.substitute_post_id))))
      .catch(() => {});
  }, [user.id]);

  /* ── 가능 시간 저장 ─────────────────────────────────
     TODO: DB 컬럼(available_days) 추가 후 API로 교체
  ──────────────────────────────────────────────────── */
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const toggleDay = (key: AvailabilitySetting['days'][number]) => {
    setAvailability(prev => ({
      ...prev,
      days: prev.days.includes(key) ? prev.days.filter(d => d !== key) : [...prev.days, key],
    }));
  };

  /* ── 지원하기 ───────────────────────────────────── */
  const confirmApply = () => {
    if (!selectedPost || !user.id) return;
    setApplying(true);
    API.post('/substitute/staff/apply', {
      substitute_post_id: selectedPost.id,
      applicant_user_id: user.id,
      message: '',
      status: 'PENDING',
    })
      .then(() => {
        setAppliedIds(prev => new Set([...prev, selectedPost.id]));
        setApplyDialogOpen(false);
        setSelectedPost(null);
      })
      .catch(() => alert(t.errApply))
      .finally(() => setApplying(false));
  };

  /* ── 긴급도 배지 ─────────────────────────────────── */
  const urgencyBadge = (u: 'high'|'medium'|'low') => {
    if (u === 'high')   return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3"/>{t.urgencyHigh}</Badge>;
    if (u === 'medium') return <Badge className="gap-1 bg-yellow-500"><Clock className="w-3 h-3"/>{t.urgencyMedium}</Badge>;
    return <Badge variant="secondary">{t.urgencyLow}</Badge>;
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.shift?.work_date?.includes(q) || p.reason?.toLowerCase().includes(q) || storeName.toLowerCase().includes(q);
  });

  const bottomNavItems = [
    { icon: Home,         label: t.home,     path: '/employee/home' },
    { icon: Calendar,     label: t.schedule, path: '/employee/schedule' },
    { icon: QrCode,       label: t.checkin,  path: '/employee/checkin' },
    { icon: Wallet,       label: t.payroll,  path: '/employee/payroll' },
    { icon: MessageSquare,label: t.board,    path: '/employee/board' },
  ];

  /* ── 렌더링 ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ─ 헤더 ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 pt-5 pb-6">
        {/* 상단 바: 매장명 | 이름 + 프로필 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-orange-100 font-medium">{storeName}</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-base font-bold leading-tight">{user?.name || t.employee}</p>
              <p className="text-xs text-orange-100">{user?.role || 'STAFF'}</p>
            </div>
            <EmployeeProfilePanel />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-0.5">{t.title}</h1>
        <p className="text-orange-100 text-sm">{t.subtitle}</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ─ 가능 시간 설정 카드 ──────────────────────── */}
        <Card className="border-orange-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-800">{t.availabilitySettings}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* 요일 버튼 */}
            <div>
              <p className="text-xs text-gray-500 mb-2">{t.availableDays}</p>
              <div className="flex gap-2">
                {DAY_OPTIONS_STATIC.map(({ key }, i) => {
                  const label = t.dayOptions[i]?.label ?? key;
                  const active = availability.days.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        active
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 시간 범위 */}
            <div>
              <p className="text-xs text-gray-500 mb-2">{t.availableTime}</p>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={availability.start}
                  onChange={e => setAvailability(p => ({ ...p, start: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <span className="text-gray-400 font-medium shrink-0">~</span>
                <input
                  type="time"
                  value={availability.end}
                  onChange={e => setAvailability(p => ({ ...p, end: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <Button
              className={`w-full transition-all ${
                savedFlash
                  ? 'bg-green-500 hover:bg-green-500'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              }`}
              onClick={handleSave}
            >
              {savedFlash
                ? <><Check className="w-4 h-4 mr-2"/>{t.saved}</>
                : <><Save className="w-4 h-4 mr-2"/>{t.save}</>}
            </Button>
          </CardContent>
        </Card>

        {/* ─ 검색 ────────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10"
            />
          </div>
        </div>

        {/* ─ 모집중 목록 ──────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {t.recruiting} <span className="text-orange-500">{loadingPosts ? '' : filteredPosts.length}</span>
          </p>

          {loadingPosts ? (
            <div className="text-center py-12 text-gray-400">{t.loading}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{t.noOpenings}</div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map(post => {
                const workDate  = post.shift?.work_date ?? '';
                const startTime = post.shift ? getTimePart(post.shift.start_at) : '--:--';
                const endTime   = post.shift ? getTimePart(post.shift.end_at)   : '--:--';
                const hours     = post.shift ? calcHours(post.shift.start_at, post.shift.end_at) : 0;
                const totalPay  = memberInfo?.pay_amount && hours ? hours * memberInfo.pay_amount : null;
                const urgency   = getUrgency(workDate);
                const done      = appliedIds.has(post.id);

                return (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* 날짜 + 시간 + 긴급도 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[44px]">
                            <p className="text-xs text-gray-500">{getDayName(workDate, translations.employeeHome[language].days)}</p>
                            <p className="text-2xl font-bold">{getDayNum(workDate)}</p>
                          </div>
                          <div className="w-px h-10 bg-gray-200"/>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-orange-500"/>
                              <span className="font-bold text-sm">{startTime}-{endTime}</span>
                              {hours > 0 && <Badge variant="secondary" className="text-xs">{hours}h</Badge>}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3"/><span>{storeName}</span>
                            </div>
                          </div>
                        </div>
                        {urgencyBadge(urgency)}
                      </div>

                      {/* 급여 */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600"/>
                            <div>
                              <p className="text-xs text-gray-500">{t.pay}</p>
                              <p className="font-bold">{totalPay != null ? `${totalPay.toLocaleString()}` : '-'}</p>
                            </div>
                          </div>
                          {memberInfo?.pay_amount && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{t.hourlyRate}</p>
                              <p className="text-sm font-medium">{memberInfo.pay_amount.toLocaleString()}원</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {post.reason && <p className="text-sm text-gray-600 mb-3">{post.reason}</p>}

                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          disabled={done}
                          onClick={() => { setSelectedPost(post); setApplyDialogOpen(true); }}
                          className={done
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'}
                        >
                          {done ? t.applied : t.apply}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─ 지원 확인 다이얼로그 ─────────────────────── */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.dialogTitle}</DialogTitle></DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{getDayName(selectedPost.shift?.work_date ?? '', translations.employeeHome[language].days)}</p>
                    <p className="text-2xl font-bold">{getDayNum(selectedPost.shift?.work_date ?? '')}</p>
                  </div>
                  <div>
                    <p className="font-bold">
                      {selectedPost.shift
                        ? `${getTimePart(selectedPost.shift.start_at)} - ${getTimePart(selectedPost.shift.end_at)}`
                        : t.timeUnknown}
                    </p>
                    <p className="text-sm text-gray-500">{storeName}</p>
                  </div>
                </div>
                {memberInfo?.pay_amount && selectedPost.shift && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500">{t.expectedPay}</span>
                    <span className="text-lg font-bold text-green-600">
                      {(calcHours(selectedPost.shift.start_at, selectedPost.shift.end_at) * memberInfo.pay_amount).toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">{t.confirmApply}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applying}>{t.cancelBtn}</Button>
            <Button
              onClick={confirmApply}
              disabled={applying}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {applying ? t.applying : t.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─ 하단 네비게이션 ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <item.icon className="w-5 h-5"/>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

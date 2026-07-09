import axiosInstance from "../../../lib/axiosInstance";
import { useTheme } from 'next-themes';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { createPortal } from 'react-dom';
import { Search, Clock, MapPin, AlertCircle, Check, Save, ChevronRight, Plus, X } from 'lucide-react';
import EmployeeHeader from './EmployeeHeader';
import EmployeeBottomNav from './EmployeeBottomNav';

const GREEN      = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN  = '#E6F5C8';


/* ─── 타입 ─── */
interface SubstitutePostVO {
  id: string; shift_id: string; store_id: string;
  requester_user_id: string; reason: string;
  status: string; created_at: string;
}
interface ShiftVO {
  id: string; store_id?: string; user_id?: string; work_date: string;
  start_at: string; end_at: string; status: string;
}
interface SubstituteApplicationVO {
  id: string; substitute_post_id: string;
  applicant_user_id: string; message: string;
  status: string; applied_at: string;
}
interface StoreMemberVo { pay_type: string; pay_amount: number; }
interface EnrichedPost extends SubstitutePostVO { shift?: ShiftVO; }
interface AvailabilitySetting {
  days: ('mon'|'tue'|'wed'|'thu'|'fri')[];
  start: string; end: string;
}

const DAY_KEYS: AvailabilitySetting['days'][number][] = ['mon','tue','wed','thu','fri'];

/* ─── 유틸 ─── */
const getDayName  = (d: string, days: string[]) => { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : days[dt.getDay()]; };
const getDayNum   = (d: string) => d ? (d.split('-')[2] ?? '--') : '--';
const getTimePart = (s: string) => { if (!s) return '--:--'; const p = s.split(' '); return p.length >= 2 ? p[1].slice(0,5) : s.slice(11,16); };
const calcHours   = (s: string, e: string) => {
  if (!s || !e) return 0;
  const toMin = (x: string) => { const t = x.includes(' ') ? x.split(' ')[1] : x.slice(11); const [h,m] = t.split(':').map(Number); return h*60+m; };
  let diff = toMin(e) - toMin(s);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
};
const getUrgency = (d: string): 'high'|'medium'|'low' => {
  if (!d) return 'low';
  const diff = (new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000;
  return diff <= 2 ? 'high' : diff <= 5 ? 'medium' : 'low';
};

/* ─── HH:MM 파싱 헬퍼 ─── */
const parseHHMM = (t: string) => {
  const [hStr, mStr] = t.split(':');
  return { hh: parseInt(hStr || '0', 10), mm: parseInt(mStr || '0', 10) };
};
const clampTime = (hh: number, mm: number) =>
  `${Math.min(23, Math.max(0, hh)).toString().padStart(2, '0')}:${Math.min(59, Math.max(0, mm)).toString().padStart(2, '0')}`;
const isOpenSubstitutePost = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'open' || normalized === 'pending';
};
const getDatePart = (value?: string) => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
};
const isRequestableShift = (shift: ShiftVO, date: string, storeId: string, userId: string) => {
  const status = (shift.status || '').toUpperCase();
  return getDatePart(shift.work_date) === date
    && (!shift.store_id || shift.store_id === storeId)
    && (!shift.user_id || shift.user_id === userId)
    && !['VACANT', 'CANCELLED', 'OFF'].includes(status);
};

const formatCurrency = (amount: number, language: string) => {
  const rounded = Math.round(amount);
  if (language === 'ja') {
    return `${rounded.toLocaleString()}円`;
  } else if (language === 'en') {
    return `${rounded.toLocaleString()} won`;
  }
  return `${rounded.toLocaleString()}원`;
};

export default function SubstituteList() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const language = useLanguage();
  const t = translations.substituteList[language];

  const deleteConfirm = (t as any).deleteConfirm || (
    language === 'ja' ? '代替依頼を削除しますか？' :
    language === 'en' ? 'Are you sure you want to delete this substitute request?' :
    '대타 요청을 삭제하시겠습니까?'
  );
  
  const deleteErr = (t as any).deleteErr || (
    language === 'ja' ? '削除中にエラーが発生しました。' :
    language === 'en' ? 'An error occurred while deleting.' :
    '삭제 중 오류가 발생했습니다.'
  );

  const deleteBtn = (t as any).deleteBtn || (
    language === 'ja' ? '削除' :
    language === 'en' ? 'Delete' :
    '삭제'
  );

  const workConfirmed = (t as any).workConfirmed || (
    language === 'ja' ? '勤務確認済み' :
    language === 'en' ? 'Shift Confirmed' :
    '근무 확인됨'
  );

  const searchingWork = (t as any).searchingWork || (
    language === 'ja' ? '勤務照会中...' :
    language === 'en' ? 'Checking shift...' :
    '근무 조회 중...'
  );

  const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const [storeId, setStoreId] = useState(sessionStorage.getItem('store_id') || '');
  const storeName = sessionStorage.getItem('store_name') || '';

  useEffect(() => {
    if (storeId || !user.id) return;
    axiosInstance.get('/store/my', { params: { user_id: user.id } })
      .then(res => {
        if (res.data?.id) {
          sessionStorage.setItem('store_id', res.data.id);
          setStoreId(res.data.id);
        } else { setLoadingPosts(false); }
      })
      .catch(() => setLoadingPosts(false));
  }, [user.id]);

  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedPost, setSelectedPost] = useState<EnrichedPost | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applying, setApplying]         = useState(false);
  const [appliedIds, setAppliedIds]     = useState<Set<string>>(new Set());

  const [posts, setPosts]           = useState<EnrichedPost[]>([]);
  const [memberInfo, setMemberInfo] = useState<StoreMemberVo | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 포스터 이름 맵 (user_id → {name, role})
  const [userMap, setUserMap] = useState<Record<string, { name: string; role: string }>>({});

  // 대타 요청 모달
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestDate, setRequestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [requestReason, setRequestReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestShift, setRequestShift] = useState<ShiftVO | null>(null);
  const [fetchingShift, setFetchingShift] = useState(false);

  const STORAGE_KEY = `substitute_availability_${user.id ?? 'guest'}`;
  const [availability, setAvailability] = useState<AvailabilitySetting>(() => {
    try { const s = sessionStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : { days: [], start: '09:00', end: '18:00' }; }
    catch { return { days: [], start: '09:00', end: '18:00' }; }
  });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!storeId) { setLoadingPosts(false); return; }
    axiosInstance.get('/substitute', { params: { store_id: storeId } })
      .then(async (r) => {
        const open = (Array.isArray(r.data) ? r.data : []).filter((p: SubstitutePostVO) => isOpenSubstitutePost(p.status));
        const enriched: EnrichedPost[] = await Promise.all(
          open.map(async (p: SubstitutePostVO) => {
            if (!p.shift_id) return { ...p };
            try { const sr = await axiosInstance.get(`/shift/${p.shift_id}`); return { ...p, shift: sr.data }; }
            catch { return { ...p }; }
          }),
        );
        enriched.sort((a, b) => (a.shift?.work_date ?? '9999').localeCompare(b.shift?.work_date ?? '9999'));
        setPosts(enriched);
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [storeId]);

  useEffect(() => {
    if (!user.id || !storeId) return;
    axiosInstance.get('/store_member/pay', { params: { user_id: user.id, store_id: storeId } })
      .then((r) => setMemberInfo(r.data)).catch(() => {});
  }, [user.id, storeId]);

  // 같은 지점 직원 목록 → 포스터 이름 맵 빌드
  useEffect(() => {
    if (!storeId) return;
    axiosInstance.get('/users', { params: { store_id: storeId } })
      .then((r) => {
        const m: Record<string, { name: string; role: string }> = {};
        (Array.isArray(r.data) ? r.data : []).forEach((u: any) => { m[u.id] = { name: u.name, role: u.role }; });
        setUserMap(m);
      }).catch(() => {});
  }, [storeId]);

  useEffect(() => {
    if (!user.id) return;
    axiosInstance.get('/substitute/staff', { params: { user_id: user.id } })
      .then((r) => setAppliedIds(new Set((Array.isArray(r.data) ? r.data : []).map((a: SubstituteApplicationVO) => a.substitute_post_id))))
      .catch(() => {});
  }, [user.id]);

  const handleSave = () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
    if (user.id && storeId) {
      const daysStr = availability.days.join(',');
      const encoded = daysStr ? `${daysStr}|${availability.start}-${availability.end}` : '';
      axiosInstance.put('/store_member/available-days', null, {
        params: { store_id: storeId, user_id: user.id, available_days: encoded },
      }).catch(() => {});
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  // 날짜 바뀔 때마다 그날 내 shift 조회
  const handleRequestDateChange = (date: string) => {
    setRequestDate(date);
    setRequestShift(null);
  };

  useEffect(() => {
    if (!requestModalOpen || !user.id || !storeId || !requestDate) {
      setRequestShift(null);
      return;
    }

    setFetchingShift(true);
    axiosInstance.get('/shift/staff', { params: { user_id: user.id, start_date: requestDate, end_date: requestDate } })
      .then((r) => {
        const shifts: ShiftVO[] = Array.isArray(r.data) ? r.data : [];
        const matched = shifts.find((s) => isRequestableShift(s, requestDate, storeId, user.id));
        setRequestShift(matched ?? null);
      })
      .catch(() => setRequestShift(null))
      .finally(() => setFetchingShift(false));
  }, [requestModalOpen, requestDate, storeId, user.id]);

  const handleRequestPost = () => {
    if (!user.id || !storeId) return;
    setRequesting(true);
    axiosInstance.post('/substitute/staff', {
      shift_id: requestShift?.id ?? '',
      store_id: storeId,
      requester_user_id: user.id,
      reason: `[${requestDate}] ${requestReason || '대타 구합니다'}`,
      status: 'open',
    })
      .then(() => {
        setRequestModalOpen(false);
        setRequestReason('');
        // 목록 새로고침
        return axiosInstance.get('/substitute', { params: { store_id: storeId } });
      })
      .then(async (r) => {
        if (!r) return;
        const open = (Array.isArray(r.data) ? r.data : []).filter((p: SubstitutePostVO) => p.status === 'open');
        const enriched: EnrichedPost[] = await Promise.all(
          open.map(async (p: SubstitutePostVO) => {
            if (!p.shift_id) return { ...p };
            try { const sr = await axiosInstance.get(`/shift/${p.shift_id}`); return { ...p, shift: sr.data }; }
            catch { return { ...p }; }
          }),
        );
        enriched.sort((a, b) => (a.shift?.work_date ?? '9999').localeCompare(b.shift?.work_date ?? '9999'));
        setPosts(enriched);
      })
      .catch(() => alert(t.errRequest))
      .finally(() => setRequesting(false));
  };

  const toggleDay = (key: AvailabilitySetting['days'][number]) => {
    setAvailability((prev) => ({
      ...prev,
      days: prev.days.includes(key) ? prev.days.filter((d) => d !== key) : [...prev.days, key],
    }));
  };

  const confirmApply = () => {
    if (!selectedPost || !user.id) return;
    setApplying(true);
    axiosInstance.post('/substitute/staff/apply', {
      substitute_post_id: selectedPost.id,
      applicant_user_id: user.id,
      message: '',
      status: 'PENDING',
    })
      .then(() => {
        setAppliedIds((prev) => new Set([...prev, selectedPost.id]));
        setApplyDialogOpen(false);
        setSelectedPost(null);
      })
      .catch(() => alert(t.errApply))
      .finally(() => setApplying(false));
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.shift?.work_date?.includes(q) || p.reason?.toLowerCase().includes(q) || storeName.toLowerCase().includes(q);
  });

  /* ─── urgency badge ─── */
  const urgencyBadge = (u: 'high'|'medium'|'low') => {
    const styles: Record<string, React.CSSProperties> = {
      high:   { background: '#B91C1C', color: '#fff' },
      medium: { background: '#C9A800', color: '#fff' },
      low:    { background: LIGHT_GREEN, color: DARK_GREEN },
    };
    const labels = { high: t.urgencyHigh, medium: t.urgencyMedium, low: t.urgencyLow };
    return (
      <span style={{
        ...styles[u],
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      }}>
        {u === 'high' && <AlertCircle style={{ width: 12, height: 12 }} />}
        {labels[u]}
      </span>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)',
      paddingBottom: 120,
    }}>
      {/* ── 헤더 ── */}
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 가능 시간 설정 카드 ── */}
        <div style={{
          background: isDark ? '#141414' : 'rgba(255,255,255,0.8)',
          border: `1px solid rgba(0,162,0,0.12)`,
          borderRadius: 20,
          padding: '20px',
          boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>{t.availabilitySettings}</p>

          {/* 요일 */}
          <p style={{ fontSize: 14, color: '#5a8a5c', marginBottom: 8 }}>{t.availableDays}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {DAY_KEYS.map((key, i) => {
              const label = t.dayOptions[i]?.label ?? key;
              const active = availability.days.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleDay(key)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: active ? DARK_GREEN : (isDark ? '#1e1e1e' : LIGHT_GREEN),
                    color: active ? '#fff' : (isDark ? '#4cd964' : DARK_GREEN),
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* 시간 */}
          <p style={{ fontSize: 14, color: '#5a8a5c', marginBottom: 8 }}>{t.availableTime}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {language === 'ko' ? (
              <input
                type="time" value={availability.start}
                onChange={(e) => setAvailability((p) => ({ ...p, start: e.target.value }))}
                style={{
                  flex: 1, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12,
                  padding: '10px 12px', fontSize: 16, textAlign: 'center',
                  background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.9)', color: isDark ? '#4cd964' : DARK_GREEN, outline: 'none',
                }}
              />
            ) : (() => {
              const { hh: sHH, mm: sMM } = parseHHMM(availability.start);
              const seg: React.CSSProperties = {
                width: 40, border: 'none', borderRadius: 6,
                padding: '10px 2px', fontSize: 16, textAlign: 'center',
                background: 'transparent', color: isDark ? '#4cd964' : DARK_GREEN,
                outline: 'none', fontWeight: 700,
              };
              return (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${BORDER_GREEN}`, borderRadius: 12,
                  background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.9)', padding: '0 8px',
                }}>
                  <input type="text" inputMode="numeric" maxLength={2}
                    key={`s-hh-${availability.start}`}
                    defaultValue={sHH.toString().padStart(2, '0')}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); }}
                    onBlur={(e) => {
                      const v = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                      setAvailability((p) => ({ ...p, start: clampTime(v, sMM) }));
                    }}
                    style={seg}
                  />
                  <span style={{ color: isDark ? '#4cd964' : DARK_GREEN, fontWeight: 700, fontSize: 18, userSelect: 'none' }}>:</span>
                  <input type="text" inputMode="numeric" maxLength={2}
                    key={`s-mm-${availability.start}`}
                    defaultValue={sMM.toString().padStart(2, '0')}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); }}
                    onBlur={(e) => {
                      const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                      setAvailability((p) => ({ ...p, start: clampTime(sHH, v) }));
                    }}
                    style={seg}
                  />
                </div>
              );
            })()}
            <span style={{ color: '#5a8a5c', fontWeight: 600 }}>~</span>
            {language === 'ko' ? (
              <input
                type="time" value={availability.end}
                onChange={(e) => setAvailability((p) => ({ ...p, end: e.target.value }))}
                style={{
                  flex: 1, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12,
                  padding: '10px 12px', fontSize: 16, textAlign: 'center',
                  background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.9)', color: isDark ? '#4cd964' : DARK_GREEN, outline: 'none',
                }}
              />
            ) : (() => {
              const { hh: eHH, mm: eMM } = parseHHMM(availability.end);
              const seg: React.CSSProperties = {
                width: 40, border: 'none', borderRadius: 6,
                padding: '10px 2px', fontSize: 16, textAlign: 'center',
                background: 'transparent', color: isDark ? '#4cd964' : DARK_GREEN,
                outline: 'none', fontWeight: 700,
              };
              return (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${BORDER_GREEN}`, borderRadius: 12,
                  background: isDark ? '#1e1e1e' : 'rgba(255,255,255,0.9)', padding: '0 8px',
                }}>
                  <input type="text" inputMode="numeric" maxLength={2}
                    key={`e-hh-${availability.end}`}
                    defaultValue={eHH.toString().padStart(2, '0')}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); }}
                    onBlur={(e) => {
                      const v = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                      setAvailability((p) => ({ ...p, end: clampTime(v, eMM) }));
                    }}
                    style={seg}
                  />
                  <span style={{ color: isDark ? '#4cd964' : DARK_GREEN, fontWeight: 700, fontSize: 18, userSelect: 'none' }}>:</span>
                  <input type="text" inputMode="numeric" maxLength={2}
                    key={`e-mm-${availability.end}`}
                    defaultValue={eMM.toString().padStart(2, '0')}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); }}
                    onBlur={(e) => {
                      const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                      setAvailability((p) => ({ ...p, end: clampTime(eHH, v) }));
                    }}
                    style={seg}
                  />
                </div>
              );
            })()}
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: savedFlash ? GREEN : `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {savedFlash
              ? <><Check style={{ width: 16, height: 16 }} />{t.saved}</>
              : <><Save style={{ width: 16, height: 16 }} />{t.save}</>}
          </button>
        </div>

        {/* ── 대타 요청 버튼 + 검색 ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setRequestModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
              color: '#fff', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />{t.requestBtn}
          </button>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, color: '#5a8a5c',
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%', padding: '12px 16px 12px 42px',
                border: `1px solid ${BORDER_GREEN}`, borderRadius: 12,
                fontSize: 15, background: isDark ? '#141414' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#fff' : '#333', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* ── 모집중 목록 ── */}
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: DARK_GREEN, marginBottom: 12 }}>
            {t.recruiting}{' '}
            <span style={{ color: GREEN }}>{loadingPosts ? '' : filteredPosts.length}</span>
          </p>

          {loadingPosts ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16 }}>{t.loading}</p>
          ) : filteredPosts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16, fontWeight: 500 }}>{t.noOpenings}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPosts.map((post) => {
                // shift 없는 경우 reason에서 [YYYY-MM-DD] 파싱
                const reasonDate = post.reason?.match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] ?? '';
                const workDate  = post.shift?.work_date ?? reasonDate;
                const startTime = post.shift ? getTimePart(post.shift.start_at) : null;
                const endTime   = post.shift ? getTimePart(post.shift.end_at)   : null;
                const hours     = post.shift ? calcHours(post.shift.start_at, post.shift.end_at) : 0;
                const totalPay  = memberInfo?.pay_amount && hours ? hours * memberInfo.pay_amount : null;
                const urgency   = getUrgency(workDate);
                const done      = appliedIds.has(post.id);
                const isOwnPost = post.requester_user_id === user.id;
                const poster    = userMap[post.requester_user_id];
                const posterName = poster?.name ?? '';
                const isAdminPost = poster ? (poster.role === 'ADMIN' || poster.role === 'MASTER') : !poster && !!post.requester_user_id;

                return (
                  <div
                    key={post.id}
                    style={{
                      background: isDark ? '#141414' : 'rgba(255,255,255,0.8)',
                      border: isOwnPost ? `1.5px solid ${DARK_GREEN}` : '1px solid rgba(0,162,0,0.12)',
                      borderRadius: 20,
                      padding: '18px 20px',
                      boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* 포스터 배지 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: isOwnPost ? DARK_GREEN : (isAdminPost ? '#1a56db' : LIGHT_GREEN),
                        color: isOwnPost ? '#fff' : (isAdminPost ? '#fff' : DARK_GREEN),
                      }}>
                        {isOwnPost ? t.ownPost : (isAdminPost ? t.postedByAdmin : t.postedByEmployee)}
                        {!isOwnPost && posterName && <span style={{ opacity: 0.85 }}> · {posterName}</span>}
                      </div>
                    </div>

                    {/* 날짜 + 긴급도 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* 날짜 블록 */}
                        <div style={{ textAlign: 'center', minWidth: 44 }}>
                          <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 2 }}>
                            {getDayName(workDate, translations.employeeHome[language].days)}
                          </p>
                          <p style={{ fontSize: 28, fontWeight: 800, color: DARK_GREEN, lineHeight: 1 }}>
                            {getDayNum(workDate)}
                          </p>
                        </div>
                        {/* 구분선 */}
                        <div style={{ width: 1, height: 40, background: 'rgba(0,162,0,0.2)' }} />
                        {/* 시간 + 위치 */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Clock style={{ width: 16, height: 16, color: GREEN }} />
                            <span style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#222' }}>
                              {startTime && endTime ? `${startTime} - ${endTime}` : t.timeUnknown}
                            </span>
                            {hours > 0 && (
                              <span style={{
                                fontSize: 13, fontWeight: 600,
                                background: LIGHT_GREEN, color: DARK_GREEN,
                                padding: '2px 8px', borderRadius: 10,
                              }}>{hours} h</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin style={{ width: 14, height: 14, color: '#5a8a5c' }} />
                            <span style={{ fontSize: 14, color: '#5a8a5c' }}>{storeName}</span>
                          </div>
                        </div>
                      </div>
                      {urgencyBadge(urgency)}
                    </div>

                    {/* 급여 */}
                    <div style={{
                      background: LIGHT_GREEN,
                      borderRadius: 12, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <div>
                        <p style={{ fontSize: 13, color: '#5a8a5c', marginBottom: 2 }}>{t.pay}</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: DARK_GREEN }}>
                          {totalPay != null ? formatCurrency(totalPay, language) : '-'}
                        </p>
                      </div>
                      {memberInfo?.pay_amount && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, color: '#5a8a5c', marginBottom: 2 }}>{t.hourlyRate}</p>
                          <p style={{ fontSize: 15, fontWeight: 600, color: DARK_GREEN }}>
                            {formatCurrency(memberInfo.pay_amount, language)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 사유 */}
                    {post.reason && (
                      <p style={{ fontSize: 15, color: isDark ? '#aaa' : '#555', marginBottom: 12, lineHeight: 1.5 }}>
                        {post.reason}
                      </p>
                    )}

                    {/* 지원 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,162,0,0.1)', paddingTop: 12 }}>
                      {isOwnPost ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 12,
                            fontSize: 14, fontWeight: 600, color: DARK_GREEN,
                            background: LIGHT_GREEN,
                          }}>
                            <Check style={{ width: 14, height: 14 }} />{t.ownPost}
                          </span>
                          <button
                            onClick={() => {
                              if (!confirm(deleteConfirm)) return;
                              axiosInstance.delete('/substitute/manager', { params: { post_id: post.id } })
                                .then(() => setPosts((prev) => prev.filter((p) => p.id !== post.id)))
                                .catch(() => alert(deleteErr));
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '9px 14px', borderRadius: 12, border: '1px solid #e53e3e',
                              background: 'transparent', color: '#e53e3e',
                              fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            <X style={{ width: 13, height: 13 }} />{deleteBtn}
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={done}
                          onClick={() => { setSelectedPost(post); setApplyDialogOpen(true); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 22px', borderRadius: 12, border: 'none',
                            fontSize: 15, fontWeight: 700, cursor: done ? 'not-allowed' : 'pointer',
                            background: done ? LIGHT_GREEN : `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
                            color: done ? '#5a8a5c' : '#fff',
                          }}
                        >
                          {done ? <><Check style={{ width: 14, height: 14 }} />{t.applied}</> : <>{t.apply}<ChevronRight style={{ width: 14, height: 14 }} /></>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 대타 요청 모달 ── */}
      {requestModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setRequestModalOpen(false)} />
          <div style={{
            position: 'relative', zIndex: 1,
            background: isDark ? '#2a2a2c' : '#fff',
            borderRadius: 24, padding: '28px 24px',
            width: 'min(480px, 90vw)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK_GREEN }}>{t.requestModalTitle}</h2>
              <button onClick={() => setRequestModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 14, color: '#5a8a5c', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t.requestDate}</label>
                <input
                  type="date"
                  value={requestDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleRequestDateChange(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: `1px solid ${BORDER_GREEN}`, fontSize: 16,
                    background: isDark ? '#1e1e1e' : '#f8fdf4',
                    color: isDark ? '#fff' : '#222', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {fetchingShift && <p style={{ fontSize: 13, color: '#5a8a5c', marginTop: 6 }}>{searchingWork}</p>}
                {!fetchingShift && requestDate && (
                  requestShift ? (
                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: LIGHT_GREEN, fontSize: 13, color: DARK_GREEN, fontWeight: 600 }}>
                      🕐 {getTimePart(requestShift.start_at)} - {getTimePart(requestShift.end_at)} {workConfirmed}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#999', marginTop: 6 }}>{t.noShiftOnDate}</p>
                  )
                )}
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#5a8a5c', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t.requestReason}</label>
                <input
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder={t.requestReasonPlaceholder}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: `1px solid ${BORDER_GREEN}`, fontSize: 15,
                    background: isDark ? '#1e1e1e' : '#f8fdf4',
                    color: isDark ? '#fff' : '#222', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ background: isDark ? 'rgba(24,160,34,0.12)' : LIGHT_GREEN, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: isDark ? '#4cd964' : '#5a8a5c' }}>
                {t.requestNotice}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setRequestModalOpen(false)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    border: `1px solid ${BORDER_GREEN}`, background: 'transparent',
                    color: DARK_GREEN, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >{t.cancelBtn}</button>
                <button
                  onClick={handleRequestPost}
                  disabled={requesting || !requestDate}
                  style={{
                    flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: requesting ? '#ccc' : `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
                    color: '#fff', fontSize: 15, fontWeight: 700, cursor: requesting ? 'not-allowed' : 'pointer',
                  }}
                >{requesting ? t.requestSubmitting : t.requestSubmit}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 지원 확인 모달 ── */}
      {applyDialogOpen && selectedPost && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setApplyDialogOpen(false)} />
          <div style={{
            position: 'relative', zIndex: 1,
            background: isDark ? '#1e2820' : '#fff',
            borderRadius: 24,
            padding: '28px 24px',
            width: '100%', maxWidth: 400,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            {/* 핸들 바 */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 24px' }} />

            <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK_GREEN, marginBottom: 14 }}>{t.dialogTitle}</h2>

            {/* 근무 정보 카드 */}
            <div style={{
              background: isDark ? '#2a3a2a' : LIGHT_GREEN,
              borderRadius: 14, padding: '14px',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <div style={{
                  background: DARK_GREEN, borderRadius: 10,
                  padding: '6px 12px', textAlign: 'center', minWidth: 44,
                }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginBottom: 1 }}>
                    {getDayName(selectedPost.shift?.work_date ?? '', translations.employeeHome[language].days)}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {getDayNum(selectedPost.shift?.work_date ?? '')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#7ccc7c' : DARK_GREEN, marginBottom: 3 }}>
                    {selectedPost.shift
                      ? `${getTimePart(selectedPost.shift.start_at)} - ${getTimePart(selectedPost.shift.end_at)}`
                      : t.timeUnknown}
                  </p>
                  <p style={{ fontSize: 12, color: '#5a8a5c' }}>📍 {storeName}</p>
                </div>
              </div>
              {memberInfo?.pay_amount && selectedPost.shift && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 10, borderTop: `1px solid rgba(0,162,0,0.2)`,
                }}>
                  <span style={{ fontSize: 12, color: '#5a8a5c', fontWeight: 600 }}>{t.expectedPay}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: DARK_GREEN }}>
                    {formatCurrency(calcHours(selectedPost.shift.start_at, selectedPost.shift.end_at) * memberInfo.pay_amount, language)}
                  </span>
                </div>
              )}
            </div>

            <p style={{ fontSize: 12, color: isDark ? '#aaa' : '#666', marginBottom: 16, lineHeight: 1.6 }}>{t.confirmApply}</p>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setApplyDialogOpen(false)} disabled={applying}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: `1.5px solid ${BORDER_GREEN}`, background: 'transparent',
                  color: DARK_GREEN, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >{t.cancelBtn}</button>
              <button
                onClick={confirmApply} disabled={applying}
                style={{
                  flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: applying ? '#ccc' : `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: applying ? 'not-allowed' : 'pointer',
                }}
              >{applying ? t.applying : t.apply}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <EmployeeBottomNav />
    </div>
  );
}

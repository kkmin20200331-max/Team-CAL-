import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserPlus,
  Search,
  Phone,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  X,
  Users,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Video,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';
import { useLocation } from 'react-router-dom';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const API = axios.create({ baseURL: "http://localhost:8080/api" });

/* ─── 타입 ─────────────────────────────────────────── */
interface UserVo {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

interface StoreVo {
  id: string;
  name: string;
}

interface SubstitutePostVO {
  id: string;
  shift_id: string;
  store_id: string;
  requester_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  closed_at: string;
}

interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

/* ─── 유틸 ─────────────────────────────────────────── */
const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const formatDate = (s: string) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/* ─── 컴포넌트 ──────────────────────────────────────── */
const SubstituteManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.substituteManagement[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';

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

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  /* 직원 목록 + 최근 근무일 */
  const [employees, setEmployees] = useState<UserVo[]>([]);
  const [lastWorkedByUser, setLastWorkedByUser] = useState<
    Record<string, string>
  >({});
  const [loadingStaff, setLoadingStaff] = useState(true);

  /* 대타 요청하기 모달 */
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStoreId, setModalStoreId] = useState(branchId ?? "");
  const [modalDate, setModalDate] = useState(toDateStr(new Date()));
  const [modalCount, setModalCount] = useState(1);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  /* ── 현재 지점 직원 + 최근 근무일 로드 ─────────────── */
  useEffect(() => {
    if (!branchId) return;

    const today = new Date();
    const past90 = new Date(today);
    past90.setDate(today.getDate() - 90);

    Promise.all([
      API.get("/users", { params: { store_id: branchId } }),
      API.get("/shift", {
        params: {
          store_id: branchId,
          start_date: toDateStr(past90),
          end_date: toDateStr(today),
        },
      }),
    ])
      .then(([usersRes, shiftsRes]) => {
        setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);

        const shifts: ShiftVO[] = Array.isArray(shiftsRes.data)
          ? shiftsRes.data
          : [];
        const lastWorked: Record<string, string> = {};
        shifts.forEach((s) => {
          if (s.status !== "VACANT" && s.status !== "CANCELLED" && s.user_id) {
            if (!lastWorked[s.user_id] || s.work_date > lastWorked[s.user_id]) {
              lastWorked[s.user_id] = s.work_date;
            }
          }
        });
        setLastWorkedByUser(lastWorked);
      })
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, [branchId]);

  /* ── admin 관리 지점 목록 (모달 지점 선택용) ───────── */
  useEffect(() => {
    if (!user.id) return;
    API.get("/store", { params: { user_id: user.id } })
      .then((res) => setStores(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user.id]);

  /* ── 모달 열기 ──────────────────────────────────────── */
  const openModal = () => {
    setModalStoreId(branchId ?? stores[0]?.id ?? "");
    setModalDate(toDateStr(new Date()));
    setModalCount(1);
    setIsModalOpen(true);
  };

  /* ── 대타 요청 생성 ──────────────────────────────────── */
  const handleCreatePost = () => {
    setModalSubmitting(true);

    // TODO: 인원수 전용 DB 컬럼 추가 시 reason 대신 별도 필드로 교체
    const payload: Partial<SubstitutePostVO> = {
      shift_id: "",
      store_id: modalStoreId,
      requester_user_id: user.id,
      reason: `인원 ${modalCount}명 필요`,
      status: "open",
    };

    API.post("/substitute/staff", payload)
      .then(() => setIsModalOpen(false))
      .catch(() => alert(t.errCreate))
      .finally(() => setModalSubmitting(false));
  };

  /* ── SMS 연락 ───────────────────────────────────────── */
  const handleContact = (phone: string, name: string) => {
    if (!phone) return;
    // TODO: SMS API 연동 시 이 부분을 교체
    const msg = encodeURIComponent(t.smsMessage(name));
    window.open(`sms:${phone}?body=${msg}`);
  };

  /* ── 필터 ───────────────────────────────────────────── */
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm),
  );

  const getEmployeeStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: GREEN, background: LIGHT_GREEN, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
        <CheckCircle size={11} />{t.statusActive}
      </span>
    );
    if (s === 'INACTIVE') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
        {t.statusInactive}
      </span>
    );
    return <span style={{ fontSize: 12, color: '#6b7280', border: '1px solid #d1d5db', padding: '2px 8px', borderRadius: 20 }}>{status}</span>;
  };

  const pageBg = isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg = isDark ? '#2c2c2e' : 'rgba(230,245,200,0.35)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${BORDER_GREEN}`, background: isDark ? '#3a3a3c' : '#fff', color: textColor, fontSize: 14, boxSizing: 'border-box' as const };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* 사이드바 */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', background: sidebarBg, borderRadius: 20, border: `1px solid ${sidebarBorder}`, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#3a3a3c' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: isDark ? '#2c2c2e' : '#fff', border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {stores.map(s => (
                  <div key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); navigate(`/admin/dashboard/${s.id}`); setBranchDropdownOpen(false); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: textColor, borderBottom: `1px solid ${isDark ? '#3a3a3c' : LIGHT_GREEN}` }}>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path);
            return (
              <button key={label} onClick={() => navigate(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, background: isActive ? GREEN : 'transparent', color: isActive ? '#fff' : textColor, transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN }}>{t.title}</h1>
              <p style={{ fontSize: 14, color: subTextColor, marginTop: 4 }}>{t.subtitle}</p>
            </div>
            <button onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: GREEN, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} />{t.createRequest}
            </button>
          </div>
        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: t.currentBranchStaff, value: employees.length, color: textColor, icon: <UserPlus size={24} color={GREEN} /> },
            { label: t.noWorkToday, value: employees.filter(e => !lastWorkedByUser[e.id]).length, color: '#f59e0b', icon: <AlertCircle size={24} color="#f59e0b" /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, color: subTextColor, marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
              </div>
              {icon}
            </div>
          ))}
        </div>

        {/* 검색 */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
          <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.7)', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 직원 카드 목록 */}
        {loadingStaff ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: subTextColor }}>{t.loading}</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: subTextColor }}>{searchTerm ? t.noSearchResult : t.noEmployees}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredEmployees.map((emp) => (
              <div key={emp.id} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, padding: '20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{emp.name?.[0] ?? '?'}</div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: textColor }}>{emp.name}</h3>
                      <p style={{ fontSize: 12, color: subTextColor }}>{emp.username}</p>
                    </div>
                  </div>
                  {getEmployeeStatusBadge(emp.status)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 13, color: subTextColor }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} /><span>{emp.phone || '-'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={13} /><span>{t.recentWork} {lastWorkedByUser[emp.id] ? formatDate(lastWorkedByUser[emp.id]) : t.noRecord}</span></div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: subTextColor, marginBottom: 6 }}>{t.availableSchedule} <span style={{ opacity: 0.5 }}>({t.settingPending})</span></p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {t.dayLabels.map((day: string) => (
                      <div key={day} style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, background: isDark ? '#3a3a3c' : LIGHT_GREEN, color: subTextColor, fontSize: 12 }}>{day}</div>
                    ))}
                  </div>
                </div>
                <button disabled={!emp.phone} onClick={() => handleContact(emp.phone, emp.name)} style={{ width: '100%', padding: '10px 0', background: emp.phone ? 'none' : 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: emp.phone ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: emp.phone ? 1 : 0.5 }}>
                  <Phone size={14} />{t.contactBtn}
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsModalOpen(false)} />
          <div style={{ position: 'relative', background: isDark ? '#2c2c2e' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, margin: '0 16px', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{t.modalTitle}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTextColor }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.branchLabel}</label>
                <select value={modalStoreId} onChange={(e) => setModalStoreId(e.target.value)} style={inputStyle}>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 6 }}>{t.dateLabel}</label>
                <input type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 12 }}>{t.staffCountLabel}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button type="button" onClick={() => setModalCount(c => Math.max(1, c - 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${BORDER_GREEN}`, background: 'none', color: DARK_GREEN, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: 24, fontWeight: 700, color: textColor, width: 64, textAlign: 'center' }}>{t.count(modalCount)}</span>
                  <button type="button" onClick={() => setModalCount(c => Math.min(20, c + 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${BORDER_GREEN}`, background: 'none', color: DARK_GREEN, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setIsModalOpen(false)} disabled={modalSubmitting} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.cancelBtn}</button>
              <button onClick={handleCreatePost} disabled={modalSubmitting} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {modalSubmitting ? t.requesting : t.requestBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubstituteManagement;

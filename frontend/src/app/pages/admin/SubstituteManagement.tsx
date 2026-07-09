import axiosInstance from "../../../lib/axiosInstance";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserPlus,
  Search,
  Phone,
  CheckCircle,
  AlertCircle,
  Calendar,
  ClipboardCheck,
  Plus,
  X,
  Users,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Video,
  ChevronRight,
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
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || "";
  const selectedPostFromList = location.state?.post as SubstitutePostVO | undefined;
  const selectedPostId =
    new URLSearchParams(location.search).get("postId") || selectedPostFromList?.id || "";

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /* 직원 목록 + 최근 근무일 */
  const [employees, setEmployees] = useState<UserVo[]>([]);
  const [lastWorkedByUser, setLastWorkedByUser] = useState<
    Record<string, string>
  >({});
  const [loadingStaff, setLoadingStaff] = useState(true);

  /* 직원별 대타 가능 일정 (user_id → {days, start, end}) */
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { days: string[]; start: string; end: string }>>({});

  /* 대타 요청하기 모달 */
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStoreId, setModalStoreId] = useState(selectedBranchId);
  const [modalDate, setModalDate] = useState(toDateStr(new Date()));
  const [modalCount, setModalCount] = useState(1);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  /* ── 현재 지점 직원 + 최근 근무일 로드 ─────────────── */
  useEffect(() => {
    if (!selectedBranchId) return;

    const today = new Date();
    const past90 = new Date(today);
    past90.setDate(today.getDate() - 90);

    Promise.all([
      axiosInstance.get("/users", { params: { store_id: selectedBranchId } }),
      axiosInstance.get("/shift", {
        params: {
          store_id: selectedBranchId,
          start_date: toDateStr(past90),
          end_date: toDateStr(today),
        },
      }),
      axiosInstance.get("/store_member/available-days", { params: { store_id: selectedBranchId } }).catch(() => ({ data: [] })),
    ])
      .then(([usersRes, shiftsRes, availRes]) => {
        setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);
        const avMap: Record<string, { days: string[]; start: string; end: string }> = {};
        (Array.isArray(availRes.data) ? availRes.data : []).forEach((m: any) => {
          if (!m.user_id || !m.available_days) return;
          const [daysPart, timePart] = m.available_days.split('|');
          const days = daysPart ? daysPart.split(',').filter(Boolean) : [];
          const [start, end] = timePart ? timePart.split('-') : ['09:00', '18:00'];
          avMap[m.user_id] = { days, start: start || '09:00', end: end || '18:00' };
        });
        setAvailabilityMap(avMap);

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
  }, [selectedBranchId]);

  /* ── admin 관리 지점 목록 (모달 지점 선택용) ───────── */
  useEffect(() => {
    if (!user.id) return;
    axiosInstance.get("/store", { params: { user_id: user.id } })
      .then((res) => setStores(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user.id]);

  /* ── 모달 열기 ──────────────────────────────────────── */
  const openModal = () => {
    setModalStoreId(selectedBranchId || stores[0]?.id || "");
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
      reason: `[${modalDate}] 인원 ${modalCount}명 필요`,
      status: "open",
    };

    axiosInstance.post("/substitute/staff", payload)
      .then(() => setIsModalOpen(false))
      .catch(() => alert(t.errCreate))
      .finally(() => setModalSubmitting(false));
  };

  /* ── LINE 연락 ───────────────────────────────────────── */
  const handleContact = async (userId: string, name: string) => {
    if (!userId) return;
    const message = t.smsMessage(name);
    try {
      const res = await axiosInstance.post('/line/send', { user_id: userId, message });
      if (res.status === 200) {
        alert(`${name}님에게 라인 메시지를 전송했습니다.`);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        alert(`${name}님은 라인 계정이 연동되어 있지 않습니다.`);
      } else {
        alert('메시지 전송에 실패했습니다.');
      }
    }
  };

  /* ── 필터 ───────────────────────────────────────────── */
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm),
  );

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredEmployees, currentPage, rowsPerPage]);

  const pageRange = useMemo(() => {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  const getEmployeeStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: isDark ? '#4cd964' : GREEN, background: isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
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
  const contentBg = isDark ? '#141414' : '#fff';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? '#141414' : 'rgba(230,245,200,0.35)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#c8c8c8' : '#555';
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${BORDER_GREEN}`, background: isDark ? '#1a1a1a' : '#fff', color: textColor, fontSize: 14, boxSizing: 'border-box' as const };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center', fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* 사이드바 */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', background: sidebarBg, borderRadius: 20, border: `1px solid ${sidebarBorder}`, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#1a1a1a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: isDark ? '#141414' : '#fff', border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, zIndex: 99, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {stores.map(s => (
                  <div key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); navigate(`/admin/dashboard/${s.id}`); setBranchDropdownOpen(false); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: textColor, borderBottom: `1px solid ${isDark ? '#1a1a1a' : LIGHT_GREEN}` }}>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path);
            return (
              <button key={label} onClick={() => navigate(path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600, background: isActive ? GREEN : 'transparent', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none', textAlign: 'left' }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} color={isActive ? '#fff' : GREEN} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)', minHeight: 'calc(100vh - 120px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> {t.breadcrumb}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={26} />{t.pageTitle}
              </h1>
              <p style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', margin: 0 }}>{t.pageSubtitle}</p>
            </div>
            <button onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: GREEN, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} />{t.createRequest}
            </button>
          </div>
          {selectedPostId && (
            <div style={{
              border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 18,
              background: isDark ? '#102410' : 'rgba(230,245,200,0.55)',
              padding: '14px 18px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}>
              <div>
                <p style={{ margin: '0 0 4px', color: isDark ? '#8fe18f' : DARK_GREEN, fontSize: 13, fontWeight: 800 }}>
                  선택한 대타 모집글
                </p>
                <p style={{ margin: 0, color: textColor, fontSize: 15, fontWeight: 800 }}>
                  {selectedPostFromList?.reason || `모집글 ID ${selectedPostId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection')}
                style={{
                  flexShrink: 0,
                  border: `1px solid ${BORDER_GREEN}`,
                  borderRadius: 999,
                  background: 'transparent',
                  color: DARK_GREEN,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                목록으로
              </button>
            </div>
          )}
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
          <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, background: isDark ? '#1a1a1a' : 'rgba(255,255,255,0.7)', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 직원 카드 목록 */}
        {loadingStaff ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: subTextColor }}>{t.loading}</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: subTextColor }}>{searchTerm ? t.noSearchResult : t.noEmployees}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {paginatedEmployees.map((emp) => (
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
                  {availabilityMap[emp.id] ? (() => {
                    const av = availabilityMap[emp.id];
                    const ENG_DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
                    return (
                      <>
                        <p style={{ fontSize: 11, color: subTextColor, marginBottom: 6 }}>{t.availableSchedule} <span style={{ color: DARK_GREEN, fontWeight: 600 }}>{av.start} ~ {av.end}</span></p>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {ENG_DAYS.map((key, i) => {
                            const active = av.days.includes(key);
                            return (
                              <div key={key} style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, background: active ? DARK_GREEN : (isDark ? '#1a1a1a' : LIGHT_GREEN), color: active ? '#fff' : subTextColor, fontSize: 12, fontWeight: active ? 700 : 400 }}>{t.dayLabels[i]}</div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })() : (
                    <>
                      <p style={{ fontSize: 11, color: subTextColor, marginBottom: 6 }}>{t.availableSchedule} <span style={{ opacity: 0.5 }}>({t.settingPending})</span></p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {t.dayLabels.map((day: string) => (
                          <div key={day} style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, background: isDark ? '#1a1a1a' : LIGHT_GREEN, color: subTextColor, fontSize: 12 }}>{day}</div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => handleContact(emp.id, emp.name)} style={{ width: '100%', padding: '10px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Phone size={14} />{t.contactBtn}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${currentPage === 1 ? (isDark ? "#2a2a2a" : "#e2e8f0") : BORDER_GREEN}`,
                background: isDark ? "#1a1a1a" : "#fff",
                color: currentPage === 1 ? (isDark ? "#555" : "#cbd5e1") : (isDark ? "#fff" : DARK_GREEN),
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              &lt;&lt;
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${currentPage === 1 ? (isDark ? "#2a2a2a" : "#e2e8f0") : BORDER_GREEN}`,
                background: isDark ? "#1a1a1a" : "#fff",
                color: currentPage === 1 ? (isDark ? "#555" : "#cbd5e1") : (isDark ? "#fff" : DARK_GREEN),
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              &lt;
            </button>
            {pageRange.map((pageNum) => {
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: `1px solid ${BORDER_GREEN}`,
                    background: isCurrent ? GREEN : (isDark ? "#1a1a1a" : "#fff"),
                    color: isCurrent ? "#fff" : (isDark ? "#fff" : DARK_GREEN),
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    transition: "all 0.2s"
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${currentPage === totalPages ? (isDark ? "#2a2a2a" : "#e2e8f0") : BORDER_GREEN}`,
                background: isDark ? "#1a1a1a" : "#fff",
                color: currentPage === totalPages ? (isDark ? "#555" : "#cbd5e1") : (isDark ? "#fff" : DARK_GREEN),
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              &gt;
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${currentPage === totalPages ? (isDark ? "#2a2a2a" : "#e2e8f0") : BORDER_GREEN}`,
                background: isDark ? "#1a1a1a" : "#fff",
                color: currentPage === totalPages ? (isDark ? "#555" : "#cbd5e1") : (isDark ? "#fff" : DARK_GREEN),
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              &gt;&gt;
            </button>
          </div>
        )}
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsModalOpen(false)} />
          <div style={{ position: 'relative', background: isDark ? '#141414' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 440, margin: '0 16px', padding: 28 }}>
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

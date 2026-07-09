import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
﻿import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  DollarSign,
  Users,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  UserCheck,
  X,
  Calendar,
  ClipboardCheck,
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Video,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';


interface UserVo {
  id: string;
  name: string;
  phone: string;
  username: string;
  role: string;
  status: string;
}
interface StoreMemberVo {
  user_id: string;
  store_id: string;
  member_role: string;
  user_level: string;
  approval_status: string;
  pay_type: string | null;
  pay_amount: number | null;
}

const LEVEL_LABEL: Record<string, string> = {
  NEWBIE: "신입",
  REGULAR: "일반",
  CLOSER: "마감가능",
  MANAGER: "매니저",
};
const LEVEL_BG: Record<string, string> = {
  NEWBIE: '#f3f4f6',
  REGULAR: LIGHT_GREEN,
  CLOSER: '#e0e7ff',
  MANAGER: '#fef3c7',
};
const LEVEL_BG_DARK: Record<string, string> = {
  NEWBIE: 'rgba(107,114,128,0.15)',
  REGULAR: 'rgba(24,160,34,0.15)',
  CLOSER: 'rgba(99,102,241,0.15)',
  MANAGER: 'rgba(234,179,8,0.15)',
};
const LEVEL_TEXT: Record<string, string> = {
  NEWBIE: '#6b7280',
  REGULAR: DARK_GREEN,
  CLOSER: '#4f46e5',
  MANAGER: '#92400e',
};
const LEVEL_TEXT_DARK: Record<string, string> = {
  NEWBIE: '#9ca3af',
  REGULAR: '#4cd964',
  CLOSER: '#818cf8',
  MANAGER: '#facc15',
};
const LEVEL_BORDER_DARK: Record<string, string> = {
  NEWBIE: 'rgba(107,114,128,0.3)',
  REGULAR: 'rgba(24,160,34,0.3)',
  CLOSER: 'rgba(99,102,241,0.3)',
  MANAGER: 'rgba(234,179,8,0.3)',
};

export default function EmployeeManagement() {
  const language = useLanguage();
  const t = translations.employeeManagement[language];
  const LEVEL_LABEL_I18N: Record<string, string> = {
    NEWBIE: t.levelNewbie,
    REGULAR: t.levelRegular,
    CLOSER: t.levelCloser,
    MANAGER: t.levelManager,
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const storeId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || "";
  const storeName = sessionStorage.getItem("store_name") || "매장";
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: storeId ? `/admin/schedule/monthly/${storeId}` : '/admin/branch-selection' },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: storeId ? `/admin/attendance/${storeId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: storeId ? `/admin/substitute/${storeId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: storeId ? `/admin/employees/${storeId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: storeId ? `/admin/payroll/${storeId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: storeId ? `/admin/documents/${storeId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: storeId ? `/admin/board/${storeId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: storeId ? `/admin/analytics/${storeId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: storeId ? `/admin/cctv/${storeId}` : '/admin/branch-selection' },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const [employees, setEmployees] = useState<UserVo[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, StoreMemberVo>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [editTarget, setEditTarget] = useState<UserVo | null>(null);
  const [payType, setPayType] = useState<"HOURLY" | "MONTHLY">("HOURLY");
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users", { params: { store_id: storeId } });
      const list: UserVo[] = Array.isArray(res.data) ? res.data : [];
      setEmployees(list);
      const results = await Promise.allSettled(
        list.map((u) =>
          axiosInstance.get("/store_member/pay", {
            params: { user_id: u.id, store_id: storeId },
          }),
        ),
      );
      const map: Record<string, StoreMemberVo> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.data)
          map[list[i].id] = r.value.data;
      });
      setMemberMap(map);
    } catch (err) {
      console.error("직원 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [storeId]);

  const openEdit = (emp: UserVo) => {
    const info = memberMap[emp.id];
    setEditTarget(emp);
    setPayType((info?.pay_type as "HOURLY" | "MONTHLY") || "HOURLY");
    setPayAmount(info?.pay_amount?.toString() || "");
  };

  const handleSavePay = async () => {
    if (!editTarget || !payAmount) return;
    setSaving(true);
    try {
      await axiosInstance.put("/store_member/pay", {
        user_id: editTarget.id,
        store_id: storeId,
        pay_type: payType,
        pay_amount: parseInt(payAmount),
      });
      setMemberMap((prev) => ({
        ...prev,
        [editTarget.id]: {
          ...(prev[editTarget.id] || {}),
          user_id: editTarget.id,
          store_id: storeId,
          pay_type: payType,
          pay_amount: parseInt(payAmount),
        } as StoreMemberVo,
      }));
      setEditTarget(null);
    } catch {
      alert(t.errSave);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: UserVo) => {
    if (!confirm(t.deleteConfirm(emp.name))) return;
    try {
      await axiosInstance.delete("/store_member", {
        params: { store_id: storeId, user_id: emp.id },
      });
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    } catch {
      alert(t.errDelete);
    }
  };

  const filtered = employees.filter(
    (e) => e.name.includes(searchTerm) || e.phone.includes(searchTerm),
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

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

  const approvedCount = employees.filter(
    (e) => memberMap[e.id]?.approval_status === "APPROVED",
  ).length;
  const pendingCount = employees.filter(
    (e) => memberMap[e.id]?.approval_status === "PENDING",
  ).length;
  const unsetCount = employees.filter(
    (e) => !memberMap[e.id]?.pay_amount,
  ).length;

  const pageBg = isDark ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)' : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const contentBg = isDark ? '#141414' : '#fff';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? '#141414' : 'rgba(230,245,200,0.35)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#c8c8c8' : '#555';
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;

  const getPayDisplay = (info?: StoreMemberVo) => {
    if (!info?.pay_amount) return <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>{t.payNotSetLabel}</span>;
    return info.pay_type === "HOURLY"
      ? <span style={{ color: DARK_GREEN, fontSize: 13, fontWeight: 600 }}>{t.hourlyPerHour(info.pay_amount)}</span>
      : <span style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>{t.monthlyPerMonth(info.pay_amount)}</span>;
  };

  const getStatusBadge = (status?: string) => {
    if (status === "APPROVED") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: isDark ? '#4cd964' : GREEN, background: isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
        <CheckCircle size={12} />{t.statusApproved}
      </span>
    );
    if (status === "PENDING") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
        <Clock size={12} />{t.statusPending}
      </span>
    );
    return <span style={{ fontSize: 13, color: subTextColor }}>-</span>;
  };

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
            const isActive = path.includes('/schedule/') ? location.pathname.includes('/admin/schedule/') : (location.pathname === path || location.pathname.startsWith(path));
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              {currentBranch} <ChevronRight size={12} /> {t.breadcrumb}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={26} />{t.pageTitle}
            </h1>
            <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{t.pageSubtitle}</p>
          </div>
        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t.totalEmployees, value: t.count(employees.length), color: textColor, icon: <Users size={22} color={GREEN} /> },
            { label: t.active, value: t.count(approvedCount), color: GREEN, icon: <UserCheck size={22} color={GREEN} /> },
            { label: t.pendingApproval, value: t.count(pendingCount), color: pendingCount > 0 ? '#f59e0b' : subTextColor, icon: <Clock size={22} color={pendingCount > 0 ? '#f59e0b' : subTextColor} /> },
            { label: t.payNotSet, value: t.count(unsetCount), color: unsetCount > 0 ? '#f59e0b' : GREEN, icon: <DollarSign size={22} color={unsetCount > 0 ? '#f59e0b' : GREEN} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 20, padding: '16px 20px', boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
              </div>
              {icon}
            </div>
          ))}
        </div>

        {/* 검색 */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, background: isDark ? '#1a1a1a' : 'rgba(255,255,255,0.7)', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 테이블 */}
        <div style={{ background: isDark ? '#141414' : 'rgba(230,245,200,0.35)', border: `1px solid ${isDark ? '#1e2e1e' : BORDER_GREEN}`, borderRadius: 20, boxShadow: '0px 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${isDark ? '#1e2e1e' : BORDER_GREEN}`, fontSize: 15, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color={GREEN} />
            {t.staffList(filtered.length)}
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: subTextColor, fontSize: 14 }}>{t.loading}</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: subTextColor, fontSize: 14 }}>{employees.length === 0 ? t.noEmployees : t.noSearchResult}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: isDark ? 'rgba(24,160,34,0.1)' : LIGHT_GREEN }}>
                    {[t.tableEmployee, t.tableContact, t.tableLevel, t.tablePay, t.tableStatus, t.tableActions].map((h, i) => (
                      <th key={h} style={{ padding: i === 0 ? '13px 20px 13px 52px' : '13px 20px', textAlign: i === 0 ? 'left' : 'center', fontSize: 13, fontWeight: 700, color: DARK_GREEN, letterSpacing: '0.02em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((emp) => {
                    const info = memberMap[emp.id];
                    return (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${isDark ? '#1e2e1e' : 'rgba(0,162,0,0.1)'}` }}>
                        <td style={{ padding: '14px 20px 14px 52px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0, boxShadow: '0 2px 6px rgba(7,121,15,0.25)' }}>{emp.name[0]}</div>
                            <div>
                              <p style={{ fontWeight: 700, color: textColor, fontSize: 14, margin: 0 }}>{emp.name}</p>
                              <p style={{ fontSize: 12, color: subTextColor, margin: '2px 0 0' }}>{emp.username}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', color: subTextColor, fontSize: 14, textAlign: 'center' }}>{emp.phone}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {info?.user_level ? (
                            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 700, background: isDark ? (LEVEL_BG_DARK[info.user_level] || 'rgba(107,114,128,0.15)') : (LEVEL_BG[info.user_level] || '#f3f4f6'), color: isDark ? (LEVEL_TEXT_DARK[info.user_level] || '#9ca3af') : (LEVEL_TEXT[info.user_level] || '#6b7280'), border: `1px solid ${isDark ? (LEVEL_BORDER_DARK[info.user_level] || 'rgba(107,114,128,0.3)') : 'transparent'}` }}>
                              {LEVEL_LABEL_I18N[info.user_level] || info.user_level}
                            </span>
                          ) : <span style={{ color: subTextColor, fontSize: 13 }}>-</span>}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>{getPayDisplay(info)}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>{getStatusBadge(info?.approval_status)}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => openEdit(emp)} title={t.payDialogTitle(emp.name || '')} style={{ background: isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN, border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? '#4cd964' : DARK_GREEN }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(emp)} title={t.tableActions} style={{ background: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'transparent'}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? '#f87171' : '#ef4444' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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

      {/* 급여 설정 모달 */}
      {!!editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditTarget(null)} />
          <div style={{ position: 'relative', background: isDark ? '#141414' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 420, margin: '0 16px', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{t.payDialogTitle(editTarget?.name || '')}</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTextColor }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 8 }}>{t.payType}</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPayType("HOURLY")} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${payType === 'HOURLY' ? DARK_GREEN : '#d1d5db'}`, background: payType === 'HOURLY' ? LIGHT_GREEN : 'transparent', color: payType === 'HOURLY' ? DARK_GREEN : subTextColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.hourly}</button>
                  <button onClick={() => setPayType("MONTHLY")} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${payType === 'MONTHLY' ? '#7c3aed' : '#d1d5db'}`, background: payType === 'MONTHLY' ? '#ede9fe' : 'transparent', color: payType === 'MONTHLY' ? '#7c3aed' : subTextColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.monthly}</button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 8 }}>{payType === "HOURLY" ? t.hourlyAmount : t.monthlyAmount}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={payType === "HOURLY" ? t.hourlyPlaceholder : t.monthlyPlaceholder} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_GREEN}`, borderRadius: 10, background: isDark ? '#1a1a1a' : '#fff', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                {payAmount && Number(payAmount) > 0 && (
                  <p style={{ fontSize: 12, color: subTextColor, marginTop: 6 }}>{payType === "HOURLY" ? t.hourlyPerHour(Number(payAmount)) : t.monthlyPerMonth(Number(payAmount))}</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.cancelBtn}</button>
              <button onClick={handleSavePay} disabled={!payAmount || Number(payAmount) <= 0 || saving} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!payAmount || Number(payAmount) <= 0 || saving) ? 0.5 : 1 }}>
                {saving ? t.saving : t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

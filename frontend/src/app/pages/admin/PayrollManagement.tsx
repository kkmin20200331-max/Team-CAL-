import { API_BASE } from "../../../lib/axiosInstance";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  DollarSign,
  Download,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  FileText,
  TrendingUp,
  CreditCard,
  User,
  Calendar,
  UserPlus,
  Users,
  Wallet,
  MessageSquare,
  BarChart3,
  Video,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  location: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  hourlyRate: number;
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  deductions: {
    tax: number;
    insurance: number;
    pension: number;
  };
  totalPay: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requestedDate: string;
  paidDate?: string;
}

interface WeeklyPayRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStart: string;
  weekEnd: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requestDate: string;
  reason: string;
}

interface ApiPayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  location: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  hourlyRate: number;
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  tax: number;
  insurance: number;
  pension: number;
  totalPay: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requestedDate: string;
  paidDate?: string;
}

interface MonthlyPayrollPoint {
  month: string;
  amount: number;
}

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getRecentPeriods = (count: number) => {
  const periods: string[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return periods;
};

const formatWon = (amount: number) =>
  `${Math.round(Number(amount || 0)).toLocaleString()}원`;

const PayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.payrollManagement[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'payroll' | 'weekly' | 'analytics'>('payroll');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [monthlyPayrollData, setMonthlyPayrollData] = useState<MonthlyPayrollPoint[]>([]);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const mapPayrollEntry = (entry: ApiPayrollEntry): PayrollEntry => ({
    id: entry.id,
    employeeId: entry.employeeId,
    employeeName: entry.employeeName,
    position: entry.position || '직원',
    location: currentBranch,
    period: entry.period,
    regularHours: Number(entry.regularHours || 0),
    overtimeHours: Number(entry.overtimeHours || 0),
    holidayHours: Number(entry.holidayHours || 0),
    hourlyRate: Number(entry.hourlyRate || 0),
    basePay: Number(entry.basePay || 0),
    overtimePay: Number(entry.overtimePay || 0),
    holidayPay: Number(entry.holidayPay || 0),
    deductions: {
      tax: Number(entry.tax || 0),
      insurance: Number(entry.insurance || 0),
      pension: Number(entry.pension || 0),
    },
    totalPay: Number(entry.totalPay || 0),
    status: entry.status || 'pending',
    requestedDate: entry.requestedDate,
    paidDate: entry.paidDate,
  });

  const fetchPayrollEntries = async (period: string) => {
    if (!selectedBranchId) return [];

    const response = await fetch(
      `${API_BASE}/payroll/store?store_id=${encodeURIComponent(selectedBranchId)}&year_month=${encodeURIComponent(period)}`
    );

    if (!response.ok) {
      throw new Error('급여 정보를 불러오지 못했습니다.');
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(mapPayrollEntry) : [];
  };

  useEffect(() => {
    if (!selectedBranchId) return;

    setPayrollLoading(true);
    setPayrollError('');

    fetchPayrollEntries(selectedPeriod)
      .then(setPayrollEntries)
      .catch((error) => {
        setPayrollEntries([]);
        setPayrollError(error instanceof Error ? error.message : '급여 정보를 불러오지 못했습니다.');
      })
      .finally(() => setPayrollLoading(false));
  }, [selectedBranchId, selectedPeriod]);

  useEffect(() => {
    if (!selectedBranchId) return;

    const refreshPayroll = () => {
      if (document.visibilityState === 'hidden') return;

      fetchPayrollEntries(selectedPeriod)
        .then(setPayrollEntries)
        .catch(() => {});
    };

    window.addEventListener('focus', refreshPayroll);
    document.addEventListener('visibilitychange', refreshPayroll);

    return () => {
      window.removeEventListener('focus', refreshPayroll);
      document.removeEventListener('visibilitychange', refreshPayroll);
    };
  }, [selectedBranchId, selectedPeriod]);

  useEffect(() => {
    if (!selectedBranchId) return;

    Promise.all(
      getRecentPeriods(6).map(period =>
        fetchPayrollEntries(period).then(entries => ({
          month: `${Number(period.slice(5, 7))}월`,
          amount: entries.reduce((sum, entry) => sum + entry.totalPay, 0),
        }))
      )
    )
      .then(setMonthlyPayrollData)
      .catch(() => setMonthlyPayrollData([]));
  }, [selectedBranchId]);

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  const [weeklyPayRequests] = useState<WeeklyPayRequest[]>([]);

  const payrollByPosition = Object.values(
    payrollEntries.reduce<Record<string, { name: string; value: number; percentage: number }>>((acc, entry) => {
      const key = entry.position || '직원';
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, percentage: 0 };
      }
      acc[key].value += entry.totalPay;
      return acc;
    }, {})
  ).map(item => ({
    ...item,
    percentage: payrollEntries.length
      ? Math.round((item.value / Math.max(payrollEntries.reduce((sum, entry) => sum + entry.totalPay, 0), 1)) * 100)
      : 0,
  }));

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const filteredPayroll = payrollEntries.filter((entry) => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = entry.period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t.statusPaid}</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />{t.statusApproved}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />{t.statusPending}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />{t.statusRejected}</Badge>;
      default:
        return null;
    }
  };

  const calculateStats = () => {
    const totalPayroll = filteredPayroll.reduce((sum, entry) => sum + entry.totalPay, 0);
    const employeeCount = filteredPayroll.length;
    const regularHours = filteredPayroll.reduce((sum, entry) => sum + entry.regularHours, 0);
    const overtimeHours = filteredPayroll.reduce((sum, entry) => sum + entry.overtimeHours, 0);
    const weeklyPending = weeklyPayRequests.filter((r) => r.status === "pending").length;
    return { totalPayroll, employeeCount, regularHours, overtimeHours, weeklyPending };
  };

  const stats = calculateStats();

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />

      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: sidebarBg,
          border: `1px solid ${sidebarBorder}`,
          borderRadius: 20, padding: '16px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          position: 'sticky', top: 140,
          maxHeight: 'calc(100vh - 160px)',
          overflowY: 'auto',
        }}>
          {/* Branch dropdown */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#50505a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: isDark ? '#1c1c1e' : '#fff',
                border: `1px solid ${isDark ? '#3a3a3c' : BORDER_GREEN}`,
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                {stores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sessionStorage.setItem('store_id', s.id);
                      sessionStorage.setItem('store_name', s.name);
                      setBranchDropdownOpen(false);
                      navigate(`/admin/dashboard/${s.id}`);
                    }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                      background: s.id === selectedBranchId ? LIGHT_GREEN : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = LIGHT_GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = s.id === selectedBranchId ? LIGHT_GREEN : 'transparent'; }}
                  >
                    {s.name}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${isDark ? '#3a3a3c' : '#e5e7eb'}` }} />
                <button
                  onClick={() => { setBranchDropdownOpen(false); navigate('/admin/branch-selection'); }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#888' : '#aaa', fontSize: 12 }}
                  onMouseOver={e => { e.currentTarget.style.background = isDark ? '#2c2c2e' : '#f5f5f5'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  + 지점 선택 페이지로
                </button>
              </div>
            )}
          </div>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px', marginBottom: 4,
                  background: isActive ? GREEN : 'transparent',
                  border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN),
                  fontSize: 14, fontWeight: 600, textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none',
                }}
                onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; } }}
                onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
              >
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main white card */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24,
          padding: '28px 28px 32px',
          boxShadow: '0px 8px 40px rgba(0,0,0,0.18)',
        }}>
          {/* Page title row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: 0 }}>{t.title}</h1>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: t.totalPay, value: formatWon(stats.totalPayroll) },
              { label: '직원 수', value: String(stats.employeeCount) },
              { label: '총 근무시간', value: `${stats.regularHours.toFixed(1)}h` },
              { label: '연장시간', value: `${stats.overtimeHours.toFixed(1)}h` },
              { label: t.weeklyRequest, value: String(stats.weeklyPending) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#8BA68D', marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: DARK_GREEN, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'payroll', label: t.tabPayroll, icon: <DollarSign size={16} /> },
              { key: 'weekly', label: t.tabWeekly, icon: <CreditCard size={16} /> },
              { key: 'analytics', label: t.tabAnalytics, icon: <TrendingUp size={16} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  border: activeTab === key ? 'none' : `1px solid ${BORDER_GREEN}`,
                  background: activeTab === key ? GREEN : 'transparent',
                  color: activeTab === key ? '#fff' : DARK_GREEN,
                  cursor: 'pointer',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <>
              {/* Filters */}
              <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} color={DARK_GREEN} />
                    <input
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor }}
                    />
                  </div>
                  <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8BA68D' }} />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Table */}
              <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>{t.payrollList(filteredPayroll.length)}</p>
                {payrollError && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    {payrollError}
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: LIGHT_GREEN }}>
                        {[t.colEmployee, t.colPositionStore, t.colHours, t.colBase, t.colOvertime, t.colDeduction, t.colNet].map(col => (
                          <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrollLoading && (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#8BA68D', fontSize: 14, fontWeight: 600 }}>
                            급여 정보를 불러오는 중입니다.
                          </td>
                        </tr>
                      )}
                      {!payrollLoading && filteredPayroll.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#8BA68D', fontSize: 14, fontWeight: 600 }}>
                            해당 월의 급여 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                      {!payrollLoading && filteredPayroll.map((entry, idx) => (
                        <tr key={entry.id} style={{ background: idx % 2 === 0 ? 'rgba(230,245,200,0.2)' : 'transparent', borderBottom: `1px solid ${LIGHT_GREEN}` }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: textColor }}>
                            <div style={{ fontWeight: 600 }}>{entry.employeeName}</div>
                            <div style={{ fontSize: 13, color: '#8BA68D' }}>{entry.employeeId}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: textColor }}>
                            <div>{entry.position}</div>
                            <div style={{ fontSize: 13, color: '#8BA68D' }}>{entry.location}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: textColor }}>
                            <div>{t.regularHours(entry.regularHours)}</div>
                            <div style={{ color: '#2563eb' }}>{t.overtimeHours(entry.overtimeHours)}</div>
                            <div style={{ color: GREEN }}>{t.holidayHours(entry.holidayHours)}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: textColor }}>{formatWon(entry.basePay)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: textColor }}>{formatWon(entry.overtimePay + entry.holidayPay)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#ef4444' }}>{formatWon(entry.deductions.tax + entry.deductions.insurance + entry.deductions.pension)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: DARK_GREEN, fontWeight: 700 }}>{formatWon(entry.totalPay)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Weekly Pay Requests Tab */}
          {activeTab === "weekly" && (
            <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CreditCard size={18} color={DARK_GREEN} />
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>{t.weeklyRequestList}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {weeklyPayRequests.length === 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '24px 16px', border: `1px solid ${LIGHT_GREEN}`, textAlign: 'center', color: '#8BA68D', fontSize: 14, fontWeight: 600 }}>
                    주급 요청 데이터가 없습니다.
                  </div>
                )}
                {weeklyPayRequests.map((request) => (
                  <div key={request.id} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '16px', border: `1px solid ${LIGHT_GREEN}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: LIGHT_GREEN, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={22} color={DARK_GREEN} />
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: 0 }}>{request.employeeName}</p>
                          <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{request.employeeId}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                      {[
                        { label: t.workPeriod, value: `${request.weekStart} ~ ${request.weekEnd}` },
                        { label: t.requestAmount, value: formatWon(request.requestedAmount) },
                        { label: t.approvedAmount, value: request.approvedAmount ? formatWon(request.approvedAmount) : '-' },
                        { label: t.requestDate, value: request.requestDate },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{label}</p>
                          <p style={{ fontSize: 14, color: textColor, fontWeight: 600, margin: 0 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: LIGHT_GREEN, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{t.requestReason}</p>
                      <p style={{ fontSize: 14, color: textColor, margin: 0 }}>{request.reason}</p>
                    </div>
                    {request.status === "pending" && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ flex: 1, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <CheckCircle size={16} />{t.approveRequest}
                        </button>
                        <button style={{ flex: 1, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <XCircle size={16} />{t.rejectRequest}
                        </button>
                      </div>
                    )}
                    {request.status === "approved" && (
                      <button style={{ width: '100%', background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Send size={16} />{t.payRequest}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Monthly Trend */}
              <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>{t.monthlyTrend}</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPayrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={LIGHT_GREEN} />
                    <XAxis dataKey="month" tick={{ fill: '#8BA68D', fontSize: 13 }} />
                    <YAxis tick={{ fill: '#8BA68D', fontSize: 13 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke={GREEN} name={t.totalPay} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* By Position Pie */}
                <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>{t.byPosition}</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={payrollByPosition}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {payrollByPosition.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary */}
                <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>{t.payrollSummary}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {payrollByPosition.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: COLORS[index] }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{item.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: DARK_GREEN }}>{formatWon(item.value)}</div>
                          <div style={{ fontSize: 13, color: '#8BA68D' }}>{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  DollarSign, Download, CheckCircle, Clock, XCircle,
  Search, FileText, TrendingUp, User, Calendar,
  UserPlus, Users, Wallet, MessageSquare, BarChart3, Video, ChevronRight,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';
const API = 'http://localhost:8080/api';

interface EmployeeVO {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: string;
}

interface PayrollResultVO {
  basePay: number;
  overtimePay: number;
  nightPay: number;
  weeklyPay: number;
  totalPay: number;
}

interface PayrollRow {
  employee: EmployeeVO;
  result: PayrollResultVO | null;
  loading: boolean;
}

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const PayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pageBg = isDark
    ? 'linear-gradient(180deg, #1a3020 -12.05%, #2a3a28 17.27%, #30303a 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(52,52,60,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#50505a' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';
  const subText = isDark ? '#aaa' : '#8BA68D';
  const contentBg = isDark ? '#3c3c46' : '#fff';
  const mainBg = isDark ? '#35353f' : 'rgba(255,255,255,0.97)';
  const cardBg = isDark ? 'rgba(52,52,60,0.7)' : 'rgba(230,245,200,0.35)';

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'payroll' | 'analytics'>('payroll');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

  const [employees, setEmployees] = useState<EmployeeVO[]>([]);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoadingEmployees(true);
    fetch(`${API}/users?store_id=${branchId}`)
      .then(r => r.json())
      .then((data: EmployeeVO[]) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, [branchId]);

  const getPeriodDates = (period: string) => {
    const [year, month] = period.split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    return { start, end };
  };

  const fetchPayrolls = useCallback(async (emps: EmployeeVO[], period: string) => {
    if (!branchId || emps.length === 0) return;
    const { start, end } = getPeriodDates(period);

    setPayrollRows(emps.map(e => ({ employee: e, result: null, loading: true })));

    const results = await Promise.all(
      emps.map(async (emp) => {
        try {
          const res = await fetch(
            `${API}/payroll?user_id=${emp.id}&store_id=${branchId}&start_date=${start}&end_date=${end}`
          );
          const data: PayrollResultVO = await res.json();
          return { employee: emp, result: data, loading: false };
        } catch {
          return { employee: emp, result: null, loading: false };
        }
      })
    );
    setPayrollRows(results);
  }, [branchId]);

  useEffect(() => {
    if (employees.length > 0) fetchPayrolls(employees, selectedPeriod);
  }, [employees, selectedPeriod]);

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

  const filteredRows = payrollRows.filter(row =>
    row.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.employee.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayroll = payrollRows.reduce((s, r) => s + (r.result?.totalPay || 0), 0);
  const totalBase = payrollRows.reduce((s, r) => s + (r.result?.basePay || 0), 0);
  const totalOvertime = payrollRows.reduce((s, r) => s + (r.result?.overtimePay || 0), 0);
  const totalNight = payrollRows.reduce((s, r) => s + (r.result?.nightPay || 0), 0);
  const totalWeekly = payrollRows.reduce((s, r) => s + (r.result?.weeklyPay || 0), 0);

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`,
    fontSize: 14, background: isDark ? '#50505a' : 'rgba(255,255,255,0.8)',
    outline: 'none', color: textColor,
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />

      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>

        {/* 사이드바 */}
        <aside style={{ width: 220, flexShrink: 0, background: sidebarBg, border: `1px solid ${sidebarBorder}`, borderRadius: 20, padding: '20px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.06)' : LIGHT_GREEN, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : BORDER_GREEN}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: isDark ? '#fff' : DARK_GREEN, fontSize: 12, fontWeight: 700 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: isDark ? '#30303a' : '#fff', border: `1px solid ${sidebarBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {stores.map(s => (
                  <button key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); setBranchDropdownOpen(false); navigate(`/admin/dashboard/${s.id}`); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: s.id === branchId ? LIGHT_GREEN : 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', marginBottom: 4, background: isActive ? GREEN : 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), fontSize: 14, fontWeight: 600, transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> 급여 관리
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wallet size={26} />직원 급여 계산 및 현황
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>출근 기록을 기반으로 급여를 자동 계산합니다.</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Download size={16} />급여명세서 내보내기
            </button>
          </div>

          {/* 통계 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '총 지급액', value: fmt(Math.round(totalPayroll)), color: DARK_GREEN },
              { label: '기본급', value: fmt(Math.round(totalBase)), color: DARK_GREEN },
              { label: '연장수당', value: fmt(Math.round(totalOvertime)), color: '#2563eb' },
              { label: '야간수당', value: fmt(Math.round(totalNight)), color: '#7c3aed' },
              { label: '주휴수당', value: fmt(Math.round(totalWeekly)), color: GREEN },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: cardBg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: subText, marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'payroll', label: '급여 내역', icon: <DollarSign size={16} /> },
              { key: 'analytics', label: '분석', icon: <TrendingUp size={16} /> },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => setActiveTab(key as any)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, border: activeTab === key ? 'none' : `1px solid ${BORDER_GREEN}`, background: activeTab === key ? GREEN : 'transparent', color: activeTab === key ? '#fff' : DARK_GREEN, cursor: 'pointer' }}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* 급여 내역 탭 */}
          {activeTab === 'payroll' && (
            <>
              {/* 필터 */}
              <div style={{ background: cardBg, borderRadius: 16, padding: '14px 18px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} color={DARK_GREEN} />
                    <input type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subText }} />
                    <input type="text" placeholder="직원명으로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* 테이블 */}
              <div style={{ background: cardBg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>
                  {selectedPeriod} 급여 내역 ({filteredRows.length}명)
                </p>
                {loadingEmployees ? (
                  <p style={{ textAlign: 'center', color: subText, padding: '40px 0' }}>불러오는 중...</p>
                ) : filteredRows.length === 0 ? (
                  <p style={{ textAlign: 'center', color: subText, padding: '40px 0' }}>직원이 없습니다.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: LIGHT_GREEN }}>
                          {['직원', '기본급', '연장수당', '야간수당', '주휴수당', '총 지급액'].map(col => (
                            <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, idx) => (
                          <tr key={row.employee.id} style={{ background: idx % 2 === 0 ? 'rgba(230,245,200,0.2)' : 'transparent', borderBottom: `1px solid ${LIGHT_GREEN}` }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                  {(row.employee.name || '?')[0]}
                                </div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{row.employee.name}</div>
                                  <div style={{ fontSize: 12, color: subText }}>{row.employee.username}</div>
                                </div>
                              </div>
                            </td>
                            {row.loading ? (
                              <td colSpan={5} style={{ padding: '14px 16px', fontSize: 13, color: subText }}>계산 중...</td>
                            ) : row.result ? (
                              <>
                                <td style={{ padding: '14px 16px', fontSize: 14, color: textColor }}>{fmt(Math.round(row.result.basePay))}</td>
                                <td style={{ padding: '14px 16px', fontSize: 14, color: '#2563eb' }}>{fmt(Math.round(row.result.overtimePay))}</td>
                                <td style={{ padding: '14px 16px', fontSize: 14, color: '#7c3aed' }}>{fmt(Math.round(row.result.nightPay))}</td>
                                <td style={{ padding: '14px 16px', fontSize: 14, color: GREEN }}>{fmt(Math.round(row.result.weeklyPay))}</td>
                                <td style={{ padding: '14px 16px', fontSize: 15, color: DARK_GREEN, fontWeight: 800 }}>{fmt(Math.round(row.result.totalPay))}</td>
                              </>
                            ) : (
                              <td colSpan={5} style={{ padding: '14px 16px', fontSize: 13, color: subText }}>데이터 없음</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr style={{ background: LIGHT_GREEN, fontWeight: 800 }}>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: DARK_GREEN, fontWeight: 800 }}>합계</td>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: DARK_GREEN }}>{fmt(Math.round(totalBase))}</td>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: '#2563eb' }}>{fmt(Math.round(totalOvertime))}</td>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: '#7c3aed' }}>{fmt(Math.round(totalNight))}</td>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: GREEN }}>{fmt(Math.round(totalWeekly))}</td>
                            <td style={{ padding: '14px 16px', fontSize: 15, color: DARK_GREEN, fontWeight: 800 }}>{fmt(Math.round(totalPayroll))}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 분석 탭 */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 직원별 급여 비교 */}
              <div style={{ background: cardBg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>직원별 급여 비교 ({selectedPeriod})</p>
                {payrollRows.filter(r => r.result && r.result.totalPay > 0).length === 0 ? (
                  <p style={{ textAlign: 'center', color: subText, padding: '24px 0' }}>급여 데이터가 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {payrollRows
                      .filter(r => r.result && r.result.totalPay > 0)
                      .sort((a, b) => (b.result?.totalPay || 0) - (a.result?.totalPay || 0))
                      .map(row => {
                        const pct = totalPayroll > 0 ? ((row.result?.totalPay || 0) / totalPayroll) * 100 : 0;
                        return (
                          <div key={row.employee.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{row.employee.name}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: DARK_GREEN }}>{fmt(Math.round(row.result!.totalPay))} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div style={{ height: 10, background: isDark ? '#50505a' : '#e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${GREEN}, ${DARK_GREEN})`, borderRadius: 5, transition: 'width 0.5s' }} />
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>

              {/* 수당 구성 */}
              <div style={{ background: cardBg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: DARK_GREEN, marginBottom: 16 }}>수당 구성</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {[
                    { label: '기본급', value: totalBase, color: GREEN },
                    { label: '연장수당', value: totalOvertime, color: '#2563eb' },
                    { label: '야간수당', value: totalNight, color: '#7c3aed' },
                    { label: '주휴수당', value: totalWeekly, color: '#f59e0b' },
                  ].map(({ label, value, color }) => {
                    const pct = totalPayroll > 0 ? (value / totalPayroll) * 100 : 0;
                    return (
                      <div key={label} style={{ background: isDark ? '#3c3c46' : '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${LIGHT_GREEN}`, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                          <DollarSign size={22} color={color} />
                        </div>
                        <p style={{ fontSize: 13, color: subText, marginBottom: 4 }}>{label}</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color, margin: '0 0 2px' }}>{fmt(Math.round(value))}</p>
                        <p style={{ fontSize: 12, color: subText, margin: 0 }}>{pct.toFixed(1)}%</p>
                      </div>
                    );
                  })}
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

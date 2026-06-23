import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useState, useEffect } from "react";
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
  UserPlus,
  Wallet,
  FileText,
  MessageSquare,
  BarChart3,
  Video,
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
const LEVEL_TEXT: Record<string, string> = {
  NEWBIE: '#6b7280',
  REGULAR: DARK_GREEN,
  CLOSER: '#4f46e5',
  MANAGER: '#92400e',
};

export default function EmployeeManagement() {
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
    { icon: Calendar, label: '근무표 관리', path: storeId ? `/admin/schedule/monthly/${storeId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: '대타 모집', path: storeId ? `/admin/substitute/${storeId}` : '/admin/branch-selection' },
    { icon: Users, label: '직원 관리', path: storeId ? `/admin/employees/${storeId}` : '/admin/branch-selection' },
    { icon: Wallet, label: '급여 관리', path: storeId ? `/admin/payroll/${storeId}` : '/admin/branch-selection' },
    { icon: FileText, label: '문서 관리', path: storeId ? `/admin/documents/${storeId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: '게시판', path: storeId ? `/admin/board/${storeId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: 'AI 고객 분석', path: storeId ? `/admin/analytics/${storeId}` : '/admin/branch-selection' },
    { icon: Video, label: 'CCTV 분석', path: storeId ? `/admin/cctv/${storeId}` : '/admin/branch-selection' },
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
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: UserVo) => {
    if (!confirm(`${emp.name}님을 매장에서 제거하시겠습니까?`)) return;
    try {
      await axiosInstance.delete("/store_member", {
        params: { store_id: storeId, user_id: emp.id },
      });
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const filtered = employees.filter(
    (e) => e.name.includes(searchTerm) || e.phone.includes(searchTerm),
  );

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
  const cardBg = isDark ? '#2c2c2e' : 'rgba(230,245,200,0.35)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;

  const getPayDisplay = (info?: StoreMemberVo) => {
    if (!info?.pay_amount) return <span style={{ color: '#f59e0b', fontSize: 12 }}>미설정</span>;
    return info.pay_type === "HOURLY"
      ? <span style={{ color: DARK_GREEN, fontSize: 12 }}>{info.pay_amount.toLocaleString()}원/시</span>
      : <span style={{ color: '#7c3aed', fontSize: 12 }}>{(info.pay_amount / 10000).toFixed(1)}만원/월</span>;
  };

  const getStatusBadge = (status?: string) => {
    if (status === "APPROVED") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: GREEN, background: LIGHT_GREEN, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
        <CheckCircle size={11} />승인됨
      </span>
    );
    if (status === "PENDING") return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#92400e', background: '#fef3c7', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
        <Clock size={11} />대기중
      </span>
    );
    return <span style={{ fontSize: 12, color: subTextColor }}>-</span>;
  };

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
            const isActive = path.includes('/schedule/') ? location.pathname.includes('/admin/schedule/') : (location.pathname === path || location.pathname.startsWith(path));
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
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN }}>직원 관리</h1>
            <p style={{ fontSize: 14, color: subTextColor, marginTop: 4 }}>{storeName}</p>
          </div>
        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '전체 직원', value: `${employees.length}명`, color: textColor, icon: <Users size={22} color={GREEN} /> },
            { label: '재직중', value: `${approvedCount}명`, color: GREEN, icon: <UserCheck size={22} color={GREEN} /> },
            { label: '승인 대기', value: `${pendingCount}명`, color: pendingCount > 0 ? '#f59e0b' : subTextColor, icon: <Clock size={22} color={pendingCount > 0 ? '#f59e0b' : subTextColor} /> },
            { label: '급여 미설정', value: `${unsetCount}명`, color: unsetCount > 0 ? '#f59e0b' : GREEN, icon: <DollarSign size={22} color={unsetCount > 0 ? '#f59e0b' : GREEN} /> },
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
            placeholder="이름 또는 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.7)', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 테이블 */}
        <div style={{ background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26, boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER_GREEN}`, fontSize: 15, fontWeight: 700, color: textColor }}>직원 목록 ({filtered.length}명)</div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>{employees.length === 0 ? "등록된 직원이 없습니다" : "검색 결과가 없습니다"}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: LIGHT_GREEN }}>
                    {['직원', '연락처', '레벨', '급여', '상태', '작업'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: DARK_GREEN }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => {
                    const info = memberMap[emp.id];
                    return (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${isDark ? '#3a3a3c' : '#e8f5e9'}` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{emp.name[0]}</div>
                            <div>
                              <p style={{ fontWeight: 600, color: textColor }}>{emp.name}</p>
                              <p style={{ fontSize: 11, color: subTextColor }}>{emp.username}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: subTextColor }}>{emp.phone}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {info?.user_level ? (
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: LEVEL_BG[info.user_level] || '#f3f4f6', color: LEVEL_TEXT[info.user_level] || '#6b7280' }}>
                              {LEVEL_LABEL[info.user_level] || info.user_level}
                            </span>
                          ) : <span style={{ color: subTextColor, fontSize: 12 }}>-</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{getPayDisplay(info)}</td>
                        <td style={{ padding: '12px 16px' }}>{getStatusBadge(info?.approval_status)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => openEdit(emp)} title="급여 설정" style={{ background: LIGHT_GREEN, border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: DARK_GREEN }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(emp)} title="직원 제거" style={{ background: '#fee2e2', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={13} />
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
        </div>
      </div>

      {/* 급여 설정 모달 */}
      {!!editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditTarget(null)} />
          <div style={{ position: 'relative', background: isDark ? '#2c2c2e' : '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 420, margin: '0 16px', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{editTarget?.name}님 급여 설정</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTextColor }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 8 }}>급여 유형</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPayType("HOURLY")} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${payType === 'HOURLY' ? DARK_GREEN : '#d1d5db'}`, background: payType === 'HOURLY' ? LIGHT_GREEN : 'transparent', color: payType === 'HOURLY' ? DARK_GREEN : subTextColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>시급</button>
                  <button onClick={() => setPayType("MONTHLY")} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${payType === 'MONTHLY' ? '#7c3aed' : '#d1d5db'}`, background: payType === 'MONTHLY' ? '#ede9fe' : 'transparent', color: payType === 'MONTHLY' ? '#7c3aed' : subTextColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>월급</button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: subTextColor, marginBottom: 8 }}>{payType === "HOURLY" ? "시급 (원)" : "월급 (원)"}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={payType === "HOURLY" ? "예: 10030" : "예: 2500000"} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_GREEN}`, borderRadius: 10, background: isDark ? '#3a3a3c' : '#fff', color: textColor, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                {payAmount && Number(payAmount) > 0 && (
                  <p style={{ fontSize: 12, color: subTextColor, marginTop: 6 }}>{payType === "HOURLY" ? `시간당 ${Number(payAmount).toLocaleString()}원` : `월 ${(Number(payAmount) / 10000).toFixed(1)}만원`}</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: '12px 0', background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 54, color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSavePay} disabled={!payAmount || Number(payAmount) <= 0 || saving} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`, border: 'none', borderRadius: 54, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!payAmount || Number(payAmount) <= 0 || saving) ? 0.5 : 1 }}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

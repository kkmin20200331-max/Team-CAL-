import axiosInstance, { API_BASE } from "../../../lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  Store,
  UserCheck,
  Users,
  Calendar,
  ClipboardCheck,
  UserPlus,
  Wallet,
  FileText,
  BarChart3,
  Video,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useLanguage } from '../../i18n/useLanguage';

const previewTranslations = {
  ko: {
    selectBranch: '지점 선택',
    selectedBranch: '선택 지점',
    errorNoBranch: '지점 정보가 없습니다. 관리자 대시보드에서 지점을 먼저 선택해주세요.',
    errorFetchFailed: '대타 신청 목록을 불러오지 못했습니다.',
    breadcrumbSubRecruitment: '대타 모집',
    pageTitle: '대타 모집 현황',
    pageSubtitle: '모집글을 먼저 확인하고, 필요한 글을 선택해서 기존 직원 연락 화면으로 이동합니다.',
    refresh: '새로고침',
    staffContactScreen: '직원 연락 화면',
    labelPosts: '모집글',
    labelPendingApps: '대기 신청',
    labelApplicants: '지원 직원',
    loadingText: '대타 모집글을 불러오는 중입니다.',
    noActivePostsTitle: '현재 모집 중인 대타 글이 없습니다.',
    noActivePostsDesc: '대타 모집글이 생성되면 이 영역에 먼저 표시됩니다.',
    requesterPrefix: '요청자: ',
    createdAtText: (date: string) => `생성 ${date}`,
    pendingAppsCount: (count: number) => `대기 신청 ${count}건`,
    noReasonText: '대타 요청',
    employeeFallback: '직원',
    noApplicantsText: '아직 지원자가 없습니다. 클릭하면 직원 연락 화면으로 이동합니다.',
    otherCountText: (count: number) => ` 외 ${count}명`,
    chooseContactTarget: '연락 대상 선택',
    adminFallback: '관리자',
    avatarLetter: '대',
  },
  en: {
    selectBranch: 'Select Store',
    selectedBranch: 'Selected Store',
    errorNoBranch: 'No store information found. Please select a store on the admin dashboard first.',
    errorFetchFailed: 'Failed to fetch substitute applications list.',
    breadcrumbSubRecruitment: 'Substitute Recruitment',
    pageTitle: 'Substitute Posting Status',
    pageSubtitle: 'Check active postings first, then select one to go to the staff contact page.',
    refresh: 'Refresh',
    staffContactScreen: 'Staff Contact Screen',
    labelPosts: 'Recruiting Posts',
    labelPendingApps: 'Pending Applications',
    labelApplicants: 'Applicants',
    loadingText: 'Loading substitute posts...',
    noActivePostsTitle: 'No active substitute postings.',
    noActivePostsDesc: 'Created substitute posts will be displayed in this area.',
    requesterPrefix: 'Requester: ',
    createdAtText: (date: string) => `Created: ${date}`,
    pendingAppsCount: (count: number) => `${count} Pending Applications`,
    noReasonText: 'Substitute Request',
    employeeFallback: 'Employee',
    noApplicantsText: 'No applicants yet. Click to go to the staff contact page.',
    otherCountText: (count: number) => ` and ${count} others`,
    chooseContactTarget: 'Select Contact Target',
    adminFallback: 'Admin',
    avatarLetter: 'S',
  },
  ja: {
    selectBranch: '店舗選択',
    selectedBranch: '選択店舗',
    errorNoBranch: '店舗情報がありません。管理ダッシュボードで店舗を先に選択してください。',
    errorFetchFailed: '代替申請リストを取得できませんでした。',
    breadcrumbSubRecruitment: '代替募集',
    pageTitle: '代替募集状況',
    pageSubtitle: '募集中の案件を先に確認し、必要な案件を選択して既存スタッフへの連絡画面へ移動します。',
    refresh: '更新',
    staffContactScreen: 'スタッフ連絡画面',
    labelPosts: '募集中の案件',
    labelPendingApps: '待機申請',
    labelApplicants: '応募スタッフ',
    loadingText: '代替募集中の案件を読み込んでいます。',
    noActivePostsTitle: '現在募集中の代替依頼はありません。',
    noActivePostsDesc: '代替募集が作成されると、このエリアに表示されます。',
    requesterPrefix: '依頼者: ',
    createdAtText: (date: string) => `作成日時: ${date}`,
    pendingAppsCount: (count: number) => `待機申請 ${count}件`,
    noReasonText: '代替リクエスト',
    employeeFallback: 'スタッフ',
    noApplicantsText: 'まだ応募者がいません。クリックするとスタッフ連絡画面へ移動します。',
    otherCountText: (count: number) => ` 外 ${count}名`,
    chooseContactTarget: '連絡対象を選択',
    adminFallback: '管理者',
    avatarLetter: '代',
  }
};
import { translations } from '../../i18n/translations';

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const BORDER_GREEN = "#00A200";
const LIGHT_GREEN = "#E6F5C8";

interface SubstitutePostVO {
  id: string;
  shift_id: string;
  store_id: string;
  requester_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  closed_at?: string;
}

interface SubstituteApplicationVO {
  id: string;
  substitute_post_id: string;
  applicant_user_id: string;
  message: string;
  status: string;
  applied_at: string;
}

interface UserVo {
  id: string;
  username?: string;
  name?: string;
  phone?: string;
}

interface PostWithApplications {
  post: SubstitutePostVO;
  apps: SubstituteApplicationVO[];
}

const normalizeStatus = (status?: string) => (status || "").toLowerCase();

const isOpenPost = (status?: string) => {
  const s = normalizeStatus(status);
  return s === "open" || s === "pending";
};

const isPendingApplication = (status?: string) => {
  const s = normalizeStatus(status);
  return s === "pending";
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace("T", " ").slice(0, 16);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractRequestDate = (reason?: string) => {
  const match = (reason || "").match(/\[(\d{4}-\d{2}-\d{2})\]/);
  return match?.[1] ?? "-";
};

const translateReason = (reason: string, localT: any) => {
  if (!reason) return localT.noReasonText;
  
  // Match format: [2026-07-06] 인원 1명 필요
  const match = reason.match(/^\[(\d{4}-\d{2}-\d{2})\]\s*(?:인원|인원수)?\s*(\d+)명\s*(?:필요)?$/);
  if (match) {
    const date = match[1];
    const count = parseInt(match[2], 10);
    return localT.reasonText(date, count);
  }
  
  // If it doesn't match the exact pattern, check if it starts with date
  const matchDate = reason.match(/^\[(\d{4}-\d{2}-\d{2})\]\s*(.*)$/);
  if (matchDate) {
    const date = matchDate[1];
    const rest = matchDate[2];
    const matchCount = rest.match(/(\d+)명/);
    if (matchCount) {
      const count = parseInt(matchCount[1], 10);
      return localT.reasonText(date, count);
    }
  }

  return reason;
};

export default function SubstituteApplicationsPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const language = useLanguage();
  const localT = previewTranslations[language] || previewTranslations.ko;

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const currentBranch = sessionStorage.getItem('store_name') || localT.selectBranch;
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || "";
  const storeName = sessionStorage.getItem("store_name") || localT.selectedBranch;

  const [posts, setPosts] = useState<PostWithApplications[]>([]);
  const [users, setUsers] = useState<Record<string, UserVo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const mainBg = isDark ? "#0f0f0f" : "rgba(255,255,255,0.97)";
  const cardBg = isDark ? "#141414" : "rgba(230,245,200,0.38)";
  const rowBg = isDark ? "#111" : "#fff";
  const textColor = isDark ? "#fff" : "#111";
  const subTextColor = isDark ? "#b8b8b8" : "#5b705d";
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;

  const menuItems = useMemo(() => [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ], [selectedBranchId, language]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, [currentUser?.id]);

  const stats = useMemo(() => {
    const pendingApps = posts.flatMap((row) => row.apps);
    const uniqueApplicants = new Set(pendingApps.map((app) => app.applicant_user_id));
    return {
      applications: pendingApps.length,
      posts: posts.length,
      applicants: uniqueApplicants.size,
    };
  }, [posts]);

  const fetchApplications = async () => {
    if (!selectedBranchId) {
      setError(localT.errorNoBranch);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [postsRes, usersRes] = await Promise.all([
        axiosInstance.get("/substitute", { params: { store_id: selectedBranchId } }),
        axiosInstance.get("/users", { params: { store_id: selectedBranchId } }).catch(() => ({ data: [] })),
      ]);

      const userMap: Record<string, UserVo> = {};
      (Array.isArray(usersRes.data) ? usersRes.data : []).forEach((user: UserVo) => {
        userMap[user.id] = user;
      });
      setUsers(userMap);

      const posts = (Array.isArray(postsRes.data) ? postsRes.data : []).filter((post: SubstitutePostVO) =>
        isOpenPost(post.status),
      );

      const appResults = await Promise.allSettled(
        posts.map((post: SubstitutePostVO) =>
          axiosInstance
            .get("/substitute/manager", { params: { post_id: post.id } })
            .then((res) => ({
              post,
              apps: Array.isArray(res.data) ? res.data : [],
            })),
        ),
      );

      const nextPosts: PostWithApplications[] = [];
      appResults.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const pendingApps = result.value.apps.filter((app: SubstituteApplicationVO) =>
          isPendingApplication(app.status),
        );
        nextPosts.push({
          post: result.value.post,
          apps: pendingApps,
        });
      });

      nextPosts.sort((a, b) => {
        const left = new Date(b.post.created_at).getTime();
        const right = new Date(a.post.created_at).getTime();
        return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right);
      });

      setPosts(nextPosts);
    } catch (err) {
      console.error("[SubstituteApplicationsPreview] load failed", err);
      setError(localT.errorFetchFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedBranchId]);

  return (
    <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
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

        {/* 메인 콘텐츠 */}
        <section
          style={{
            flex: 1,
            minWidth: 0,
            background: mainBg,
            borderRadius: 24,
            padding: 28,
            boxShadow: "0px 8px 40px rgba(0,0,0,0.18)",
            minHeight: "calc(100vh - 120px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? "#6b9e6b" : "#8BA68D", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                {storeName} <ChevronRight size={12} /> {localT.breadcrumbSubRecruitment}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
                <UserCheck size={28} />
                {localT.pageTitle}
              </h1>
              <p style={{ fontSize: 13, color: isDark ? "#6b9e6b" : "#8BA68D", margin: 0 }}>
                {localT.pageSubtitle}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={fetchApplications}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid ${BORDER_GREEN}`,
                  borderRadius: 999,
                  background: "transparent",
                  color: DARK_GREEN,
                  padding: "10px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={15} />
                {localT.refresh}
              </button>
              <button
                type="button"
                onClick={() => navigate(selectedBranchId ? `/admin/substitute-contact/${selectedBranchId}` : "/admin/branch-selection")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  background: GREEN,
                  color: "#fff",
                  padding: "10px 18px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {localT.staffContactScreen}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 22 }}>
            {[
              { label: localT.labelPosts, value: stats.posts, icon: <CalendarDays size={24} color={GREEN} /> },
              { label: localT.labelPendingApps, value: stats.applications, icon: <MessageSquare size={24} color={GREEN} /> },
              { label: localT.labelApplicants, value: stats.applicants, icon: <Users size={24} color={GREEN} /> },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: cardBg,
                  border: `1px solid ${BORDER_GREEN}`,
                  borderRadius: 20,
                  padding: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 6px", color: subTextColor, fontSize: 13, fontWeight: 700 }}>{item.label}</p>
                  <strong style={{ color: textColor, fontSize: 32, lineHeight: 1 }}>{item.value}</strong>
                </div>
                {item.icon}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b91c1c", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 16, padding: 16, marginBottom: 18 }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: subTextColor, fontWeight: 800 }}>{localT.loadingText}</div>
          ) : posts.length === 0 ? (
            <div
              style={{
                minHeight: 260,
                border: `1px dashed ${BORDER_GREEN}`,
                borderRadius: 22,
                background: cardBg,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: subTextColor,
              }}
            >
              <div>
                <CheckCircle2 size={44} color={GREEN} style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, color: textColor, fontSize: 20, fontWeight: 900 }}>{localT.noActivePostsTitle}</p>
                <p style={{ margin: "8px 0 0", fontSize: 14 }}>{localT.noActivePostsDesc}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map(({ post, apps }) => {
                const previewApps = apps.slice(0, 3);
                return (
                  <article
                    key={post.id}
                    onClick={() =>
                      navigate(
                        selectedBranchId ? `/admin/substitute-contact/${selectedBranchId}?postId=${post.id}` : "/admin/branch-selection",
                        { state: { post } },
                      )
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(240px, 1.1fr) minmax(320px, 1.6fr) 190px",
                      gap: 16,
                      alignItems: "center",
                      background: rowBg,
                      border: `1px solid ${isDark ? "#263426" : "#d7ecc1"}`,
                      borderRadius: 18,
                      padding: 18,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`,
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {localT.avatarLetter}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, color: textColor, fontSize: 18, fontWeight: 900 }}>
                          {extractRequestDate(post.reason)}
                        </h3>
                        <p style={{ margin: "4px 0 0", color: subTextColor, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {localT.requesterPrefix}{users[post.requester_user_id]?.name || localT.adminFallback} ({users[post.requester_user_id]?.username || "admin"})
                        </p>
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: LIGHT_GREEN, color: DARK_GREEN, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>
                          <Clock size={13} />
                          {localT.createdAtText(formatDateTime(post.created_at))}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(24,160,34,0.1)", color: DARK_GREEN, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>
                          <MessageSquare size={13} />
                          {localT.pendingAppsCount(apps.length)}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: textColor, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {translateReason(post.reason, localT)}
                      </p>
                      <p style={{ margin: "6px 0 0", color: subTextColor, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {previewApps.length > 0
                          ? previewApps
                              .map((app) => {
                                const applicant = users[app.applicant_user_id];
                                return applicant?.name || applicant?.username || localT.employeeFallback;
                              })
                              .join(", ") + (apps.length > previewApps.length ? localT.otherCountText(apps.length - previewApps.length) : "")
                          : localT.noApplicantsText}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(
                            selectedBranchId ? `/admin/substitute-contact/${selectedBranchId}?postId=${post.id}` : "/admin/branch-selection",
                            { state: { post } },
                          );
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          border: "none",
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`,
                          color: "#fff",
                          padding: "11px 0",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        <UserCheck size={15} />
                        {localT.chooseContactTarget}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

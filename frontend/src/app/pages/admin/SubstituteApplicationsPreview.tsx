import axiosInstance from "../../../lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import AdminHeader from "./AdminHeader";

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

export default function SubstituteApplicationsPreview() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || "";
  const storeName = sessionStorage.getItem("store_name") || "선택 지점";

  const [posts, setPosts] = useState<PostWithApplications[]>([]);
  const [users, setUsers] = useState<Record<string, UserVo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageBg = isDark
    ? "linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)"
    : "linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)";
  const panelBg = isDark ? "rgba(20,20,20,0.97)" : "rgba(255,255,255,0.97)";
  const cardBg = isDark ? "#181818" : "rgba(230,245,200,0.38)";
  const rowBg = isDark ? "#111" : "#fff";
  const textColor = isDark ? "#fff" : "#111";
  const subTextColor = isDark ? "#b8b8b8" : "#5b705d";

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
      setError("지점 정보가 없습니다. 관리자 대시보드에서 지점을 먼저 선택해주세요.");
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
      setError("대타 신청 목록을 불러오지 못했습니다.");
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
      <main style={{ padding: "28px 40px 48px" }}>
        <section
          style={{
            background: panelBg,
            borderRadius: 24,
            padding: 28,
            boxShadow: "0px 8px 40px rgba(0,0,0,0.18)",
            minHeight: "calc(100vh - 128px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: subTextColor, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                <Store size={15} color={GREEN} />
                {storeName}
                <span style={{ color: BORDER_GREEN }}>/</span>
                대타 모집글 목록
              </div>
              <h1 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: isDark ? GREEN : DARK_GREEN, fontSize: 30, fontWeight: 900 }}>
                <UserCheck size={28} />
                대타 모집 현황
              </h1>
              <p style={{ margin: "8px 0 0", color: subTextColor, fontSize: 14 }}>
                모집글을 먼저 확인하고, 필요한 글을 선택해서 기존 직원 연락 화면으로 이동합니다.
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
                새로고침
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
                직원 연락 화면
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 22 }}>
            {[
              { label: "모집글", value: stats.posts, icon: <CalendarDays size={24} color={GREEN} /> },
              { label: "대기 신청", value: stats.applications, icon: <MessageSquare size={24} color={GREEN} /> },
              { label: "지원 직원", value: stats.applicants, icon: <Users size={24} color={GREEN} /> },
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
            <div style={{ padding: "80px 0", textAlign: "center", color: subTextColor, fontWeight: 800 }}>대타 모집글을 불러오는 중입니다.</div>
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
                <p style={{ margin: 0, color: textColor, fontSize: 20, fontWeight: 900 }}>현재 모집 중인 대타 글이 없습니다.</p>
                <p style={{ margin: "8px 0 0", fontSize: 14 }}>대타 모집글이 생성되면 이 영역에 먼저 표시됩니다.</p>
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
                        대
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, color: textColor, fontSize: 18, fontWeight: 900 }}>
                          {extractRequestDate(post.reason)}
                        </h3>
                        <p style={{ margin: "4px 0 0", color: subTextColor, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          요청자: {users[post.requester_user_id]?.name || "관리자"} ({users[post.requester_user_id]?.username || "admin"})
                        </p>
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: LIGHT_GREEN, color: DARK_GREEN, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>
                          <Clock size={13} />
                          생성 {formatDateTime(post.created_at)}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(24,160,34,0.1)", color: DARK_GREEN, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>
                          <MessageSquare size={13} />
                          대기 신청 {apps.length}건
                        </span>
                      </div>
                      <p style={{ margin: 0, color: textColor, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.reason || "대타 요청"}
                      </p>
                      <p style={{ margin: "6px 0 0", color: subTextColor, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {previewApps.length > 0
                          ? previewApps
                              .map((app) => {
                                const applicant = users[app.applicant_user_id];
                                return applicant?.name || applicant?.username || "직원";
                              })
                              .join(", ") + (apps.length > previewApps.length ? ` 외 ${apps.length - previewApps.length}명` : "")
                          : "아직 지원자가 없습니다. 클릭하면 직원 연락 화면으로 이동합니다."}
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
                        연락 대상 선택
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { CSSProperties, useEffect, useState } from "react";
import { CheckCircle, LogOut, RefreshCw, ShieldCheck, Store, XCircle } from "lucide-react";
import {
  AdminApplication,
  approveAdminApplicationAPI,
  getAdminApplicationsAPI,
  rejectAdminApplicationAPI,
} from "../../components/api/adminApplications";

const GREEN = "#00A200";

export default function MasterApplications() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const master = JSON.parse(sessionStorage.getItem("user") || "{}");

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminApplicationsAPI("PENDING");
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("관리자 가입 신청을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (application: AdminApplication) => {
    if (!confirm(`${application.store_name} 관리자 가입 신청을 승인하시겠습니까?`)) return;
    await approveAdminApplicationAPI(application.id, master.id);
    await loadApplications();
  };

  const handleReject = async (application: AdminApplication) => {
    const reason = prompt("거절 사유를 입력하세요.", "증빙 정보 확인이 필요합니다.");
    if (reason === null) return;
    await rejectAdminApplicationAPI(application.id, reason, master.id);
    await loadApplications();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    location.href = "/auth/login";
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F7FAFC", padding: 32 }}>
      <section style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: GREEN, fontWeight: 900 }}>
              <ShieldCheck size={22} />
              MASTER
            </div>
            <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "#0F172A" }}>
              관리자 가입 신청
            </h1>
            <p style={{ margin: "8px 0 0", color: "#64748B", fontWeight: 600 }}>
              점주/관리자 신청을 검토하고 승인하면 매장이 자동 생성됩니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={loadApplications}
              style={buttonStyle("#FFFFFF", "#0F172A", "#DDE9F6")}
            >
              <RefreshCw size={16} />
              새로고침
            </button>
            <button onClick={handleLogout} style={buttonStyle("#FFF1F2", "#E11D48", "#FFE4E6")}>
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </header>

        {error && <p style={{ color: "#E11D48", fontWeight: 700 }}>{error}</p>}

        <div style={{ display: "grid", gap: 14 }}>
          {loading ? (
            <div style={emptyStyle}>불러오는 중...</div>
          ) : applications.length === 0 ? (
            <div style={emptyStyle}>대기 중인 관리자 가입 신청이 없습니다.</div>
          ) : (
            applications.map((application) => (
              <article key={application.id} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={iconBoxStyle}>
                    <Store size={22} color={GREEN} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>
                      {application.store_name}
                    </h2>
                    <p style={{ margin: "6px 0 0", color: "#64748B", fontWeight: 600 }}>
                      {application.store_address || "주소 미입력"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      <span style={pillStyle}>신청자: {application.user_name || application.username}</span>
                      <span style={pillStyle}>전화: {application.phone || "-"}</span>
                      <span style={pillStyle}>업종: {application.store_type || "OTHER"}</span>
                      <span style={pillStyle}>사업자번호: {application.business_number || "-"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApprove(application)} style={buttonStyle(GREEN, "#FFFFFF", GREEN)}>
                      <CheckCircle size={16} />
                      승인
                    </button>
                    <button onClick={() => handleReject(application)} style={buttonStyle("#FFFFFF", "#E11D48", "#FDA4AF")}>
                      <XCircle size={16} />
                      거절
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

const buttonStyle = (background: string, color: string, borderColor: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  border: `1px solid ${borderColor}`,
  background,
  color,
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
});

const cardStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
};

const emptyStyle: CSSProperties = {
  ...cardStyle,
  color: "#64748B",
  fontWeight: 800,
  textAlign: "center",
  padding: 36,
};

const iconBoxStyle: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ECFDF5",
  border: "1px solid #BDEFE0",
};

const pillStyle: CSSProperties = {
  borderRadius: 999,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  color: "#475569",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
};

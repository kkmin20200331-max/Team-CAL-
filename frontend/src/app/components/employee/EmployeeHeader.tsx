import EmployeeProfilePanel from "./EmployeeProfilePanel";

interface Props {
  children?: React.ReactNode;
}

export default function EmployeeHeader({ children }: Props) {
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const storeName = sessionStorage.getItem("store_name") || "";

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
      {/* 공통 상단 바: 매장명 | 이름 + 역할 + 프로필 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-blue-100 font-medium">{storeName}</span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold leading-tight">
              {currentUser?.name || "직원"}
            </p>
            <p className="text-sm text-blue-100">
              {currentUser?.role || "STAFF"}
            </p>
          </div>
          <EmployeeProfilePanel />
        </div>
      </div>

      {/* 페이지별 추가 콘텐츠 (타이틀, 통계 등) */}
      {children}
    </div>
  );
}

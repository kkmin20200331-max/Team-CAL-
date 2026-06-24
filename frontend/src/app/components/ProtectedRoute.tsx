import { Navigate, useLocation } from "react-router-dom";
import { isLogin, getLoginUser } from "./api/auth";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();

  // 로그인 안 됨
  if (!isLogin()) {
    return <Navigate to="/auth/login" replace />;
  }

  const user = getLoginUser();

  // 마스터 페이지 접근
  if (location.pathname.startsWith("/master") && user?.role !== "MASTER") {
    return <Navigate to="/auth/login" replace />;
  }

  if (!location.pathname.startsWith("/master") && user?.role === "MASTER") {
    return <Navigate to="/master/applications" replace />;
  }

  // 직원이 관리자 페이지 접근
  if (location.pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return <Navigate to="/employee/home" replace />;
  }

  // 관리자가 직원 페이지 접근
  if (location.pathname.startsWith("/employee") && (user?.role === "ADMIN" || user?.role === "MASTER")) {
    return <Navigate to="/admin/branch-selection" replace />;
  }

  return <>{children}</>;
}

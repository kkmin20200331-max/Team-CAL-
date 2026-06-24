import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import axiosInstance from "../lib/axiosInstance";

// Auth pages
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/Signup";

// LoginCheck and AdminCheck
import ProtectedRoute from "./components/ProtectedRoute";

// Admin pages
import BranchSelection from "./pages/admin/BranchSelection";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WeeklySchedule from "./pages/admin/WeeklySchedule";
import DailySchedule from "./pages/admin/DailySchedule";
import SubstituteManagement from "./pages/admin/SubstituteManagement";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import PayrollManagement from "./pages/admin/PayrollManagement";
import DocumentManagement from "./pages/admin/DocumentManagement";
import BoardManagement from "./pages/admin/BoardManagement";
import CustomerAnalytics from "./pages/admin/CustomerAnalytics";
import MultibranchDashboard from "./pages/admin/MultibranchDashboard";
import MonthlySchedule from "./pages/admin/MonthlySchedule";
import CctvAnalysis from "./pages/admin/CctvAnalysis";
import MasterApplications from "./pages/master/MasterApplications";

// Employee pages
import EmployeeHome from "./pages/employee/EmployeeHome";
import MySchedule from "./pages/employee/MySchedule";
import QRCheckIn from "./pages/employee/QRCheckIn";
import LeaveRequest from "./pages/employee/LeaveRequest";
import SubstituteList from "./pages/employee/SubstituteList";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import EmployeeBoard from "./pages/employee/EmployeeBoard";
import EditProfile from "./pages/employee/EditProfile";
import LineError from "./pages/auth/LineError";

export default function App() {
  const [apiMessage, setApiMessage] = useState(
    "Spring Boot \uC5F0\uACB0 \uD655\uC778 \uC911...",
  );

  useEffect(() => {
    axiosInstance
      .get("/hello")
      .then((res) => {
        setApiMessage(res.data.message);
      })
      .catch(() => {
        setApiMessage("Spring Boot 연결 실패");
      });
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableColorScheme={false}
    >
      <Router>
        <div className="border-b bg-white px-4 py-2 text-sm font-medium text-slate-700">
          {"API \uC0C1\uD0DC"}: {apiMessage}
        </div>
        <Routes>
          {/*{Auth routes}*/}
          {/* 첫 화면(/)으로 접속 시 새로 만든 통합 로그인 화면으로 자동 리다이렉트 */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          {/* /auth 로 들어와도 자동으로 /auth/login 으로 안전하게 이동 */}
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/line/error" element={<LineError />} />
          <Route
            path="/master/applications"
            element={
              <ProtectedRoute>
                <MasterApplications />
              </ProtectedRoute>
            }
          />
          {/* Admin routes */}
          <Route
            path="/admin/branch-selection"
            element={
              <ProtectedRoute>
                <BranchSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard/:branchId"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/multibranch"
            element={
              <ProtectedRoute>
                <MultibranchDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/schedule/monthly/:branchId"
            element={
              <ProtectedRoute>
                <MonthlySchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/schedule/weekly/:branchId"
            element={
              <ProtectedRoute>
                <WeeklySchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/schedule/daily/:branchId/:date"
            element={
              <ProtectedRoute>
                <DailySchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/substitute/:branchId"
            element={
              <ProtectedRoute>
                <SubstituteManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees/:branchId"
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/payroll/:branchId"
            element={
              <ProtectedRoute>
                <PayrollManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/documents/:branchId"
            element={
              <ProtectedRoute>
                <DocumentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/board/:branchId"
            element={
              <ProtectedRoute>
                <BoardManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics/:branchId"
            element={
              <ProtectedRoute>
                <CustomerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Navigate
                  to={
                    sessionStorage.getItem("store_id")
                      ? `/admin/analytics/${sessionStorage.getItem("store_id")}`
                      : "/admin/branch-selection"
                  }
                  replace
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/cctv/:branchId"
            element={
              <ProtectedRoute>
                <CctvAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cctv"
            element={
              <ProtectedRoute>
                <Navigate
                  to={
                    sessionStorage.getItem("store_id")
                      ? `/admin/cctv/${sessionStorage.getItem("store_id")}`
                      : "/admin/branch-selection"
                  }
                  replace
                />
              </ProtectedRoute>
            }
          />
          {/* Employee routes */}
          <Route
            path="/employee/home"
            element={
              <ProtectedRoute>
                <EmployeeHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/schedule"
            element={
              <ProtectedRoute>
                <MySchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/checkin"
            element={
              <ProtectedRoute>
                <QRCheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/leave"
            element={
              <ProtectedRoute>
                <LeaveRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/substitute"
            element={
              <ProtectedRoute>
                <SubstituteList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/payroll"
            element={
              <ProtectedRoute>
                <EmployeePayroll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/board"
            element={
              <ProtectedRoute>
                <EmployeeBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

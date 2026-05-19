import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import BranchSelection from './pages/admin/BranchSelection';
import AdminDashboard from './pages/admin/AdminDashboard';
import WeeklySchedule from './pages/admin/WeeklySchedule';
import DailySchedule from './pages/admin/DailySchedule';
import SubstituteManagement from './pages/admin/SubstituteManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import PayrollManagement from './pages/admin/PayrollManagement';
import DocumentManagement from './pages/admin/DocumentManagement';
import BoardManagement from './pages/admin/BoardManagement';
import CustomerAnalytics from './pages/admin/CustomerAnalytics';
import MultibranchDashboard from './pages/admin/MultibranchDashboard';

// Employee pages
import EmployeeLogin from './pages/employee/EmployeeLogin';
import EmployeeHome from './pages/employee/EmployeeHome';
import MySchedule from './pages/employee/MySchedule';
import QRCheckIn from './pages/employee/QRCheckIn';
import LeaveRequest from './pages/employee/LeaveRequest';
import SubstituteList from './pages/employee/SubstituteList';
import EmployeePayroll from './pages/employee/EmployeePayroll';
import EmployeeBoard from './pages/employee/EmployeeBoard';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/branch-selection" element={<BranchSelection />} />
          <Route path="/admin/dashboard/:branchId" element={<AdminDashboard />} />
          <Route path="/admin/multibranch" element={<MultibranchDashboard />} />
          <Route path="/admin/schedule/weekly/:branchId" element={<WeeklySchedule />} />
          <Route path="/admin/schedule/daily/:branchId/:date" element={<DailySchedule />} />
          <Route path="/admin/substitute/:branchId" element={<SubstituteManagement />} />
          <Route path="/admin/employees/:branchId" element={<EmployeeManagement />} />
          <Route path="/admin/payroll/:branchId" element={<PayrollManagement />} />
          <Route path="/admin/documents/:branchId" element={<DocumentManagement />} />
          <Route path="/admin/board/:branchId" element={<BoardManagement />} />
          <Route path="/admin/analytics/:branchId" element={<CustomerAnalytics />} />

          {/* Employee routes */}
          <Route path="/employee" element={<EmployeeLogin />} />
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/schedule" element={<MySchedule />} />
          <Route path="/employee/checkin" element={<QRCheckIn />} />
          <Route path="/employee/leave" element={<LeaveRequest />} />
          <Route path="/employee/substitute" element={<SubstituteList />} />
          <Route path="/employee/payroll" element={<EmployeePayroll />} />
          <Route path="/employee/board" element={<EmployeeBoard />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

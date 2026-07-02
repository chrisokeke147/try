import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { LiveTripsPage } from './pages/LiveTripsPage';
import { DriverApprovalsPage } from './pages/DriverApprovalsPage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { FraudFlagsPage } from './pages/FraudFlagsPage';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import './App.css';

function ProtectedShell() {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<LiveTripsPage />} />
          <Route path="/drivers" element={<DriverApprovalsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/fraud-flags" element={<FraudFlagsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { token } = useAdminAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedShell />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;

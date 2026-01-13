import { Routes, Route } from 'react-router-dom';
import { Dashboard, NotFound, ScrollToTop, Toaster } from '@repo/ui'
import { useAxiosInterceptor } from './hooks/useAxiosInterceptor';
import { useEffect, useRef } from 'react';
import { useAdminAuthStore } from './stores/useAdminAuthStore';
import ProtectedRoute from './RouteRapper';
import { Logout } from './components/Logout';
import { UserNavBar } from './components/useNavbar';
import LoginPage from './components/LoginPage';
import { Users } from './components/Users';
import { Payments } from './components/Payments';
import { Pins } from './components/Pins';
import { Settings } from './components/Settings';
import { AdminDashboard } from './components/AdminDashboard';

function AppContent() {
  useAxiosInterceptor();
  const ran = useRef(false)

  const fetchUser = useAdminAuthStore((state) => state.fetchUser);

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route path='/' element={
          <Dashboard />
      } />
      <Route path='/dashboard' element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      } />
      <Route path="/pin" element={
        <ProtectedRoute>
          <Pins />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/login" element={
        <LoginPage />
      } />
      <Route path="/logout" element={
        <Logout />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <UserNavBar />
      <Toaster position='top-center' />
      <AppContent />
      <ScrollToTop />
    </>
  );
}

export default App;

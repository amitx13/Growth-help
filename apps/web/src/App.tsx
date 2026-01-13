import { Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard, NotFound, ScrollToTop, Toaster } from '@repo/ui'
import { useAxiosInterceptor } from './hooks/useAxiosInterceptor';
import { useEffect, useRef } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import ProtectedRoute from './RouteRapper';
import LoginPage from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { UserNavBar } from './components/UserNavBar';
import { UserDashboard } from './components/UserDashboard';
import TeamPage from './components/Community';
import UserProfile from './components/Profile';
import { Wallet } from './components/Wallet';
import { Logout } from './components/Logout';
import { NotificationCenter } from './components/Notification';
import { PinManagement } from './components/Pin';
import { AnimatedPageWrapper } from './components/AnimatedPageWrapper';
import { AddUserPage } from './pages/AddUserPage';

function AppContent() {
  const location = useLocation();
  const ran = useRef(false);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const skipLogoutPages = ["/login", "/signup"];
  useAxiosInterceptor({ skipLogoutOn401: skipLogoutPages.includes(location.pathname) });

  useEffect(() => {
    if (ran.current) return;

    if (skipLogoutPages.includes(location.pathname)) return;

    ran.current = true;
    fetchUser();
  }, [fetchUser, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signUp" element={<SignUpPage />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AnimatedPageWrapper>
            <UserDashboard />
          </AnimatedPageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <AnimatedPageWrapper>
            <NotificationCenter />
          </AnimatedPageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/community" element={
        <ProtectedRoute>
          <AnimatedPageWrapper>
            <TeamPage />
          </AnimatedPageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <AnimatedPageWrapper>
            <Wallet />
          </AnimatedPageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/pin" element={
        <ProtectedRoute>
          <AnimatedPageWrapper>
            <PinManagement />
          </AnimatedPageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/add_new_user" element={
        <ProtectedRoute>
          <AddUserPage />
        </ProtectedRoute>
      } />
      <Route path="/logout" element={<Logout />} />
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

import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../stores/useAuthStore';
import { Login } from '@repo/ui';
import { toast } from "sonner"
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId');
  const password = searchParams.get('password');

  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (userId && password) {
      handleOnLogin({ userId, password });
      // console.log(userId, password);
      console.log('url', window.location.href);
    }
  }, [userId, password]);

  const handleOnLogin = async (user: { userId: string; password: string }) => {
    if (!user.userId || !user.password) {
      toast.warning(
        <div className='text-destructive'>Please enter both user ID and password.</div>
      );
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/sign-in', user)
      if (res.data.success) {
        await fetchUser()
        toast.success(
          <div className='text-primary'>{res.data.message}</div>
        )
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message =
        (error && typeof error === 'object' && 'response' in error && error.response?.data?.message) ||
        error?.message ||
        'An unexpected error occurred.';
      toast.error(
        <div className='text-destructive'>{message}</div>
      );
    } finally {
      setLoading(false);
    }
  }

  const handleNavigateToSignup = () => {
    navigate('/signup');
  };

  return (
    <Login
      loading={loading}
      onLogin={handleOnLogin}
      onNavigateToSignup={handleNavigateToSignup}
    />
  );
}
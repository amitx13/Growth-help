import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";

interface UseAxiosInterceptorOptions {
  skipLogoutOn401?: boolean; // default false
}

export const useAxiosInterceptor = (options?: UseAxiosInterceptorOptions) => {
  const { skipLogoutOn401 = false } = options || {};
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;

        if (status === 401) {
          if (!skipLogoutOn401) {
            try {
              await logout();
            } catch (_) {
            }
          }

          if (!["/login", "/signup"].includes(window.location.pathname)) {
            navigate("/login");
          }
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [navigate, logout, skipLogoutOn401]);
};

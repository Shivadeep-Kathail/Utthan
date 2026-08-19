import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as authApi from '@/api/auth.api';

const AuthContext = createContext(null);

/**
 * Provides auth state + actions to the entire app.
 *
 * Hydration: on mount, calls GET /users/me.
 *  - 401 → not logged in (expected, no redirect, no toast).
 *  - Other error → still set user=null, but toast the error.
 *  - Success → set user from response.
 *
 * Login/signup/resetPassword responses contain { token, data: { user } }.
 * We extract data.user ONLY — the token field is never stored, logged,
 * or assigned. The httpOnly cookie is the sole auth mechanism.
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Hydrate from cookie on mount
  useEffect(() => {
    let cancelled = false;

    authApi
      .getMe()
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch((err) => {
        // 401 = not logged in — expected, don't toast
        if (!err.isUnauthorized) {
          toast.error(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loginAction = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signupAction = useCallback(async (data) => {
    const res = await authApi.signup(data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logoutAction = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const refetch = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login: loginAction,
      signup: signupAction,
      logout: logoutAction,
      refetch,
      setUser,
    }),
    [user, isLoading, loginAction, signupAction, logoutAction, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context. Must be used within <AuthProvider>.
 */
function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export { AuthProvider, useAuth };

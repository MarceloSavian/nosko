import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type AuthContextValue = {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (accessToken: string) => void;
  logout: () => void;
};

const TOKEN_KEY = 'nosko_access_token';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const login = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: accessToken !== null,
      accessToken,
      login,
      logout,
    }),
    [accessToken, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

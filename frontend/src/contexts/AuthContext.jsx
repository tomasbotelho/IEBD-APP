import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

export const AuthContext = createContext(null);

const STORAGE_USER = "appiebd_user";
const STORAGE_TOKEN = "appiebd_access_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_TOKEN, token);
    else localStorage.removeItem(STORAGE_TOKEN);
  }, [token]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setIsHydrating(false);
      return () => { active = false; };
    }

    authService
      .session()
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setToken(session.accessToken);
      })
      .catch((error) => {
        if (!active) return;
        // 401 means the server explicitly rejected the token — clear the session.
        // For network/server errors, preserve existing state so users aren't logged out during outages.
        if (error?.response?.status === 401) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (active) setIsHydrating(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isHydrating,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login: async (values) => {
        const session = await authService.login(values);
        setUser(session.user);
        setToken(session.accessToken);
        return session;
      },
      register: async (values) => {
        const session = await authService.register(values);
        setUser(session.user);
        setToken(session.accessToken);
        return session;
      },
      completeOAuth: async () => {
        const session = await authService.session();
        setUser(session.user);
        setToken(session.accessToken);
        return session;
      },
      logout: async () => {
        await authService.logout().catch(() => {});
        setUser(null);
        setToken(null);
      }
    }),
    [isHydrating, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

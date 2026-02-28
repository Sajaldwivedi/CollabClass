import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, tokenStorage } from "../api/axios";

type Role = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  section?: string;
  isUniversityUser?: boolean;
  regNo?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    section?: string;
  }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateSection: (section: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface BackendAuthResponse {
  _id: string;
  name: string;
  email: string;
  role: Role;
  section?: string;
  token: string;
  isUniversityUser?: boolean;
  regNo?: string | null;
}

const USER_STORAGE_KEY = "collabclass-user";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingToken = tokenStorage.get();
    const storedUserRaw = window.localStorage.getItem(USER_STORAGE_KEY);

    if (existingToken && storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw) as AuthUser;
        setUser(parsed);
        setToken(existingToken);
      } catch {
        tokenStorage.clear();
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    setLoading(false);
  }, []);

  const persistAuth = useCallback((authUser: AuthUser, jwt: string) => {
    tokenStorage.set(jwt);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setToken(jwt);
    setUser(authUser);
  }, []);

  const mapBackendToAuthUser = useCallback(
    (data: BackendAuthResponse): AuthUser => ({
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      section: data.section,
      isUniversityUser: data.isUniversityUser,
      regNo: data.regNo
    }),
    []
  );

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const res = await api.post<BackendAuthResponse>("/auth/login", payload);
      const mapped = mapBackendToAuthUser(res.data);
      persistAuth(mapped, res.data.token);
    },
    [mapBackendToAuthUser, persistAuth]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      role: Role;
      section?: string;
    }) => {
      const res = await api.post<BackendAuthResponse>("/auth/register", payload);
      const mapped = mapBackendToAuthUser(res.data);
      persistAuth(mapped, res.data.token);
    },
    [mapBackendToAuthUser, persistAuth]
  );

  const loginWithGoogle = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
      | string
      | undefined;

    if (!clientId) {
      // eslint-disable-next-line no-alert
      alert("Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).google?.accounts?.id) {
          resolve();
          return;
        }
        const existing = document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () =>
            reject(new Error("Failed to load Google script"))
          );
          return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Google script"));
        document.body.appendChild(script);
      });

    await loadScript();

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      // eslint-disable-next-line no-alert
      alert("Google sign-in is unavailable in this browser.");
      return;
    }

    let inFlight = false;

    await new Promise<void>((resolve) => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (inFlight) {
            resolve();
            return;
          }
          inFlight = true;
          try {
            const res = await api.post<BackendAuthResponse>("/auth/google", {
              token: response.credential
            });
            const mapped = mapBackendToAuthUser(res.data);
            persistAuth(mapped, res.data.token);
          } finally {
            resolve();
          }
        }
      });
      google.accounts.id.prompt();
    });
  }, [mapBackendToAuthUser, persistAuth]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const updateSection = useCallback(
    async (section: string) => {
      const res = await api.patch<Omit<BackendAuthResponse, "token">>("/auth/section", { section });
      const updatedUser: AuthUser = {
        id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        section: res.data.section,
        isUniversityUser: res.data.isUniversityUser,
        regNo: res.data.regNo,
      };
      setUser(updatedUser);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    },
    []
  );

  const value = useMemo(
    () => ({ user, token, loading, login, register, loginWithGoogle, logout, updateSection }),
    [user, token, loading, login, register, loginWithGoogle, logout, updateSection]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};


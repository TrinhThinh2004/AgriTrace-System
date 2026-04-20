"use client";
// AuthContext dùng để cung cấp state auth 
import type { Role, User } from "@/lib/mockData";
import { useAuthStore, type BeUser } from "@/stores/auth-store";
import { useLogin } from "@/hooks/use-login";
import { useRegister } from "@/hooks/use-register";
import { useLogout } from "@/hooks/use-logout";
import { ApiError } from "@/lib/api/client";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

function mapBeUserToUser(u: BeUser | null): User | null {
  if (!u) return null;
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: (u.role?.toLowerCase() as Role) ?? "public",
    avatar: u.avatar_url ?? undefined,
  };
}

export function useAuth(): AuthContextType {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const loginM = useLogin();
  const registerM = useRegister();
  const logoutM = useLogout();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await loginM.mutateAsync({ email, password });
      return true;
    } catch {
      return false;
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      await registerM.mutateAsync({
        email: input.email,
        password: input.password,
        full_name: input.name,
        phone: input.phone,
      });
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Đăng ký thất bại";
      return { ok: false, message };
    }
  };

  const logout = () => {
    logoutM.mutate();
  };

  return {
    user: mapBeUserToUser(user),
    isLoggedIn: !!accessToken && !!user,
    login,
    register,
    logout,
  };
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

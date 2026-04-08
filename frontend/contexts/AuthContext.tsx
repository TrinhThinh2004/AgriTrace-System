"use client";
import { useState, createContext, useContext } from "react";
import type { Role, User } from "@/lib/mockData";
import { mockUsers } from "@/lib/mockData";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  register: (input: RegisterInput) => { ok: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => false,
  register: () => ({ ok: false }),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const login = (email: string, _password: string) => {
    const found = users.find(u => u.email === email);
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const register = ({ name, email, role }: RegisterInput) => {
    if (users.some(u => u.email === email)) {
      return { ok: false, message: "Email đã được sử dụng" };
    }
    const newUser: User = { id: `u${users.length + 1}`, name, email, role };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

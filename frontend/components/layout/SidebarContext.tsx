"use client";
import { createContext, useContext, useState } from "react";

interface Ctx {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarCtx = createContext<Ctx>({ collapsed: false, toggle: () => {} });

export const useAppSidebar = () => useContext(SidebarCtx);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarCtx.Provider>
  );
}

"use client";
import { createContext, useContext, useState } from "react";

interface Ctx {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarCtx = createContext<Ctx>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export const useAppSidebar = () => useContext(SidebarCtx);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarCtx.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed((c) => !c),
        mobileOpen,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}

"use client";
import Link from "next/link";
import {
  LayoutDashboard, Leaf, ClipboardCheck, QrCode, Building2, Sprout,
  Users, Shield, Tractor, Package, KeyRound,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSidebar } from "./SidebarContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/mockData";

const menuItems: Record<Role, { title: string; url: string; icon: React.ElementType }[]> = {
  admin: [
    { title: "Trang chủ", url: "/dashboard", icon: LayoutDashboard },
    { title: "Trang trại", url: "/farms", icon: Building2 },
    { title: "Lô hàng", url: "/batches", icon: Package },
    { title: "Giống cây trồng", url: "/crops", icon: Sprout },
    { title: "Người dùng", url: "/users", icon: Users },
    { title: "Tiêu chuẩn", url: "/standards", icon: Shield },
    { title: "Khóa số", url: "/keys", icon: KeyRound },
  ],
  farmer: [
    { title: "Trang chủ", url: "/dashboard", icon: LayoutDashboard },
    { title: "Trang trại", url: "/farms", icon: Building2 },
    { title: "Lô hàng của tôi", url: "/dashboard", icon: Leaf },
    { title: "Khóa số", url: "/settings", icon: KeyRound },
  ],
  inspector: [
    { title: "Kiểm định", url: "/dashboard", icon: ClipboardCheck },
    { title: "Khóa số", url: "/settings", icon: KeyRound },
  ],
  public: [
    { title: "Tra cứu sản phẩm", url: "/trace/AGT-2024-001", icon: QrCode },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const { collapsed } = useAppSidebar();
  const role = user?.role || "admin";
  const items = menuItems[role] || [];

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-200 ease-linear",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border/50">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sprout className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground truncate">AgriTrace</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-xs uppercase tracking-wider text-sidebar-muted">
            Điều hướng
          </p>
        )}
        {items.map(item => (
          <NavLink
            key={item.title + item.url}
            href={item.url}
            end={item.url === "/dashboard"}
            title={collapsed ? item.title : undefined}
            className={cn(
              "flex items-center rounded-md text-sm hover:bg-sidebar-accent",
              collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2 gap-2",
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer — user info only, logout moved to header avatar */}
      <div className="p-3 border-t border-sidebar-border/50">
        {user && (
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-muted capitalize">{user.role}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

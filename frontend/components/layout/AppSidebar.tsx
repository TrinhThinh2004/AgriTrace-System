"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Leaf, ClipboardCheck, QrCode, Building2, Sprout,
  Users, Shield, Tractor, Package, KeyRound,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSidebar } from "./SidebarContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
    { title: "Lô hàng của tôi", url: "/batches", icon: Leaf },
    { title: "Khóa số", url: "/settings", icon: KeyRound },
  ],
  inspector: [
    { title: "Kiểm định", url: "/dashboard", icon: ClipboardCheck },
    { title: "Khóa số", url: "/settings", icon: KeyRound },
  ],
  public: [
    { title: "Tra cứu sản phẩm", url: "/trace/BATCH-RAU-2025-001", icon: QrCode },
  ],
};

function SidebarInner({
  collapsed,
  onItemClick,
}: {
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const { user } = useAuth();
  const role = user?.role || "admin";
  const items = menuItems[role] || [];

  return (
    <>
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border/50 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 min-w-0"
          onClick={onItemClick}
        >
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
        {items.map((item) => (
          <NavLink
            key={item.title + item.url}
            href={item.url}
            end={item.url === "/dashboard"}
            title={collapsed ? item.title : undefined}
            onClick={onItemClick}
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
      <div className="p-3 border-t border-sidebar-border/50 shrink-0">
        {user && (
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
            <Avatar className="h-8 w-8">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              )}
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
    </>
  );
}

export function AppSidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useAppSidebar();
  const pathname = usePathname();

  // Auto-close mobile drawer khi đổi route
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar — inline */}
      <aside
        data-collapsed={collapsed}
        className={cn(
          "hidden md:flex shrink-0 border-r bg-sidebar text-sidebar-foreground flex-col transition-[width] duration-200 ease-linear",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarInner collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar — drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 max-w-[80vw] bg-sidebar text-sidebar-foreground border-r flex flex-col gap-0"
        >
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <SidebarInner collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}

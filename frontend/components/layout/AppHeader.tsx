"use client";
import { useState } from "react";
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, LogOut, UserCog } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSidebar } from "./SidebarContext";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Trang chủ",
  "/farms": "Quản lý trang trại",
  "/crops": "Giống cây trồng",
  "/users": "Quản lý người dùng",
  "/standards": "Tiêu chuẩn",
};

export function AppHeader() {
  const { user, logout } = useAuth();
  const { collapsed, toggle, setMobileOpen } = useAppSidebar();
  const pathname = usePathname() || "";
  const pageName = breadcrumbMap[pathname] || "Trang";
  const isBatchDetail = pathname.startsWith("/batch/");
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile: hamburger mở drawer */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="md:hidden h-8 w-8"
          aria-label="Mở menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        {/* Desktop: collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="hidden md:inline-flex h-8 w-8"
          aria-label={collapsed ? "Mở sidebar" : "Đóng sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          <span className="hidden sm:inline">AgriTrace</span>
          <ChevronRight className="hidden sm:inline h-3 w-3" />
          <span className="text-foreground font-medium truncate">
            {isBatchDetail ? "Chi tiết lô hàng" : pageName}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {user && (
          <Badge variant="outline" className="hidden sm:inline-flex text-xs capitalize border-primary/30 text-primary">
            {user.role}
          </Badge>
        )}
        <NotificationBell />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity hover:opacity-80 cursor-pointer">
                <Avatar className="h-8 w-8">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                Thông tin cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}

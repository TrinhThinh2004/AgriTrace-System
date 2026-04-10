"use client";
import { Bell, ChevronRight, PanelLeftClose, PanelLeftOpen, LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Trang chủ",
  "/farms": "Quản lý trang trại",
  "/crops": "Giống cây trồng",
  "/users": "Quản lý người dùng",
  "/standards": "Tiêu chuẩn",
};

export function AppHeader() {
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useAppSidebar();
  const pathname = usePathname() || "";
  const pageName = breadcrumbMap[pathname] || "Trang";
  const isBatchDetail = pathname.startsWith("/batch/");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8"
          aria-label={collapsed ? "Mở sidebar" : "Đóng sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>AgriTrace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">
            {isBatchDetail ? "Chi tiết lô hàng" : pageName}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <Badge variant="outline" className="text-xs capitalize border-primary/30 text-primary">
            {user.role}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center">3</span>
        </Button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity hover:opacity-80 cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
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
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

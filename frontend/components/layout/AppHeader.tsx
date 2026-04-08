"use client";
import { Bell, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSidebar } from "./SidebarContext";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/farms": "Farms Management",
  "/crops": "Crop Varieties",
  "/users": "User Management",
  "/standards": "Standards",
};

export function AppHeader() {
  const { user } = useAuth();
  const { collapsed, toggle } = useAppSidebar();
  const pathname = usePathname() || "";
  const pageName = breadcrumbMap[pathname] || "Page";
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
            {isBatchDetail ? "Batch Detail" : pageName}
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
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

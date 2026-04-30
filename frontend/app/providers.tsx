"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { NotificationSocketBridge } from "@/components/notifications/NotificationSocketBridge";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AuthBootstrap />
        <NotificationSocketBridge />
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import FarmerDashboard from "./FarmerDashboard";
import InspectorDashboard from "./InspectorDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "public") router.replace("/trace/AGT-2024-001");
  }, [user, router]);

  if (!user) return null;
  switch (user.role) {
    case "admin": return <AdminDashboard />;
    case "farmer": return <FarmerDashboard />;
    case "inspector": return <InspectorDashboard />;
    default: return <AdminDashboard />;
  }
}

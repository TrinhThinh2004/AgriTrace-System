"use client";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Building2, ClipboardCheck, QrCode, Plus, MapPin } from "lucide-react";
import { mockBatches, mockActivities, mockFarms } from "@/lib/mockData";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of AgriTrace operations</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push("/farms")}>
            <Plus className="h-4 w-4 mr-1" /> Add Farm
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push("/crops")}>
            <Plus className="h-4 w-4 mr-1" /> Add Variety
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Batches" value={mockBatches.length} icon={<Package className="h-5 w-5" />} trend="+12% this month" />
        <StatsCard title="Certified Farms" value={mockFarms.filter(f => f.certified).length} icon={<Building2 className="h-5 w-5" />} description={`of ${mockFarms.length} total`} />
        <StatsCard title="Pending Inspections" value={mockBatches.filter(b => b.status === "completed").length} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatsCard title="QR Scans Today" value={142} icon={<QrCode className="h-5 w-5" />} trend="+8% vs yesterday" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivities.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{a.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.user}</TableCell>
                    <TableCell className="text-sm font-mono">{a.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Farms by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Map Visualization</p>
                <p className="text-xs">Coming soon</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {["Lam Dong", "Ninh Thuan", "Buon Ma Thuot", "Can Tho"].map((r, i) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span>{r}</span>
                  <span className="text-muted-foreground">{[2, 1, 1, 1][i]} farms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

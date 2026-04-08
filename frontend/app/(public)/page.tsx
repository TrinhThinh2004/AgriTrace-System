"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Leaf, QrCode, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Truy xuất nguồn gốc",
    description: "Theo dõi hành trình sản phẩm từ giống → canh tác → thu hoạch → đóng gói",
  },
  {
    icon: Shield,
    title: "Chứng nhận tiêu chuẩn",
    description: "Hỗ trợ VietGAP, GlobalGAP và các tiêu chuẩn nông nghiệp quốc tế",
  },
  {
    icon: QrCode,
    title: "QR Code minh bạch",
    description: "Người tiêu dùng quét QR để xem toàn bộ hành trình sản phẩm",
  },
];

const roles = [
  { role: "Admin", desc: "Quản lý toàn hệ thống" },
  { role: "Farmer", desc: "Ghi nhận quy trình sản xuất" },
  { role: "Inspector", desc: "Kiểm tra & chứng nhận" },
  { role: "Public", desc: "Tra cứu sản phẩm" },
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            Hệ thống truy xuất nguồn gốc nông sản
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Minh bạch từ <span className="text-primary">nông trại</span> đến <span className="text-primary">bàn ăn</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            AgriTrace giúp quản lý toàn bộ chuỗi cung ứng nông sản — từ gieo trồng, canh tác, thu hoạch đến đóng gói — đảm bảo an toàn thực phẩm theo tiêu chuẩn VietGAP.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg">
                Bắt đầu ngay <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/trace/AGT-2024-001">
              <Button variant="outline" size="lg">
                <QrCode className="h-4 w-4 mr-1" /> Xem demo tra cứu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Tính năng nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-10">Dành cho mọi vai trò</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {roles.map((r, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <p className="font-semibold text-primary">{r.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

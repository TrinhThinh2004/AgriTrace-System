import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, CheckCircle, Shield, Award, Tractor } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[73vh] flex items-center">
      <div className="absolute inset-0">
        <Image src="/images/hero-farm.jpg" alt="Cánh đồng lúa Việt Nam" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-linear-to-r from-white/70 via-white/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-white/60 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            Nền tảng truy xuất nguồn gốc #1 Việt Nam
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Minh bạch từ <span className="text-primary">nông trại</span> đến <span className="text-primary">bàn ăn</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            AgriTrace giúp quản lý toàn bộ chuỗi cung ứng nông sản — từ gieo trồng, canh tác, thu hoạch đến đóng gói — đảm bảo an
            toàn thực phẩm theo tiêu chuẩn VietGAP.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="/login">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg">
                Bắt đầu miễn phí <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/trace/BATCH-RAU-2025-001">
              <Button variant="outline" size="lg" className="text-base px-8 h-12 bg-background/70 backdrop-blur-sm border-primary/40 text-foreground hover:bg-background/90">
                <QrCode className="h-5 w-5 mr-2" /> Xem demo tra cứu
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" /> Miễn phí dùng thử
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Bảo mật dữ liệu
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" /> Chuẩn VietGAP
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

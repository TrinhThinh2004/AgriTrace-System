import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, ArrowRight } from "lucide-react";

export default function ShowcaseSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Vì sao chọn AgriTrace?</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">Nâng tầm giá trị nông sản Việt</h2>
            <div className="space-y-4">
              {["Tăng 35% giá trị sản phẩm nhờ truy xuất minh bạch","Giảm 70% thời gian kiểm tra, chứng nhận","Kết nối trực tiếp nông dân với người tiêu dùng","Tuân thủ 100% tiêu chuẩn VietGAP, GlobalGAP"].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
            <Link href="/login" className="inline-block mt-8">
              <Button size="lg" className="text-base">Trải nghiệm ngay <ArrowRight className="h-5 w-5 ml-2" /></Button>
            </Link>
          </div>
          <div className="relative">
            <Image src="/images/fresh-produce.jpg" alt="Nông sản tươi sạch" width={800} height={600} className="rounded-2xl shadow-2xl w-full object-cover aspect-4/3 brightness-90 contrast-105" />
            <div className="absolute -bottom-6 -left-6 bg-card border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Đã chứng nhận</p>
                  <p className="text-xs text-muted-foreground">VietGAP • GlobalGAP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

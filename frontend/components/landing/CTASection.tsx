import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sprout, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative bg-linear-to-br from-green-800 via-emerald-700 to-green-600 rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden max-w-4xl mx-auto shadow-2xl shadow-green-900/20">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/30 rounded-[40%_60%_70%_30%] -translate-x-1/4 -translate-y-1/4 blur-sm" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/20 rounded-[60%_40%_30%_70%] translate-x-1/3 translate-y-1/3 blur-md" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center mb-6 shadow-inner">
              <Sprout className="w-8 h-8 text-green-100" />
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">Sẵn sàng nâng tầm nông sản?</h2>
            <p className="text-green-50 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">Tham gia cùng hàng ngàn trang trại đã tin tưởng AgriTrace để minh bạch hóa chuỗi cung ứng và gia tăng giá trị sản phẩm.</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-14 bg-white text-green-800 hover:bg-green-50 hover:text-green-900 shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold">Đăng ký miễn phí <ArrowRight className="h-5 w-5 ml-2" /></Button>
              </Link>
              <Link href="/trace/BATCH-RAU-2025-001" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-14 border-white/30 text-white bg-white/5 hover:bg-white/15 backdrop-blur-sm transition-all rounded-xl">Xem demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

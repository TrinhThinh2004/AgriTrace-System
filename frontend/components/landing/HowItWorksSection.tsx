import { steps } from "@/lib/landing-data";
import { ChevronRight } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Quy trình</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">4 bước đơn giản</h2>
          <p className="text-muted-foreground text-lg">Từ gieo hạt đến tay người tiêu dùng — mọi thứ đều được ghi nhận minh bạch.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <div className="bg-card border rounded-2xl p-6 text-center h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl font-bold text-primary/10 mb-3">{s.step}</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 z-10">
                  <ChevronRight className="h-6 w-6 text-primary/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

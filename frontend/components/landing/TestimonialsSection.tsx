import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { testimonials } from "@/lib/landing-data";
import { Star } from "lucide-react";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Đánh giá</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Được tin dùng bởi hàng ngàn nông dân</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="h-4 w-4 fill-primary text-primary" />))}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">“{t.content}”</p>
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <Image src={t.avatar} alt={t.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{t.name.charAt(0)}</div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

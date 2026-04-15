import { Card, CardContent } from "@/components/ui/card";
import { features } from "@/lib/landing-data";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Tính năng</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Giải pháp toàn diện cho nông nghiệp</h2>
          <p className="text-muted-foreground text-lg">Mọi công cụ bạn cần để quản lý, theo dõi và chứng nhận chuỗi cung ứng nông sản.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <Card key={i} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

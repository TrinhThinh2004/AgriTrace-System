export default function PartnersSection() {
  return (
    <section className="py-16 px-4 border-y">
      <div className="container mx-auto text-center">
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">Đối tác & Tiêu chuẩn hỗ trợ</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            "VietGAP",
            "GlobalGAP",
            "OCOP",
            "ISO 22000",
            "Bộ NN&PTNT",
            "VCCI",
          ].map((p, i) => (
            <div key={i} className="text-lg md:text-xl font-bold text-muted-foreground/50 hover:text-primary transition-colors">{p}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

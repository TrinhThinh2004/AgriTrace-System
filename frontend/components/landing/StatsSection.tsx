"use client";
import { stats } from "@/lib/landing-data";
import { useCounter } from "@/hooks/use-counter";

export default function StatsSection() {
  return (
    <section id="stats" className="py-16 px-4 border-b bg-card">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <StatCounter key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCounter({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix: string; icon: any }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground">{count.toLocaleString()}{suffix}</div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

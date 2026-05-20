"use client";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface DistributionPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export function DistributionPieChart({
  data,
  className,
  innerRadius = 28,
  outerRadius = 55,
}: DistributionPieChartProps) {
  const config: ChartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.color };
    return acc;
  }, {} as ChartConfig);

  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <ChartContainer config={config} className={className ?? "h-44 w-full"}>
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={data.filter((d) => d.value > 0)}
          dataKey="value"
          nameKey="name"
          cx="35%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
        >
          {data.filter((d) => d.value > 0).map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <ChartLegend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={
            <ChartLegendContent
              nameKey="name"
              className="flex-col items-start gap-1! pt-0! text-[10px] [&>div]:justify-start"
            />
          }
        />
      </PieChart>
    </ChartContainer>
  );
}

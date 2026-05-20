"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface CountBarChartProps {
  data: Array<{ label: string; value: number }>;
  config?: ChartConfig;
  color?: string;
  className?: string;
  barName?: string;
}

const defaultColor = "hsl(var(--primary))";

export function CountBarChart({
  data,
  config,
  color = defaultColor,
  className,
  barName = "Số lượng",
}: CountBarChartProps) {
  const chartConfig: ChartConfig = config ?? { value: { label: barName, color } };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className={className ?? "h-36 w-full"}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={4} fontSize={10} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={22} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" name={barName} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

export function aggregateByMonth<T>(items: T[], getDate: (item: T) => string | Date | null | undefined, months = 6): Array<{ label: string; value: number }> {
  const now = new Date();
  const buckets: Array<{ label: string; value: number; key: string }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
      value: 0,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const date = new Date(raw);
    if (isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.value++;
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}

export function aggregateByField<T>(items: T[], getField: (item: T) => string, labelMap: Record<string, string>, colorMap: Record<string, string>): Array<{ name: string; value: number; color: string }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const field = getField(item);
    if (!field) continue;
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }
  return Object.keys(labelMap).map((key) => ({
    name: labelMap[key],
    value: counts.get(key) ?? 0,
    color: colorMap[key] ?? "#94a3b8",
  }));
}

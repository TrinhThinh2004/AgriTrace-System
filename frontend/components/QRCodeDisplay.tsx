import { QrCode } from "lucide-react";

export function QRCodeDisplay({ code, size = 120 }: { code: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-card">
      <div
        style={{ width: size, height: size }}
        className="bg-muted rounded-lg flex items-center justify-center"
      >
        <QrCode className="h-16 w-16 text-muted-foreground" />
      </div>
      <span className="text-xs font-mono text-muted-foreground">{code}</span>
    </div>
  );
}

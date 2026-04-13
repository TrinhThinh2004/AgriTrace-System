"use client";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export function QRCodeDisplay({
  code,
  size = 120,
  downloadable = false,
}: {
  code: string;
  size?: number;
  downloadable?: boolean;
}) {
  const svgRef = useRef<HTMLDivElement>(null);
  const traceUrl = `${FRONTEND_URL}/trace/${code}`;

  const handleDownload = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `qr-${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-card">
      <div ref={svgRef}>
        <QRCodeSVG
          value={traceUrl}
          size={size}
          level="M"
          marginSize={2}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">{code}</span>
      {downloadable && (
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-3 w-3 mr-1" />
          T&#7843;i QR
        </Button>
      )}
    </div>
  );
}

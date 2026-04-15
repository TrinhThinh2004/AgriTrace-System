"use client";
import { useState } from "react";
import Link from "next/link";
import { Tractor, Menu, X,Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#features", label: "Tính năng" },
  { href: "/#how-it-works", label: "Cách hoạt động" },
  { href: "/#stats", label: "Thành tựu" },
  { href: "/#testimonials", label: "Đánh giá" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">AgriTrace</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/trace/BATCH-RAU-2025-001">
            <Button variant="ghost" size="sm">Tra cứu</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">Đăng nhập</Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Đăng ký</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-card">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            ))}
            <Link href="/trace/AGT-2024-001" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Tra cứu</Link>
            <div className="flex gap-2 pt-3 border-t mt-2">
              <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">
                  Đăng ký
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

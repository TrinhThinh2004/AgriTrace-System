import Link from "next/link";
import { Tractor, Mail } from "lucide-react";
import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
const productLinks = [
  { href: "/#features", label: "Tính năng" },
  { href: "/trace/AGT-2024-001", label: "Tra cứu QR" },
  { href: "/#pricing", label: "Bảng giá" },
  { href: "/#roles", label: "Vai trò" },
];

const companyLinks = [
  { href: "/#about", label: "Về chúng tôi" },
  { href: "/#contact", label: "Liên hệ" },
  { href: "/#careers", label: "Tuyển dụng" },
  { href: "/#blog", label: "Blog" },
];

const legalLinks = [
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/privacy", label: "Chính sách bảo mật" },
  { href: "/cookies", label: "Cookie" },
];

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Tractor className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AgriTrace</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống truy xuất nguồn gốc nông sản — minh bạch từ nông trại đến bàn ăn.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FaFacebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FaTwitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Github"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FaGithub className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@agritrace.vn"
                aria-label="Email"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Công ty</h3>
            <ul className="space-y-2">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Pháp lý</h3>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 AgriTrace. Bảo lưu mọi quyền.
          </p>
          <p className="text-xs text-muted-foreground">
            Được tạo với <span className="text-primary">🌱</span> tại Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Award, BarChart3, Globe, Package, ScanLine, Sprout, Leaf, Shield, QrCode, Users } from "lucide-react";

export type Feature = {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
};

export type Stat = {
  label: string;
  value: number;
  suffix: string;
  icon: React.ComponentType<any>;
};

export type Step = {
  step: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
};

export type Testimonial = {
  name: string;
  role: string;
  content: string;
  avatar?: string | null;
};

export const features: Feature[] = [
  { icon: Leaf, title: "Truy xuất nguồn gốc", description: "Theo dõi hành trình sản phẩm từ giống → canh tác → thu hoạch → đóng gói, đảm bảo minh bạch 100%." },
  { icon: Shield, title: "Chứng nhận tiêu chuẩn", description: "Hỗ trợ VietGAP, GlobalGAP và các tiêu chuẩn nông nghiệp quốc tế, tự động kiểm tra tuân thủ." },
  { icon: QrCode, title: "QR Code minh bạch", description: "Người tiêu dùng quét QR để xem toàn bộ hành trình sản phẩm — nhanh chóng, dễ dàng." },
  { icon: BarChart3, title: "Phân tích & Báo cáo", description: "Dashboard thống kê chi tiết, theo dõi năng suất, chất lượng và hiệu quả sản xuất." },
  { icon: Users, title: "Quản lý đa vai trò", description: "Hệ thống phân quyền rõ ràng cho Admin, Nông dân, Thanh tra và Công chúng." },
  { icon: Globe, title: "Kết nối chuỗi cung ứng", description: "Liên kết trang trại, nhà máy, nhà phân phối trên một nền tảng duy nhất." },
];

export const stats: Stat[] = [
  { label: "Trang trại", value: 1250, suffix: "+", icon: Sprout },
  { label: "Lô hàng theo dõi", value: 45000, suffix: "+", icon: Package },
  { label: "Lượt quét QR", value: 320000, suffix: "+", icon: ScanLine },
  { label: "Tỷ lệ chứng nhận", value: 100, suffix: "%", icon: Award },
];

export const steps: Step[] = [
  { step: "01", title: "Gieo trồng", desc: "Ghi nhận giống, ngày trồng, diện tích canh tác", icon: Sprout },
  { step: "02", title: "Canh tác", desc: "Nhật ký phân bón, thuốc BVTV theo chuẩn VietGAP", icon: Leaf },
  { step: "03", title: "Thu hoạch", desc: "Ghi nhận sản lượng, chất lượng, ngày thu hoạch", icon: BarChart3 },
  { step: "04", title: "Đóng gói & QR", desc: "Xuất mã QR, chứng nhận, sẵn sàng phân phối", icon: Package },
];

export const testimonials: Testimonial[] = [
  {
    name: "Nguyễn Văn Hùng",
    role: "Nông dân - Đồng Tháp",
    content: "AgriTrace giúp tôi quản lý quy trình sản xuất dễ dàng hơn rất nhiều. Khách hàng tin tưởng sản phẩm hơn khi có mã QR truy xuất.",
    avatar: "/images/farmer-portrait.jpg",
  },
  {
    name: "Trần Thị Mai",
    role: "Thanh tra viên - Sở NN&PTNT",
    content: "Việc kiểm tra và chứng nhận nhanh chóng hơn 70% so với quy trình giấy tờ truyền thống. Rất chuyên nghiệp.",
    avatar: null,
  },
  {
    name: "Lê Minh Tuấn",
    role: "Giám đốc HTX Nông sản sạch",
    content: "Từ khi dùng AgriTrace, doanh thu tăng 35% nhờ xây dựng được niềm tin với người tiêu dùng về nguồn gốc sản phẩm.",
    avatar: null,
  },
];

export const partners: string[] = ["VietGAP", "GlobalGAP", "OCOP", "ISO 22000", "Bộ NN&PTNT", "VCCI"];

export default {};

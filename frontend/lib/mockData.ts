export type Role = "admin" | "farmer" | "inspector" | "public";

export type BatchStatus = "draft" | "in_progress" | "completed" | "certified" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Farm {
  id: string;
  name: string;
  owner: string;
  location: string;
  area: string;
  certified: boolean;
  standard: string;
  status: "active" | "inactive";
}

export interface Batch {
  id: string;
  batchCode: string;
  cropVariety: string;
  farmName: string;
  farmerName: string;
  status: BatchStatus;
  plantingDate: string;
  harvestDate?: string;
  area: string;
  currentStep: number;
  createdAt: string;
}

export interface CropVariety {
  id: string;
  name: string;
  category: string;
  season: string;
  avgYield: string;
}

export interface Activity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
}

export interface Standard {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "active" | "draft";
}

export const currentUser: User = {
  id: "u1",
  name: "Nguyen Van Admin",
  email: "admin@agritrace.vn",
  role: "admin",
};

export const mockUsers: User[] = [
  currentUser,
  { id: "u2", name: "Tran Thi Farmer", email: "farmer@agritrace.vn", role: "farmer" },
  { id: "u3", name: "Le Van Inspector", email: "inspector@agritrace.vn", role: "inspector" },
  { id: "u4", name: "Pham Minh Farmer", email: "farmer2@agritrace.vn", role: "farmer" },
  { id: "u5", name: "Hoang Duc Admin", email: "admin2@agritrace.vn", role: "admin" },
];

export const mockFarms: Farm[] = [
  { id: "f1", name: "Trang trại Thung Lũng Xanh", owner: "Tran Thi Farmer", location: "Da Lat, Lam Dong", area: "5.2 ha", certified: true, standard: "VietGAP", status: "active" },
  { id: "f2", name: "Sunrise Organic", owner: "Pham Minh Farmer", location: "Ninh Thuan", area: "3.8 ha", certified: true, standard: "GlobalGAP", status: "active" },
  { id: "f3", name: "Trang trại Cao Nguyên", owner: "Tran Thi Farmer", location: "Buon Ma Thuot", area: "2.1 ha", certified: false, standard: "VietGAP", status: "active" },
  { id: "f4", name: "Công ty Gạo Đồng Bằng", owner: "Pham Minh Farmer", location: "Can Tho", area: "12 ha", certified: true, standard: "VietGAP", status: "inactive" },
];

export const mockBatches: Batch[] = [
  { id: "b1", batchCode: "AGT-2024-001", cropVariety: "Cà phê Arabica", farmName: "Trang trại Thung Lũng Xanh", farmerName: "Tran Thi Farmer", status: "certified", plantingDate: "2024-01-15", harvestDate: "2024-06-20", area: "1.2 ha", currentStep: 4, createdAt: "2024-01-10" },
  { id: "b2", batchCode: "AGT-2024-002", cropVariety: "Thanh long", farmName: "Sunrise Organic", farmerName: "Pham Minh Farmer", status: "in_progress", plantingDate: "2024-03-01", area: "0.8 ha", currentStep: 2, createdAt: "2024-02-28" },
  { id: "b3", batchCode: "AGT-2024-003", cropVariety: "Gạo Jasmine", farmName: "Công ty Gạo Đồng Bằng", farmerName: "Pham Minh Farmer", status: "completed", plantingDate: "2024-02-10", harvestDate: "2024-07-15", area: "5 ha", currentStep: 3, createdAt: "2024-02-05" },
  { id: "b4", batchCode: "AGT-2024-004", cropVariety: "Cà phê Robusta", farmName: "Trang trại Cao Nguyên", farmerName: "Tran Thi Farmer", status: "draft", plantingDate: "2024-04-01", area: "0.5 ha", currentStep: 1, createdAt: "2024-03-28" },
  { id: "b5", batchCode: "AGT-2024-005", cropVariety: "Tiêu", farmName: "Trang trại Thung Lũng Xanh", farmerName: "Tran Thi Farmer", status: "rejected", plantingDate: "2024-01-20", harvestDate: "2024-05-10", area: "0.3 ha", currentStep: 4, createdAt: "2024-01-18" },
];

export const mockCropVarieties: CropVariety[] = [
  { id: "c1", name: "Cà phê Arabica", category: "Cà phê", season: "Cả năm", avgYield: "2.5 tấn/ha" },
  { id: "c2", name: "Cà phê Robusta", category: "Cà phê", season: "Cả năm", avgYield: "3.0 tấn/ha" },
  { id: "c3", name: "Thanh long", category: "Trái cây", season: "Tháng 4 - 11", avgYield: "25 tấn/ha" },
  { id: "c4", name: "Gạo Jasmine", category: "Lúa gạo", season: "Tháng 6 - 11", avgYield: "6.5 tấn/ha" },
  { id: "c5", name: "Tiêu", category: "Gia vị", season: "Cả năm", avgYield: "3.5 tấn/ha" },
  { id: "c6", name: "Sầu riêng", category: "Trái cây", season: "Tháng 5 - 8", avgYield: "15 tấn/ha" },
];

export const mockActivities: Activity[] = [
  { id: "a1", action: "Lô được chứng nhận", user: "Le Van Inspector", target: "AGT-2024-001", timestamp: "2024-06-25 14:30" },
  { id: "a2", action: "Đã ghi nhận thu hoạch", user: "Pham Minh Farmer", target: "AGT-2024-003", timestamp: "2024-07-15 09:15" },
  { id: "a3", action: "Tạo lô mới", user: "Tran Thi Farmer", target: "AGT-2024-004", timestamp: "2024-03-28 11:00" },
  { id: "a4", action: "Lô bị từ chối", user: "Le Van Inspector", target: "AGT-2024-005", timestamp: "2024-05-12 16:45" },
  { id: "a5", action: "Đăng ký nông trại", user: "Nguyen Van Admin", target: "Trang trại Cao Nguyên", timestamp: "2024-03-20 10:00" },
];

export const mockStandards: Standard[] = [
  { id: "s1", name: "VietGAP", code: "VGAP-2023", description: "Tiêu chuẩn Thực hành Nông nghiệp Tốt Việt Nam cho sản xuất an toàn", status: "active" },
  { id: "s2", name: "GlobalGAP", code: "GGAP-5.4", description: "Tiêu chuẩn quốc tế cho quy trình sản xuất nông nghiệp", status: "active" },
  { id: "s3", name: "Organic Vietnam", code: "ORG-VN-2024", description: "Tiêu chuẩn chứng nhận hữu cơ quốc gia", status: "draft" },
];

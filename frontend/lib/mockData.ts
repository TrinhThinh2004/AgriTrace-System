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
  { id: "f1", name: "Green Valley Farm", owner: "Tran Thi Farmer", location: "Da Lat, Lam Dong", area: "5.2 ha", certified: true, standard: "VietGAP", status: "active" },
  { id: "f2", name: "Sunrise Organic", owner: "Pham Minh Farmer", location: "Ninh Thuan", area: "3.8 ha", certified: true, standard: "GlobalGAP", status: "active" },
  { id: "f3", name: "Highland Herbs", owner: "Tran Thi Farmer", location: "Buon Ma Thuot", area: "2.1 ha", certified: false, standard: "VietGAP", status: "active" },
  { id: "f4", name: "Delta Rice Co.", owner: "Pham Minh Farmer", location: "Can Tho", area: "12 ha", certified: true, standard: "VietGAP", status: "inactive" },
];

export const mockBatches: Batch[] = [
  { id: "b1", batchCode: "AGT-2024-001", cropVariety: "Arabica Coffee", farmName: "Green Valley Farm", farmerName: "Tran Thi Farmer", status: "certified", plantingDate: "2024-01-15", harvestDate: "2024-06-20", area: "1.2 ha", currentStep: 4, createdAt: "2024-01-10" },
  { id: "b2", batchCode: "AGT-2024-002", cropVariety: "Dragon Fruit", farmName: "Sunrise Organic", farmerName: "Pham Minh Farmer", status: "in_progress", plantingDate: "2024-03-01", area: "0.8 ha", currentStep: 2, createdAt: "2024-02-28" },
  { id: "b3", batchCode: "AGT-2024-003", cropVariety: "Jasmine Rice", farmName: "Delta Rice Co.", farmerName: "Pham Minh Farmer", status: "completed", plantingDate: "2024-02-10", harvestDate: "2024-07-15", area: "5 ha", currentStep: 3, createdAt: "2024-02-05" },
  { id: "b4", batchCode: "AGT-2024-004", cropVariety: "Robusta Coffee", farmName: "Highland Herbs", farmerName: "Tran Thi Farmer", status: "draft", plantingDate: "2024-04-01", area: "0.5 ha", currentStep: 1, createdAt: "2024-03-28" },
  { id: "b5", batchCode: "AGT-2024-005", cropVariety: "Pepper", farmName: "Green Valley Farm", farmerName: "Tran Thi Farmer", status: "rejected", plantingDate: "2024-01-20", harvestDate: "2024-05-10", area: "0.3 ha", currentStep: 4, createdAt: "2024-01-18" },
];

export const mockCropVarieties: CropVariety[] = [
  { id: "c1", name: "Arabica Coffee", category: "Coffee", season: "Year-round", avgYield: "2.5 tons/ha" },
  { id: "c2", name: "Robusta Coffee", category: "Coffee", season: "Year-round", avgYield: "3.0 tons/ha" },
  { id: "c3", name: "Dragon Fruit", category: "Fruit", season: "Apr-Nov", avgYield: "25 tons/ha" },
  { id: "c4", name: "Jasmine Rice", category: "Rice", season: "Jun-Nov", avgYield: "6.5 tons/ha" },
  { id: "c5", name: "Pepper", category: "Spice", season: "Year-round", avgYield: "3.5 tons/ha" },
  { id: "c6", name: "Durian", category: "Fruit", season: "May-Aug", avgYield: "15 tons/ha" },
];

export const mockActivities: Activity[] = [
  { id: "a1", action: "Batch certified", user: "Le Van Inspector", target: "AGT-2024-001", timestamp: "2024-06-25 14:30" },
  { id: "a2", action: "Harvest logged", user: "Pham Minh Farmer", target: "AGT-2024-003", timestamp: "2024-07-15 09:15" },
  { id: "a3", action: "New batch created", user: "Tran Thi Farmer", target: "AGT-2024-004", timestamp: "2024-03-28 11:00" },
  { id: "a4", action: "Batch rejected", user: "Le Van Inspector", target: "AGT-2024-005", timestamp: "2024-05-12 16:45" },
  { id: "a5", action: "Farm registered", user: "Nguyen Van Admin", target: "Highland Herbs", timestamp: "2024-03-20 10:00" },
];

export const mockStandards: Standard[] = [
  { id: "s1", name: "VietGAP", code: "VGAP-2023", description: "Vietnamese Good Agricultural Practices standard for safe crop production", status: "active" },
  { id: "s2", name: "GlobalGAP", code: "GGAP-5.4", description: "International standard for farm production processes", status: "active" },
  { id: "s3", name: "Organic Vietnam", code: "ORG-VN-2024", description: "National organic certification standard", status: "draft" },
];

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tractor, Leaf, Shield, QrCode, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  {
    icon: Leaf,
    title: "Truy xuất nguồn gốc minh bạch",
    desc: "Theo dõi hành trình sản phẩm từ giống đến bàn ăn.",
  },
  {
    icon: Shield,
    title: "Chứng nhận VietGAP / GlobalGAP",
    desc: "Tuân thủ các tiêu chuẩn nông nghiệp quốc tế.",
  },
  {
    icon: QrCode,
    title: "QR code cho người tiêu dùng",
    desc: "Khách hàng quét QR để xem toàn bộ lịch sử sản phẩm.",
  },
  {
    icon: CheckCircle,
    title: "Quản lý quy trình sản xuất",
    desc: "Ghi nhận canh tác, thu hoạch, đóng gói chính xác.",
  },
];

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      router.push("/dashboard");
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không đúng.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (rPassword !== rConfirm) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" });
      return;
    }
    const res = register({ name: rName, email: rEmail, password: rPassword, role: "farmer" });
    if (res.ok) {
      toast({ title: "Đăng ký thành công", description: "Chào mừng bạn đến với AgriTrace!" });
      router.push("/dashboard");  
    } else {
      toast({ title: "Đăng ký thất bại", description: res.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-5xl grid gap-10 md:grid-cols-2 items-center">
        {/* Left: branding + benefits */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2">
              <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
                <Tractor className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold">AgriTrace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Minh bạch từ <span className="text-primary">nông trại</span> đến{" "}
              <span className="text-primary">bàn ăn</span>
            </h1>
            <p className="text-muted-foreground">
              Hệ thống truy xuất nguồn gốc nông sản dành cho nông dân, kiểm định viên
              và người tiêu dùng.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: login/register tabs */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Chào mừng</CardTitle>
            <CardDescription>Đăng nhập hoặc tạo tài khoản mới để sử dụng hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input id="password" type="password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" size="lg">Đăng nhập</Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rName">Họ và tên</Label>
                    <Input id="rName" value={rName} onChange={e => setRName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rEmail">Email</Label>
                    <Input id="rEmail" type="email" value={rEmail} onChange={e => setREmail(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rPassword">Mật khẩu</Label>
                      <Input id="rPassword" type="password" value={rPassword}
                        onChange={e => setRPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rConfirm">Xác nhận</Label>
                      <Input id="rConfirm" type="password" value={rConfirm}
                        onChange={e => setRConfirm(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  {/* <p className="text-xs text-muted-foreground">
                    Tài khoản mới được tạo với vai trò <span className="font-medium text-foreground">Nông dân (Farmer)</span>.
                    Tài khoản Kiểm định viên do quản trị viên cấp riêng.
                  </p> */}
                  <Button type="submit" className="w-full" size="lg">Tạo tài khoản</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

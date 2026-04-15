"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import type { BeUser } from "@/stores/auth-store";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "FARMER", label: "Nông dân" },
  { value: "INSPECTOR", label: "Kiểm định viên" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "SUSPENDED", label: "Đình chỉ" },
];

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<BeUser | null>(null);
  const { data, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Create form
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    role: "FARMER",
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    role: "",
    status: "",
  });

  const roleColors: Record<string, string> = {
    ADMIN: "bg-destructive/10 text-destructive border-destructive/20",
    FARMER: "bg-success/10 text-success border-success/20",
    INSPECTOR: "bg-info/10 text-info border-info/20",
    PUBLIC: "bg-muted text-muted-foreground",
  };

  const users = data?.items || [];
  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.role) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    try {
      await createUser.mutateAsync({
        email: createForm.email,
        full_name: createForm.full_name,
        phone: createForm.phone || undefined,
        password: createForm.password || undefined,
        role: createForm.role,
      });
      toast.success("Tạo người dùng thành công");
      setCreateOpen(false);
      setCreateForm({ email: "", full_name: "", phone: "", password: "", role: "FARMER" });
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const openEdit = (u: BeUser) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name,
      phone: u.phone ?? "",
      role: u.role,
      status: u.status ?? "ACTIVE",
    });
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await updateUser.mutateAsync({
        id: editUser.id,
        body: {
          full_name: editForm.full_name || undefined,
          phone: editForm.phone || undefined,
          role: editForm.role || undefined,
          status: editForm.status || undefined,
        },
      });
      toast.success("Cập nhật thành công");
      setEditUser(null);
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Đã xóa người dùng thành công");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">Quản lý người dùng và phân quyền</p>
        </div>

        {/* Create User Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Họ tên *</Label>
                <Input
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Để trống sẽ dùng mật khẩu mặc định"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label>Vai trò *</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Tạo người dùng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm người dùng..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không tìm thấy người dùng nào</TableCell>
                  </TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{u.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${roleColors[u.role] || roleColors.PUBLIC}`}>
                        {u.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {u.status === "ACTIVE" ? "Hoạt động" : u.status === "SUSPENDED" ? "Đình chỉ" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(u.id)} disabled={deleteUser.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editUser.email} disabled />
              </div>
              <div>
                <Label>Họ tên</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Vai trò</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

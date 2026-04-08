"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { mockCropVarieties } from "@/lib/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CropVarieties() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const filtered = mockCropVarieties.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crop Varieties</h1>
          <p className="text-sm text-muted-foreground">Manage crop variety catalog</p>
        </div>
        <Button onClick={() => toast({ title: "Add Variety", description: "Variety form would open" })}>
          <Plus className="h-4 w-4 mr-1" /> Add Variety
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search varieties..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Avg Yield</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.season}</TableCell>
                  <TableCell className="text-sm">{c.avgYield}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

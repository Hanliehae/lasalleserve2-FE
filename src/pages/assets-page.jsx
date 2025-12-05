// src/pages/assets-page.jsx
import { useMemo, useState, useEffect } from "react";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../context/auth-context.jsx";
import { assetService } from "../lib/services/assetService";
import { toast } from "sonner";

const MANAGER_ROLES = ["admin_buf"];

export function AssetsPage() {
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingAsset, setEditingAsset] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canManageAssets = MANAGER_ROLES.includes(user?.role ?? "");

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const result = await assetService.getAssets(searchTerm, categoryFilter);

      if (result.status === "success") {
        setAssets(result.data.assets || []);
      } else {
        toast.error("Gagal memuat data aset");
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Terjadi kesalahan saat memuat data aset");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(keyword) ||
        asset.location.toLowerCase().includes(keyword);
      const matchesCategory =
        categoryFilter === "all" || asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchTerm, categoryFilter]);

  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    fetchAssets(); // Refresh data when category changes
  };

  const handleAddAsset = async (payload) => {
    try {
      const result = await assetService.createAsset(payload);

      if (result.status === "success") {
        setAssets((prev) => [...prev, result.data.asset]);
        toast.success("Aset berhasil ditambahkan");
        setIsDialogOpen(false);
      } else {
        toast.error(result.message || "Gagal menambahkan aset");
      }
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error("Terjadi kesalahan saat menambahkan aset");
    }
  };

  const handleUpdateAsset = async (updates) => {
    if (!editingAsset) return;

    try {
      const result = await assetService.updateAsset(editingAsset.id, updates);

      if (result.status === "success") {
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === editingAsset.id ? { ...asset, ...updates } : asset
          )
        );
        toast.success("Aset berhasil diperbarui");
        setEditingAsset(null);
        setIsDialogOpen(false);
      } else {
        toast.error(result.message || "Gagal memperbarui aset");
      }
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Terjadi kesalahan saat memperbarui aset");
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Yakin ingin menghapus aset ini?")) return;

    try {
      const result = await assetService.deleteAsset(id);

      if (result.status === "success") {
        setAssets((prev) => prev.filter((asset) => asset.id !== id));
        toast.success("Aset berhasil dihapus");
      } else {
        toast.error(result.message || "Gagal menghapus aset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Terjadi kesalahan saat menghapus aset");
    }
  };

  const openCreateDialog = () => {
    setEditingAsset(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset) => {
    setEditingAsset(asset);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingAsset(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Manajemen Aset</h1>
          <p className="text-muted-foreground mt-2">
            Kelola aset dan fasilitas BUF
          </p>
        </div>
        {canManageAssets && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            Tambah Aset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="size-5 text-muted-foreground" />
              <Input
                placeholder="Cari aset atau lokasi..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="max-w-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") fetchAssets();
                }}
              />
              <Button onClick={fetchAssets} variant="outline">
                Cari
              </Button>
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="ruangan">Ruangan</SelectItem>
                <SelectItem value="fasilitas">Fasilitas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AssetsTable
              assets={filteredAssets}
              canManage={canManageAssets}
              onEdit={openEditDialog}
              onDelete={handleDeleteAsset}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Edit Aset" : "Tambah Aset Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? "Perbarui informasi aset."
                : "Masukkan informasi aset yang akan ditambahkan."}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            initialData={editingAsset}
            onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetsTable({ assets, canManage, onEdit, onDelete }) {
  if (assets.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Tidak ada aset ditemukan
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Aset</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Stok Total</TableHead>
              <TableHead>Tersedia</TableHead>
              <TableHead>Kondisi</TableHead>
              {canManage && <TableHead>Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    <div>
                      <p>{asset.name}</p>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground">
                          {asset.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{asset.category}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>{asset.totalStock}</TableCell>
                <TableCell>
                  <span
                    className={
                      asset.availableStock === 0 ? "text-red-600" : undefined
                    }
                  >
                    {asset.availableStock}
                  </span>
                </TableCell>
                <TableCell>
                  <AssetConditionBadge value={asset.condition} />
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(asset)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(asset.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AssetConditionBadge({ value }) {
  const variants = {
    baik: "default",
    rusak_ringan: "secondary",
    rusak_berat: "destructive",
  };

  return <Badge variant={variants[value]}>{value.replace("_", " ")}</Badge>;
}

function AssetForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    initialData ?? {
      name: "",
      category: "fasilitas",
      location: "",
      totalStock: 0,
      availableStock: 0,
      condition: "baik",
      description: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Aset</Label>
        <Input
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasilitas">Fasilitas</SelectItem>
            <SelectItem value="ruangan">Ruangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Lokasi</Label>
        <Input
          value={formData.location}
          onChange={(event) =>
            setFormData({ ...formData, location: event.target.value })
          }
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Total Stok</Label>
          <Input
            type="number"
            value={formData.totalStock}
            onChange={(event) =>
              setFormData({
                ...formData,
                totalStock: Number(event.target.value),
              })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Stok Tersedia</Label>
          <Input
            type="number"
            value={formData.availableStock}
            onChange={(event) =>
              setFormData({
                ...formData,
                availableStock: Number(event.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kondisi</Label>
        <Select
          value={formData.condition}
          onValueChange={(value) =>
            setFormData({ ...formData, condition: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baik">Baik</SelectItem>
            <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
            <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea
          value={formData.description}
          onChange={(event) =>
            setFormData({ ...formData, description: event.target.value })
          }
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}

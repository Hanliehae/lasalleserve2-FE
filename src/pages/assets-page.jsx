// src/pages/assets-page.js - UPDATE untuk real backend
import { useMemo, useState, useEffect } from "react";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

const MANAGER_ROLES = ["admin_buf", "kepala_buf"];

export function AssetsPage() {
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingAsset, setEditingAsset] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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
        toast.error(result.message || "Gagal memuat data aset");
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error(error.message || "Terjadi kesalahan saat memuat data aset");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async () => {
    try {
      setSearchLoading(true);
      const result = await assetService.getAssets(searchTerm, categoryFilter);

      if (result.status === "success") {
        setAssets(result.data.assets || []);
      } else {
        toast.error(result.message || "Gagal mencari aset");
      }
    } catch (error) {
      console.error("Error searching assets:", error);
      toast.error("Terjadi kesalahan saat mencari aset");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    // Trigger fetch with new category filter
    setTimeout(() => handleSearchSubmit(), 100);
  };

  const handleSubmitAsset = async (formData) => {
    try {
      let result;

      if (editingAsset) {
        result = await assetService.updateAsset(editingAsset.id, formData);
        if (result.status === "success") {
          toast.success(result.message || "Aset berhasil diperbarui");
        } else {
          toast.error(result.message || "Gagal memperbarui aset");
          return;
        }
      } else {
        result = await assetService.createAsset(formData);
        if (result.status === "success") {
          toast.success(result.message || "Aset berhasil ditambahkan");
        } else {
          toast.error(result.message || "Gagal menambahkan aset");
          return;
        }
      }

      // Refresh data
      fetchAssets();
      setIsDialogOpen(false);
      setEditingAsset(null);
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan aset");
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Yakin ingin menghapus aset ini?")) return;

    try {
      const result = await assetService.deleteAsset(id);

      if (result.status === "success") {
        toast.success("Aset berhasil dihapus");
        fetchAssets(); // Refresh data
      } else {
        toast.error(result.message || "Gagal menghapus aset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus aset");
    }
  };

  const openCreateDialog = () => {
    setEditingAsset(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset) => {
    // Prepare asset data for form
    const assetForEdit = {
      ...asset,
      baik:
        asset.baik ||
        asset.conditions?.find((c) => c.condition === "baik")?.quantity ||
        0,
      rusakRingan:
        asset.rusakRingan ||
        asset.conditions?.find((c) => c.condition === "rusak_ringan")
          ?.quantity ||
        0,
      rusakBerat:
        asset.rusakBerat ||
        asset.conditions?.find((c) => c.condition === "rusak_berat")
          ?.quantity ||
        0,
    };

    setEditingAsset(assetForEdit);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingAsset(null);
    setIsDialogOpen(false);
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
              />
              <Button
                onClick={handleSearchSubmit}
                variant="outline"
                disabled={searchLoading}
              >
                {searchLoading ? "Mencari..." : "Cari"}
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
        <DialogContent className="max-w-2xl">
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
            onSubmit={handleSubmitAsset}
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
        <Package className="mx-auto size-12 mb-4" />
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
              <TableHead>Tahun Ajaran</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Total Stok</TableHead>
              <TableHead>Tersedia (Baik)</TableHead>
              <TableHead>Kondisi</TableHead>
              {canManage && <TableHead>Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
              const baik =
                asset.conditions?.find((c) => c.condition === "baik")
                  ?.quantity || 0;
              const rusakRingan =
                asset.conditions?.find((c) => c.condition === "rusak_ringan")
                  ?.quantity || 0;
              const rusakBerat =
                asset.conditions?.find((c) => c.condition === "rusak_berat")
                  ?.quantity || 0;

              return (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        {asset.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {asset.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{asset.category}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{asset.acquisitionYear || "-"}</TableCell>
                  <TableCell>{asset.semester || "-"}</TableCell>
                  <TableCell className="font-bold">
                    {asset.totalStock}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        asset.availableStock === 0
                          ? "text-red-600 font-bold"
                          : "font-bold"
                      }
                    >
                      {asset.availableStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="default" className="text-xs">
                        Baik: {baik}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Ringan: {rusakRingan}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        Berat: {rusakBerat}
                      </Badge>
                    </div>
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AssetForm({ initialData, onSubmit, onCancel }) {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState(
    initialData
      ? {
          ...initialData,
          baik:
            initialData.conditions?.find((c) => c.condition === "baik")
              ?.quantity || 0,
          rusakRingan:
            initialData.conditions?.find((c) => c.condition === "rusak_ringan")
              ?.quantity || 0,
          rusakBerat:
            initialData.conditions?.find((c) => c.condition === "rusak_berat")
              ?.quantity || 0,
        }
      : {
          name: "",
          category: "fasilitas",
          location: "",
          acquisitionYear: `${currentYear}/${currentYear + 1}`,
          semester: "Ganjil",
          description: "",
          baik: 0,
          rusakRingan: 0,
          rusakBerat: 0,
        }
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare conditions array
    const conditions = [
      { condition: "baik", quantity: parseInt(formData.baik) || 0 },
      {
        condition: "rusak_ringan",
        quantity: parseInt(formData.rusakRingan) || 0,
      },
      {
        condition: "rusak_berat",
        quantity: parseInt(formData.rusakBerat) || 0,
      },
    ];

    // Calculate total stock
    const totalStock = conditions.reduce((sum, cond) => sum + cond.quantity, 0);

    if (totalStock === 0) {
      alert("Total stok harus lebih dari 0");
      return;
    }

    const submitData = {
      ...formData,
      conditions,
    };

    onSubmit(submitData);
  };

  // Calculate total stock
  const totalStock =
    (parseInt(formData.baik) || 0) +
    (parseInt(formData.rusakRingan) || 0) +
    (parseInt(formData.rusakBerat) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Aset *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Contoh: Proyektor LCD 01"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange("category", value)}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="Gedung Agustinus, Lantai 3"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acquisitionYear">Tahun Ajaran</Label>
          <Select
            value={formData.acquisitionYear}
            onValueChange={(value) => handleChange("acquisitionYear", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${currentYear - 1}/${currentYear}`}>
                {currentYear - 1}/{currentYear}
              </SelectItem>
              <SelectItem value={`${currentYear}/${currentYear + 1}`}>
                {currentYear}/{currentYear + 1}
              </SelectItem>
              <SelectItem value={`${currentYear + 1}/${currentYear + 2}`}>
                {currentYear + 1}/{currentYear + 2}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select
            value={formData.semester}
            onValueChange={(value) => handleChange("semester", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ganjil">Ganjil</SelectItem>
              <SelectItem value="Genap">Genap</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">Kondisi dan Stok</Label>
          <div className="text-sm text-muted-foreground">
            Total Stok: <span className="font-bold text-lg">{totalStock}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baik">Baik *</Label>
            <Input
              id="baik"
              type="number"
              min="0"
              value={formData.baik}
              onChange={(e) => handleChange("baik", e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rusakRingan">Rusak Ringan</Label>
            <Input
              id="rusakRingan"
              type="number"
              min="0"
              value={formData.rusakRingan}
              onChange={(e) => handleChange("rusakRingan", e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rusakBerat">Rusak Berat</Label>
            <Input
              id="rusakBerat"
              type="number"
              min="0"
              value={formData.rusakBerat}
              onChange={(e) => handleChange("rusakBerat", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Deskripsi aset..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initialData ? "Update Aset" : "Tambah Aset"}
        </Button>
      </div>
    </form>
  );
}

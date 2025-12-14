import { useMemo, useState, useEffect } from "react";
import { AlertTriangle, Eye, Plus, Search, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
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
import { reportService } from "../lib/services/reportService";
import { assetService } from "../lib/services/assetService";
import { uploadService } from "../lib/services/uploadService";
import { Upload, X } from "lucide-react";

const MANAGER_ROLES = ["staf_buf", "admin_buf", "kepala_buf"];
const STATUS_OPTIONS = [
  { value: "menunggu", label: "Menunggu" },
  { value: "dalam_perbaikan", label: "Dalam Perbaikan" },
  { value: "selesai", label: "Selesai" },
];

const PRIORITY_OPTIONS = [
  { value: "rendah", label: "Rendah" },
  { value: "sedang", label: "Sedang" },
  { value: "tinggi", label: "Tinggi" },
];

const STATUS_BADGE_VARIANTS = {
  menunggu: { variant: "secondary", label: "Menunggu" },
  dalam_perbaikan: { variant: "default", label: "Dalam Perbaikan" },
  selesai: { variant: "default", label: "Selesai" },
};

const PRIORITY_BADGE_VARIANTS = {
  rendah: { variant: "secondary", label: "Rendah" },
  sedang: { variant: "default", label: "Sedang" },
  tinggi: { variant: "destructive", label: "Tinggi" },
};

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canCreateReport = !MANAGER_ROLES.includes(user?.role ?? "");
  const isKepalaBUF = user?.role === "kepala_buf";
  const canEditReports = ["admin_buf", "kepala_buf"].includes(user?.role ?? ""); // admin dan kepala bisa edit

  useEffect(() => {
    fetchReports();
    fetchAssets();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const result = await reportService.getDamageReports(
        searchTerm,
        statusFilter,
        priorityFilter
      );

      if (result.status === "success") {
        setReports(result.data.damageReports || []);
      } else {
        toast.error(result.message || "Gagal memuat laporan kerusakan");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const result = await assetService.getAssets();
      if (result.status === "success") {
        setAssets(result.data.assets || []);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const handleSearchSubmit = () => {
    fetchReports();
  };

  const handleCreateReport = async (formData) => {
    try {
      const result = await reportService.createDamageReport(formData);

      if (result.status === "success") {
        toast.success("Laporan kerusakan berhasil dibuat");
        fetchReports();
        setIsDialogOpen(false);
      } else {
        toast.error(result.message || "Gagal membuat laporan");
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleUpdateReport = async (id, updateData) => {
    try {
      const result = await reportService.updateDamageReport(id, updateData);

      if (result.status === "success") {
        toast.success("Laporan berhasil diperbarui");
        fetchReports();
        setIsEditDialogOpen(false);
        setEditingReport(null);
      } else {
        toast.error(result.message || "Gagal memperbarui laporan");
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Yakin ingin menghapus laporan ini?")) return;

    try {
      const result = await reportService.deleteDamageReport(id);

      if (result.status === "success") {
        toast.success("Laporan berhasil dihapus");
        fetchReports();
      } else {
        toast.error(result.message || "Gagal menghapus laporan");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || report.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Laporan Kerusakan</h1>
          <p className="text-muted-foreground mt-2">
            {MANAGER_ROLES.includes(user?.role ?? "")
              ? "Kelola laporan kerusakan aset"
              : "Lihat laporan kerusakan yang Anda laporkan"}
          </p>
        </div>
        {canCreateReport && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Lapor Kerusakan
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="size-5 text-muted-foreground" />
              <Input
                placeholder="Cari aset atau pelapor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
              />
              <Button onClick={handleSearchSubmit} variant="outline">
                Cari
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ReportsTable
              reports={filteredReports}
              onUpdate={handleUpdateReport}
              onDelete={handleDeleteReport}
              onEditReport={(report) => {
                setEditingReport(report);
                setIsEditDialogOpen(true);
              }}
              userRole={user?.role}
              canEditReports={canEditReports}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Buat Laporan */}
      {canCreateReport && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lapor Kerusakan Aset</DialogTitle>
              <DialogDescription>
                Laporkan kerusakan yang ditemukan pada aset.
              </DialogDescription>
            </DialogHeader>
            <ReportForm
              assets={assets}
              onSubmit={handleCreateReport}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Edit Laporan (Admin dan Kepala BUF) */}
      {canEditReports && editingReport && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Laporan Kerusakan</DialogTitle>
              <DialogDescription>
                Ubah status dan prioritas laporan kerusakan.
              </DialogDescription>
            </DialogHeader>
            <EditReportForm
              report={editingReport}
              onSubmit={(data) => handleUpdateReport(editingReport.id, data)}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingReport(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ReportsTable({
  reports,
  onUpdate,
  onDelete,
  onEditReport,
  userRole,
  canEditReports,
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto size-12 mb-4" />
        Tidak ada laporan ditemukan
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="rounded-md border">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Aset</TableHead>
              <TableHead className="w-[140px]">Pelapor</TableHead>
              <TableHead className="w-[120px] text-center">Prioritas</TableHead>
              <TableHead className="w-[160px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-center">Tanggal</TableHead>
              <TableHead className="w-[80px] text-center">Detail</TableHead>
              <TableHead className="w-[80px] text-center">Gambar</TableHead>
              {canEditReports && <TableHead className="w-[100px] text-center">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-orange-600" />
                    {report.assetName}
                  </div>
                </TableCell>
                <TableCell>{report.reporterName}</TableCell>
                <TableCell>
                  {canEditReports ? (
                    <Select
                      value={report.priority}
                      onValueChange={(value) =>
                        onUpdate(report.id, { priority: value })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <PriorityBadge value={report.priority} />
                  )}
                </TableCell>
                <TableCell>
                  {canEditReports ? (
                    <Select
                      value={report.status}
                      onValueChange={(value) =>
                        onUpdate(report.id, { status: value })
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge value={report.status} />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(report.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  <ReportDetailDialog report={report} />
                </TableCell>
                {canEditReports && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditReport(report)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(report.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
                <TableCell>
  {report.photoUrl && (
    <img 
      src={report.photoUrl} 
      alt={`Kerusakan ${report.assetName}`}
      className="h-12 w-12 object-cover rounded"
    />
  )}
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const config = STATUS_BADGE_VARIANTS[value] ?? STATUS_BADGE_VARIANTS.menunggu;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function PriorityBadge({ value }) {
  const config =
    PRIORITY_BADGE_VARIANTS[value] ?? PRIORITY_BADGE_VARIANTS.sedang;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function ReportDetailDialog({ report }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 size-4" />
          Lihat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Laporan Kerusakan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Aset</Label>
            <p className="font-medium">{report.assetName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Pelapor</Label>
            <p>{report.reporterName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Prioritas</Label>
            <PriorityBadge value={report.priority} />
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <StatusBadge value={report.status} />
          </div>
          <div>
            <Label className="text-muted-foreground">Deskripsi Kerusakan</Label>
            <p className="whitespace-pre-wrap">{report.description}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Tanggal Dilaporkan</Label>
            <p>{new Date(report.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
          {report.photoUrl && (
            <div>
              <Label className="text-muted-foreground">Foto Kerusakan</Label>
              <ImageWithFallback
                src={report.photoUrl}
                alt={`Foto kerusakan ${report.assetName}`}
                className="mt-2 rounded-md border"
              />
            </div>
          )}
          {report.notes && (
            <div>
              <Label className="text-muted-foreground">Catatan Tambahan</Label>
              <p className="whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportForm({ assets, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    assetId: "",
    description: "",
    priority: "sedang",
    photoUrl: "",
    notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Preview gambar
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload ke server
    try {
      setUploading(true);
      const result = await uploadService.uploadImage(file);

      if (result.status === "success") {
        setFormData((prev) => ({
          ...prev,
          photoUrl: result.data.url,
        }));
        toast.success("Gambar berhasil diunggah");
      } else {
      // Jika upload gagal, gunakan data URL sebagai fallback
      setFormData((prev) => ({
        ...prev,
        photoUrl: reader.result, // data URL
      }));
      toast.warning('Upload ke server gagal, menggunakan preview lokal');
    }
    } catch (error) {
    console.error('Upload error:', error);
    // Fallback ke data URL
    setFormData((prev) => ({
      ...prev,
      photoUrl: reader.result,
    }));
    toast.warning('Menggunakan preview lokal karena upload gagal');
  } finally {
    setUploading(false);
  }
};
  const removeImage = () => {
    setPreview("");
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.assetId) {
      toast.error("Pilih aset terlebih dahulu");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Deskripsi kerusakan harus diisi");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Aset yang Rusak *</Label>
        <Select
          value={formData.assetId}
          onValueChange={(value) =>
            setFormData({ ...formData, assetId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih aset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                {asset.name} ({asset.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* <div className="space-y-2">
        <Label>Prioritas *</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) =>
            setFormData({ ...formData, priority: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}

      <div className="space-y-2">
        <Label>Deskripsi Kerusakan *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Jelaskan kerusakan yang terjadi..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Foto Kerusakan (Opsional)</Label>
        {!preview ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="mx-auto size-12 text-muted-foreground" />
            <div className="mt-4">
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {uploading ? "Mengunggah..." : "Pilih Gambar"}
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, WebP maksimal 5MB
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Catatan Tambahan (Opsional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Tambahkan catatan jika diperlukan..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Kirim Laporan</Button>
      </div>
    </form>
  );
}

function EditReportForm({ report, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    priority: report.priority,
    status: report.status,
    notes: report.notes || "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioritas</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Catatan Tambahan</Label>
        <Textarea
          value={formData.notes}
          onChange={(event) =>
            setFormData({ ...formData, notes: event.target.value })
          }
          placeholder="Tambahkan catatan atau instruksi untuk tim..."
          rows={3}
        />
      </div>

      <div className="bg-muted p-3 rounded-md">
        <h4 className="font-medium mb-2">Informasi Laporan</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Aset:</span>
            <p>{report.assetName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pelapor:</span>
            <p>{report.reporterName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Deskripsi:</span>
            <p className="truncate">{report.description}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tanggal:</span>
            <p>{new Date(report.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan Perubahan</Button>
      </div>
    </form>
  );
}

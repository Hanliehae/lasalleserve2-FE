import { useMemo, useState } from "react";
import { AlertTriangle, Eye, Plus, Search, Edit } from "lucide-react";

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
import { mockDamageReports, mockAssets } from "../lib/mock-data.js";

import { uploadService } from "../lib/services/uploadService";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

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
  const [reports, setReports] = useState(mockDamageReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // const [loading, setLoading] = useState(false);

  // Hanya staf biasa yang bisa membuat laporan
  const canCreateReport = ![
    "staf_buf",
    "admin_buf",
    "kepala_buf",
    "admin",
  ].includes(user?.role ?? "");

  const filteredReports = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return reports.filter((report) => {
      const matchesSearch =
        report.assetName.toLowerCase().includes(keyword) ||
        report.reporterName.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || report.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleStatusChange = (value) => setStatusFilter(value);
  const handlePriorityChange = (value) => setPriorityFilter(value);

  const handleCreateReport = (formData) => {
    const asset = mockAssets.find((item) => item.id === formData.assetId);

    const newReport = {
      id: `r${reports.length + 1}`,
      assetId: formData.assetId ?? "",
      assetName: asset?.name ?? "",
      reportedBy: user?.id ?? "",
      reporterName: user?.name ?? "Pengguna",
      description: formData.description ?? "",
      priority: formData.priority ?? "sedang",
      status: "menunggu",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReports((prev) => [...prev, newReport]);
    setIsDialogOpen(false);
  };

  const handleUpdateStatus = (id, status) => {
    setReports(
      reports.map((r) =>
        r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
      )
    );
  };

  const handleUpdatePriority = (id, priority) => {
    setReports(
      reports.map((r) =>
        r.id === id
          ? { ...r, priority, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedData) => {
    setReports(
      reports.map((r) =>
        r.id === editingReport.id
          ? { ...r, ...updatedData, updatedAt: new Date().toISOString() }
          : r
      )
    );
    setIsEditDialogOpen(false);
    setEditingReport(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Laporan Kerusakan</h1>
          <p className="text-muted-foreground mt-2">
            {["staf_buf", "admin_buf", "kepala_buf", "admin"].includes(
              user?.role ?? ""
            )
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
                onChange={handleSearchChange}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
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
              <Select
                value={priorityFilter}
                onValueChange={handlePriorityChange}
              >
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
          <ReportsTable
            reports={filteredReports}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            onEditReport={handleEditReport}
            userRole={user?.role}
          />
        </CardContent>
      </Card>

      {canCreateReport && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lapor Kerusakan Aset</DialogTitle>
              <DialogDescription>
                Laporkan kerusakan yang ditemukan pada aset.
              </DialogDescription>
            </DialogHeader>
            <ReportForm
              onSubmit={handleCreateReport}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingReport && (
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
              onSubmit={handleSaveEdit}
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
  onUpdateStatus,
  onUpdatePriority,
  onEditReport,
  userRole,
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Tidak ada laporan ditemukan
      </div>
    );
  }

  // Definisikan siapa yang bisa melihat detail
  const canViewDetail = [
    "admin",
    "staf_buf",
    "admin_buf",
    "kepala_buf",
  ].includes(userRole);

  // Hanya kepala_buf yang bisa mengedit prioritas
  const canEditPriority = userRole === "kepala_buf";

  // Hanya kepala_buf yang bisa mengedit status
  const canEditStatus = userRole === "kepala_buf";

  return (
    <div className="overflow-x-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aset</TableHead>
              <TableHead>Pelapor</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              {canViewDetail && <TableHead>Detail</TableHead>}
              {userRole === "kepala_buf" && <TableHead>Aksi</TableHead>}
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
                  {canEditPriority ? (
                    <Select
                      value={report.priority}
                      onValueChange={(value) =>
                        onUpdatePriority(report.id, value)
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
                  {canEditStatus ? (
                    <Select
                      value={report.status}
                      onValueChange={(value) =>
                        onUpdateStatus(report.id, value)
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
                {canViewDetail && (
                  <TableCell>
                    <ReportDetailDialog report={report} />
                  </TableCell>
                )}
                {userRole === "kepala_buf" && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditReport(report)}
                    >
                      <Edit className="size-4" />
                    </Button>
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
          <DetailField label="Aset" value={report.assetName} />
          <DetailField label="Pelapor" value={report.reporterName} />
          <DetailField label="Prioritas">
            <PriorityBadge value={report.priority} />
          </DetailField>
          <DetailField label="Status">
            <StatusBadge value={report.status} />
          </DetailField>
          <DetailField label="Deskripsi" value={report.description} />
          <DetailField
            label="Tanggal Dilaporkan"
            value={new Date(report.createdAt).toLocaleDateString("id-ID")}
          />
          a
          <DetailField
            label="Terakhir Diupdate"
            value={new Date(report.updatedAt).toLocaleDateString("id-ID")}
          />
          {report.photoUrl && (
            <div className="space-y-2">
              <Label>Foto Kerusakan</Label>
              <ImageWithFallback
                src={report.photoUrl}
                alt={`Foto kerusakan ${report.assetName}`}
                className="w-full rounded-md object-cover"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <p className="mt-1 text-sm">{value}</p>
      )}
    </div>
  );
}

function ReportForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    assetId: "",
    description: "",
    photoUrl: "",
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
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengunggah gambar");
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
          placeholder="Contoh: Proyektor LCD 01"
          required
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
          placeholder="Gedung Agustinus"
          required="*"
        />
      </div>

      <div className="space-y-2">
        <Label>Tahun Ajaran</Label>
        <Input
          value={formData.acquisitionYear}
          onChange={(event) =>
            setFormData({ ...formData, acquisitionYear: event.target.value })
          }
          placeholder="Contoh: 2024/2025"
        />
      </div>

      <div className="space-y-2">
        <Label>Semester</Label>
        <Select
          value={formData.semester}
          onValueChange={(value) =>
            setFormData({ ...formData, semester: value })
          }
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

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              description: event.target.value,
            }))
          }
          rows={3}
        />
      </div>

      {/* upload foto kerusakan (opsional) */}
      <div className="space-y-2">
        <Label>Foto Kerusakan (Opsional)</Label>

        {!preview ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
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
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}

// Form Edit untuk Kepala BUF
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
              setFormData((prev) => ({ ...prev, priority: value }))
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
              setFormData((prev) => ({ ...prev, status: value }))
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
        <Label>Catatan Tambahan (Opsional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              notes: event.target.value,
            }))
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

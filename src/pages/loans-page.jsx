import { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/auth-context.jsx";
import { loanService } from "../lib/services/loanService";
import { assetService } from "../lib/services/assetService";

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

const CREATOR_ROLES = ["mahasiswa", "dosen", "staf", "civitas"];
const APPROVER_ROLES = ["staf_buf", "admin_buf"];

const STATUS_BADGES = {
  menunggu: { variant: "secondary", label: "Menunggu" },
  disetujui: { variant: "default", label: "Disetujui" },
  ditolak: { variant: "destructive", label: "Ditolak" },
  selesai: { variant: "outline", label: "Selesai" },
  menunggu_pengembalian: {
    variant: "secondary",
    label: "Menunggu Pengembalian",
  },
};

export function LoansPage() {
  const { user } = useAuth();

  const [loans, setLoans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [isFacilityFormOpen, setIsFacilityFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingLoanId, setUpdatingLoanId] = useState(null);

  const canApprove = APPROVER_ROLES.includes(user?.role ?? "");
  const canCreateLoan = CREATOR_ROLES.includes(user?.role ?? "");

  // Fetch data on component mount
  useEffect(() => {
    fetchLoans();
    fetchAssets();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const result = await loanService.getLoans(searchTerm, statusFilter);

      if (result.status === "success") {
        setLoans(result.data.loans || []);
      } else {
        toast.error(result.message || "Gagal memuat data peminjaman");
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    fetchLoans();
  };

  const handleCreateLoan = async (payload) => {
    try {
      setSubmitting(true);
      console.log("📝 Creating loan with payload:", payload);

      const result = await loanService.createLoan(payload);

      if (result.status === "success") {
        toast.success("Peminjaman berhasil diajukan");
        fetchLoans();
        return true;
      } else {
        toast.error(result.message || "Gagal mengajukan peminjaman");
        return false;
      }
    } catch (error) {
      console.error("Error creating loan:", error);
      toast.error(error.message || "Terjadi kesalahan");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateLoanStatus = async (id, status, notes = "") => {
    try {
      setUpdatingLoanId(id);
      console.log(
        `🔄 Updating loan ${id} status to ${status}`,
        notes ? `with notes: ${notes}` : ""
      );

      const result = await loanService.updateLoanStatus(id, status, notes);

      if (result.status === "success") {
        toast.success(
          `Status peminjaman berhasil diubah menjadi ${
            status === "disetujui" ? "Disetujui" : "Ditolak"
          }`
        );
        fetchLoans();
      } else {
        toast.error(result.message || "Gagal mengubah status peminjaman");
      }
    } catch (error) {
      console.error("Error updating loan status:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengubah status");
    } finally {
      setUpdatingLoanId(null);
    }
  };

  const deleteLoan = async (id) => {
    if (!window.confirm("Yakin ingin menghapus peminjaman ini?")) return;

    try {
      const result = await loanService.deleteLoan(id);

      if (result.status === "success") {
        toast.success("Peminjaman berhasil dihapus");
        fetchLoans();
      } else {
        toast.error(result.message || "Gagal menghapus peminjaman");
      }
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const renderStatusBadge = (status) => {
    const config = STATUS_BADGES[status] ?? STATUS_BADGES.menunggu;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return loans.filter((loan) => {
      const matchesSearch =
        loan.borrowerName?.toLowerCase().includes(keyword) ||
        (loan.roomName && loan.roomName.toLowerCase().includes(keyword)) ||
        loan.facilities?.some((facility) =>
          facility.name?.toLowerCase().includes(keyword)
        );

      const matchesStatus =
        statusFilter === "all" || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Peminjaman Aset</h1>
          <p className="text-muted-foreground mt-2">
            {canApprove
              ? "Kelola permintaan peminjaman aset"
              : "Ajukan dan lihat status peminjaman Anda"}
          </p>
        </div>

        {canCreateLoan && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Pinjam Ruangan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajukan Peminjaman Ruangan</DialogTitle>
                  <DialogDescription>
                    Lengkapi form berikut untuk mengajukan peminjaman ruangan
                    beserta fasilitas pendukungnya.
                  </DialogDescription>
                </DialogHeader>
                <RoomLoanForm
                  assets={assets}
                  onSubmit={async (payload) => {
                    const success = await handleCreateLoan(payload);
                    if (success) {
                      setIsRoomFormOpen(false);
                    }
                  }}
                  onCancel={() => setIsRoomFormOpen(false)}
                  submitting={submitting}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isFacilityFormOpen}
              onOpenChange={setIsFacilityFormOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 size-4" />
                  Pinjam Fasilitas
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajukan Peminjaman Fasilitas</DialogTitle>
                  <DialogDescription>
                    Ajukan peminjaman fasilitas untuk menunjang kegiatan Anda.
                  </DialogDescription>
                </DialogHeader>
                <FacilityLoanForm
                  assets={assets}
                  onSubmit={async (payload) => {
                    const success = await handleCreateLoan(payload);
                    if (success) {
                      setIsFacilityFormOpen(false);
                    }
                  }}
                  onCancel={() => setIsFacilityFormOpen(false)}
                  submitting={submitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="size-5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari aset atau peminjam..."
                className="max-w-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") fetchLoans();
                }}
              />
              <Button onClick={fetchLoans} variant="outline">
                Cari
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status peminjaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="disetujui">Disetujui</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="menunggu_pengembalian">
                  Menunggu Pengembalian
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canApprove && <TableHead>Peminjam</TableHead>}
                    <TableHead>Detail Aset</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={canApprove ? 6 : 5}
                        className="text-center text-muted-foreground py-8"
                      >
                        {loans.length === 0
                          ? "Belum ada data peminjaman"
                          : "Tidak ada peminjaman yang cocok dengan filter"}
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      {canApprove && (
                        <TableCell>
                          <div className="font-medium">{loan.borrowerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {loan.borrowerEmail}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <LoanAssetDetails loan={loan} />
                      </TableCell>
                      <TableCell>
                        <LoanDate
                          value={loan.startDate}
                          time={loan.startTime}
                        />
                      </TableCell>
                      <TableCell>
                        <LoanDate value={loan.endDate} time={loan.endTime} />
                      </TableCell>
                      <TableCell>{renderStatusBadge(loan.status)}</TableCell>
                      {canApprove && (
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {loan.status === "menunggu" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const notes = prompt(
                                      "Masukkan catatan persetujuan (opsional):",
                                      ""
                                    );
                                    if (notes !== null) {
                                      updateLoanStatus(
                                        loan.id,
                                        "disetujui",
                                        notes
                                      );
                                    }
                                  }}
                                  disabled={updatingLoanId === loan.id}
                                >
                                  {updatingLoanId === loan.id ? (
                                    <Loader2 className="mr-1 size-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-1 size-4 text-green-600" />
                                  )}
                                  {updatingLoanId === loan.id
                                    ? "Memproses..."
                                    : "Setuju"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const notes = prompt(
                                      "Masukkan alasan penolakan:",
                                      ""
                                    );
                                    if (notes !== null) {
                                      updateLoanStatus(
                                        loan.id,
                                        "ditolak",
                                        notes
                                      );
                                    }
                                  }}
                                  disabled={updatingLoanId === loan.id}
                                >
                                  {updatingLoanId === loan.id ? (
                                    <Loader2 className="mr-1 size-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-1 size-4 text-red-600" />
                                  )}
                                  {updatingLoanId === loan.id
                                    ? "Memproses..."
                                    : "Tolak"}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLoan(loan.id)}
                              disabled={updatingLoanId === loan.id}
                            >
                              <Trash2 className="mr-1 size-4 text-gray-600" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Komponen untuk menampilkan detail aset dalam tabel
function LoanAssetDetails({ loan }) {
  return (
    <div className="space-y-1">
      {loan.roomName && <p className="font-medium">Ruangan: {loan.roomName}</p>}
      {loan.facilities && loan.facilities.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Fasilitas:</p>
          <ul className="list-inside list-disc">
            {loan.facilities.map((facility, index) => (
              <li key={index}>
                {facility.name} ({facility.quantity}x)
              </li>
            ))}
          </ul>
        </div>
      )}
      {loan.purpose && (
        <p className="text-sm text-muted-foreground">
          Keperluan: {loan.purpose}
        </p>
      )}
    </div>
  );
}

// Komponen untuk menampilkan tanggal
function LoanDate({ value, time }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-2">
      <Calendar className="size-4 text-muted-foreground" />
      <div>
        <div>{new Date(value).toLocaleDateString("id-ID")}</div>
        {time && <div className="text-sm text-muted-foreground">{time}</div>}
      </div>
    </div>
  );
}

// Form untuk peminjaman ruangan
function RoomLoanForm({ assets, onSubmit, onCancel, submitting }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    roomId: "",
    roomName: "",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "17:00",
    purpose: "",
    facilities: [],
    academicYear: loanService.getAcademicYear(),
    semester: loanService.getSemesterFromDate(new Date()),
  });
  const [facilitySearch, setFacilitySearch] = useState("");
  const [errors, setErrors] = useState({});

  // Filter hanya ruangan
  const availableRooms = useMemo(() => {
    return assets.filter((asset) => asset.category === "ruangan");
  }, [assets]);

  // Filter fasilitas yang available
  const availableFacilities = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.category === "fasilitas" &&
        asset.availableStock > 0 &&
        asset.name.toLowerCase().includes(facilitySearch.toLowerCase())
    );
  }, [assets, facilitySearch]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roomId) newErrors.room = "Ruangan harus dipilih";
    if (!formData.startDate) newErrors.startDate = "Tanggal mulai harus diisi";
    if (!formData.endDate) newErrors.endDate = "Tanggal selesai harus diisi";

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.date = "Tanggal selesai tidak boleh sebelum tanggal mulai";
      }
    }

    if (!formData.purpose.trim()) newErrors.purpose = "Keperluan harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Harap perbaiki error di form");
      return;
    }

    const payload = {
      roomId: formData.roomId,
      facilities: formData.facilities.map((f) => ({
        id: f.id,
        quantity: f.quantity,
      })),
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose,
      academicYear: formData.academicYear,
      semester: formData.semester,
    };

    const success = await onSubmit(payload);
    if (success) {
      setFormData({
        roomId: "",
        roomName: "",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "08:00",
        endDate: new Date().toISOString().split("T")[0],
        endTime: "17:00",
        purpose: "",
        facilities: [],
        academicYear: loanService.getAcademicYear(),
        semester: loanService.getSemesterFromDate(new Date()),
      });
      setErrors({});
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleRoomChange = (roomId) => {
    const selectedRoom = availableRooms.find((room) => room.id === roomId);
    setFormData((prev) => ({
      ...prev,
      roomId,
      roomName: selectedRoom?.name ?? "",
    }));
    if (errors.room) setErrors((prev) => ({ ...prev, room: "" }));
  };

  const addFacility = (facility) => {
    // Check stock availability
    if (facility.availableStock <= 0) {
      toast.error(`Stok ${facility.name} tidak tersedia`);
      return;
    }

    setFormData((prev) => {
      const existing = prev.facilities.find((item) => item.id === facility.id);

      if (existing) {
        // If already exists, increase quantity if stock allows
        const newQuantity = existing.quantity + 1;
        if (newQuantity > facility.availableStock) {
          toast.error(`Stok ${facility.name} tidak mencukupi`);
          return prev;
        }

        return {
          ...prev,
          facilities: prev.facilities.map((item) =>
            item.id === facility.id ? { ...item, quantity: newQuantity } : item
          ),
        };
      }

      // Add new facility
      return {
        ...prev,
        facilities: [
          ...prev.facilities,
          { id: facility.id, name: facility.name, quantity: 1 },
        ],
      };
    });
    setFacilitySearch("");
  };

  const removeFacility = (facilityId) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((item) => item.id !== facilityId),
    }));
  };

  const updateFacilityQuantity = (facilityId, quantity) => {
    const facility = assets.find((a) => a.id === facilityId);
    const parsedQuantity = parseInt(quantity) || 1;

    if (facility && parsedQuantity > facility.availableStock) {
      toast.error(`Stok ${facility.name} tidak mencukupi`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.map((item) =>
        item.id === facilityId
          ? { ...item, quantity: Math.max(1, parsedQuantity) }
          : item
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Ruangan *</Label>
        <Select value={formData.roomId} onValueChange={handleRoomChange}>
          <SelectTrigger className={errors.room ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih ruangan" />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name} ({room.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.room && <p className="text-sm text-red-500">{errors.room}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Mulai *</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(event) =>
              handleFieldChange("startDate", event.target.value)
            }
            className={errors.startDate ? "border-red-500" : ""}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Waktu Mulai</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(event) =>
              handleFieldChange("startTime", event.target.value)
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Selesai *</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(event) =>
              handleFieldChange("endDate", event.target.value)
            }
            className={errors.endDate ? "border-red-500" : ""}
            min={formData.startDate}
          />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Waktu Selesai</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(event) =>
              handleFieldChange("endTime", event.target.value)
            }
          />
        </div>
      </div>

      {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}

      <div className="space-y-2">
        <Label>Keperluan Peminjaman *</Label>
        <Textarea
          placeholder="Tuliskan keperluan peminjaman ruangan"
          value={formData.purpose}
          onChange={(event) => handleFieldChange("purpose", event.target.value)}
          rows={3}
          className={errors.purpose ? "border-red-500" : ""}
        />
        {errors.purpose && (
          <p className="text-sm text-red-500">{errors.purpose}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Cari Fasilitas Tambahan (Opsional)</Label>
        <Input
          placeholder="Cari fasilitas..."
          value={facilitySearch}
          onChange={(event) => setFacilitySearch(event.target.value)}
        />

        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
          {availableFacilities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Fasilitas tidak ditemukan.
            </p>
          )}

          {availableFacilities.map((facility) => (
            <div
              key={facility.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{facility.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stok tersedia: {facility.availableStock} | Lokasi:{" "}
                  {facility.location}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => addFacility(facility)}
              >
                Tambahkan
              </Button>
            </div>
          ))}
        </div>

        {formData.facilities.length > 0 && (
          <div className="space-y-2">
            <Label>Fasilitas Terpilih</Label>
            <div className="space-y-2 rounded-md border p-3">
              {formData.facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex flex-wrap items-center gap-3 rounded-md bg-muted/40 p-3"
                >
                  <div className="flex-grow">
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Kode: {facility.id}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={facility.quantity}
                    onChange={(event) =>
                      updateFacilityQuantity(facility.id, event.target.value)
                    }
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFacility(facility.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengajukan...
            </>
          ) : (
            "Ajukan Peminjaman"
          )}
        </Button>
      </div>
    </form>
  );
}

// Form untuk peminjaman fasilitas
function FacilityLoanForm({ assets, onSubmit, onCancel, submitting }) {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "17:00",
    purpose: "",
    facilities: [],
    academicYear: loanService.getAcademicYear(),
    semester: loanService.getSemesterFromDate(new Date()),
  });

  const [facilitySearch, setFacilitySearch] = useState("");
  const [errors, setErrors] = useState({});

  const availableFacilities = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.category === "fasilitas" &&
        asset.availableStock > 0 &&
        asset.name.toLowerCase().includes(facilitySearch.toLowerCase())
    );
  }, [assets, facilitySearch]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startDate) newErrors.startDate = "Tanggal mulai harus diisi";
    if (!formData.endDate) newErrors.endDate = "Tanggal selesai harus diisi";

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.date = "Tanggal selesai tidak boleh sebelum tanggal mulai";
      }
    }

    if (!formData.purpose.trim()) newErrors.purpose = "Keperluan harus diisi";

    if (formData.facilities.length === 0) {
      newErrors.facilities = "Minimal pilih satu fasilitas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Harap perbaiki error di form");
      return;
    }

    const payload = {
      roomId: null,
      facilities: formData.facilities.map((f) => ({
        id: f.id,
        quantity: f.quantity,
      })),
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose,
      academicYear: formData.academicYear,
      semester: formData.semester,
    };

    const success = await onSubmit(payload);
    if (success) {
      setFormData({
        startDate: new Date().toISOString().split("T")[0],
        startTime: "08:00",
        endDate: new Date().toISOString().split("T")[0],
        endTime: "17:00",
        purpose: "",
        facilities: [],
        academicYear: loanService.getAcademicYear(),
        semester: loanService.getSemesterFromDate(new Date()),
      });
      setErrors({});
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addFacility = (facility) => {
    // Check stock availability
    if (facility.availableStock <= 0) {
      toast.error(`Stok ${facility.name} tidak tersedia`);
      return;
    }

    setFormData((prev) => {
      const existing = prev.facilities.find((item) => item.id === facility.id);

      if (existing) {
        // If already exists, increase quantity if stock allows
        const newQuantity = existing.quantity + 1;
        if (newQuantity > facility.availableStock) {
          toast.error(`Stok ${facility.name} tidak mencukupi`);
          return prev;
        }

        return {
          ...prev,
          facilities: prev.facilities.map((item) =>
            item.id === facility.id ? { ...item, quantity: newQuantity } : item
          ),
        };
      }

      // Add new facility
      return {
        ...prev,
        facilities: [
          ...prev.facilities,
          { id: facility.id, name: facility.name, quantity: 1 },
        ],
      };
    });
    setFacilitySearch("");
  };

  const removeFacility = (facilityId) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((item) => item.id !== facilityId),
    }));
  };

  const updateFacilityQuantity = (facilityId, quantity) => {
    const facility = assets.find((a) => a.id === facilityId);
    const parsedQuantity = parseInt(quantity) || 1;

    if (facility && parsedQuantity > facility.availableStock) {
      toast.error(`Stok ${facility.name} tidak mencukupi`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.map((item) =>
        item.id === facilityId
          ? { ...item, quantity: Math.max(1, parsedQuantity) }
          : item
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Mulai *</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(event) =>
              handleFieldChange("startDate", event.target.value)
            }
            className={errors.startDate ? "border-red-500" : ""}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Waktu Mulai</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(event) =>
              handleFieldChange("startTime", event.target.value)
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Selesai *</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(event) =>
              handleFieldChange("endDate", event.target.value)
            }
            className={errors.endDate ? "border-red-500" : ""}
            min={formData.startDate}
          />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Waktu Selesai</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(event) =>
              handleFieldChange("endTime", event.target.value)
            }
          />
        </div>
      </div>

      {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}

      <div className="space-y-2">
        <Label>Keperluan Peminjaman *</Label>
        <Textarea
          placeholder="Tuliskan keperluan peminjaman fasilitas"
          value={formData.purpose}
          onChange={(event) => handleFieldChange("purpose", event.target.value)}
          rows={3}
          className={errors.purpose ? "border-red-500" : ""}
        />
        {errors.purpose && (
          <p className="text-sm text-red-500">{errors.purpose}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Cari Fasilitas *</Label>
        <Input
          placeholder="Cari fasilitas..."
          value={facilitySearch}
          onChange={(event) => setFacilitySearch(event.target.value)}
        />

        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
          {availableFacilities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Fasilitas tidak ditemukan.
            </p>
          )}

          {availableFacilities.map((facility) => (
            <div
              key={facility.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{facility.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stok tersedia: {facility.availableStock} | Lokasi:{" "}
                  {facility.location}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => addFacility(facility)}
              >
                Tambahkan
              </Button>
            </div>
          ))}
        </div>

        {formData.facilities.length > 0 && (
          <div className="space-y-2">
            <Label>Fasilitas Terpilih</Label>
            <div className="space-y-2 rounded-md border p-3">
              {formData.facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex flex-wrap items-center gap-3 rounded-md bg-muted/40 p-3"
                >
                  <div className="flex-grow">
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Kode: {facility.id}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={facility.quantity}
                    onChange={(event) =>
                      updateFacilityQuantity(facility.id, event.target.value)
                    }
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFacility(facility.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {errors.facilities && (
          <p className="text-sm text-red-500">{errors.facilities}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengajukan...
            </>
          ) : (
            "Ajukan Peminjaman"
          )}
        </Button>
      </div>
    </form>
  );
}

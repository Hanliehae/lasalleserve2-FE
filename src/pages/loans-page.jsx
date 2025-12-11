import { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  XCircle,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Clock,
  AlertTriangle,
  Filter,
  BarChart3,
  Eye
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/auth-context.jsx";
import { loanService } from "../lib/services/loanService";
import { assetService } from "../lib/services/assetService";
import { uploadService } from "../lib/services/uploadService";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const CREATOR_ROLES = ["mahasiswa", "dosen", "staf", "civitas"];
const APPROVER_ROLES = ["staf_buf", "admin_buf"];

const STATUS_BADGES = {
  menunggu: { variant: "secondary", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  disetujui: { variant: "default", label: "Disetujui", color: "bg-green-100 text-green-800" },
  ditolak: { variant: "destructive", label: "Ditolak", color: "bg-red-100 text-red-800" },
  selesai: { variant: "outline", label: "Selesai", color: "bg-gray-100 text-gray-800" },
  menunggu_pengembalian: {
    variant: "secondary",
    label: "Menunggu Pengembalian",
    color: "bg-yellow-100 text-yellow-800"
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
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const canApprove = APPROVER_ROLES.includes(user?.role ?? "");
  const canCreateLoan = CREATOR_ROLES.includes(user?.role ?? "");

  useEffect(() => {
    fetchLoans();
    fetchAssets();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const result = await loanService.getLoans(searchTerm, statusFilter);

      if (result.status === "success") {
        // Sort loans berdasarkan priority order (sudah dari backend, tapi kita sort lagi untuk memastikan)
        const sortedLoans = [...result.data.loans].sort((a, b) => {
          const priorityOrder = {
            'menunggu': 1,
            'disetujui': 2,
            'menunggu_pengembalian': 3,
            'selesai': 4,
            'ditolak': 5
          };
          
          const aPriority = priorityOrder[a.status] || 6;
          const bPriority = priorityOrder[b.status] || 6;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setLoans(sortedLoans);
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
    if (value === 'menunggu') {
      setShowOnlyNew(true);
    } else {
      setShowOnlyNew(false);
    }
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

  const renderStatusBadge = (status, isNew = false) => {
    const config = STATUS_BADGES[status] ?? STATUS_BADGES.menunggu;
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className={config.color}>
            {config.label}
          </Badge>
          {isNew && status === 'menunggu' && (
            <Badge variant="default" className="bg-green-600 animate-pulse text-xs">
              BARU
            </Badge>
          )}
        </div>
        {isNew && status === 'menunggu' && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            <span>Dalam 24 jam</span>
          </div>
        )}
      </div>
    );
  };

  const filteredLoans = useMemo(() => {
    let filtered = loans.filter((loan) => {
      const keyword = searchTerm.toLowerCase();
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

    // Filter untuk hanya menampilkan yang baru (menunggu dan created_at dalam 24 jam)
    if (showOnlyNew) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(loan => 
        loan.status === 'menunggu' && 
        new Date(loan.createdAt) > twentyFourHoursAgo
      );
    }

    // Urutkan berdasarkan priority
    return filtered.sort((a, b) => {
      const priorityOrder = {
        'menunggu': 1,
        'disetujui': 2,
        'menunggu_pengembalian': 3,
        'selesai': 4,
        'ditolak': 5
      };
      
      const aPriority = priorityOrder[a.status] || 6;
      const bPriority = priorityOrder[b.status] || 6;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [loans, searchTerm, statusFilter, showOnlyNew]);

  // Hitung statistik
  const stats = useMemo(() => ({
    menunggu: loans.filter(l => l.status === 'menunggu').length,
    disetujui: loans.filter(l => l.status === 'disetujui').length,
    menungguPengembalian: loans.filter(l => l.status === 'menunggu_pengembalian').length,
    selesai: loans.filter(l => l.status === 'selesai').length,
    ditolak: loans.filter(l => l.status === 'ditolak').length,
    baru: loans.filter(l => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return l.status === 'menunggu' && new Date(l.createdAt) > twentyFourHoursAgo;
    }).length
  }), [loans]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Peminjaman Aset</h1>
          <p className="text-muted-foreground mt-2">
            {canApprove
              ? "Kelola dan validasi permintaan peminjaman aset"
              : "Ajukan dan lihat status peminjaman Anda"}
          </p>
        </div>

        {canCreateLoan && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500hover:bg-yellow-700">
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

      {/* STATISTIK CEPAT */}
      {canApprove && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.menunggu}</div>
                <div className="text-sm text-muted-foreground">Menunggu</div>
                {stats.baru > 0 && (
                  <div className="text-xs text-green-600 mt-1">({stats.baru} baru)</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.disetujui}</div>
                <div className="text-sm text-muted-foreground">Disetujui</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.menungguPengembalian}</div>
                <div className="text-sm text-muted-foreground">Menunggu Kembali</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.selesai}</div>
                <div className="text-sm text-muted-foreground">Selesai</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.ditolak}</div>
                <div className="text-sm text-muted-foreground">Ditolak</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{loans.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
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
              
              {canApprove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newShowOnlyNew = !showOnlyNew;
                    setShowOnlyNew(newShowOnlyNew);
                    if (newShowOnlyNew) {
                      setStatusFilter('menunggu');
                    } else {
                      setStatusFilter('all');
                    }
                  }}
                  className={showOnlyNew ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}
                >
                  <AlertTriangle className="mr-2 size-4" />
                  {showOnlyNew ? 'Semua Status' : 'Hanya Menunggu'}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status peminjaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center justify-between w-full">
                      <span>Semua Status</span>
                      {stats.menunggu > 0 && (
                        <Badge variant="default" className="ml-2 bg-yellow-500">
                          {stats.menunggu}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="menunggu">
                    <div className="flex items-center justify-between w-full">
                      <span>Menunggu</span>
                      <Badge variant="default" className="ml-2 bg-yellow-500">
                        {stats.menunggu}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="disetujui">
                    <div className="flex items-center justify-between w-full">
                      <span>Disetujui</span>
                      <Badge variant="default" className="ml-2 bg-green-500">
                        {stats.disetujui}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="menunggu_pengembalian">
                    <div className="flex items-center justify-between w-full">
                      <span>Menunggu Pengembalian</span>
                      <Badge variant="default" className="ml-2 bg-blue-500">
                        {stats.menungguPengembalian}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Memuat data peminjaman...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {canApprove && (
                        <TableHead className="w-[280px]">
                          <div className="flex flex-col">
                            <span>Peminjam</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {showOnlyNew ? 'Hanya menampilkan peminjaman baru' : 'Semua peminjaman'}
                            </span>
                          </div>
                        </TableHead>
                      )}
                      <TableHead>
                        <div className="flex flex-col">
                          <span>Detail Aset</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            Ruangan & Fasilitas
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex flex-col">
                          <span>Tanggal Mulai</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            & Waktu
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex flex-col">
                          <span>Tanggal Selesai</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            & Waktu
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <span>Status</span>
                          <div className="flex flex-col text-[10px] leading-tight">
                            <span className="text-yellow-600">• Menunggu</span>
                            <span className="text-green-600">• Disetujui</span>
                            <span className="text-blue-600">• Menunggu Kembali</span>
                          </div>
                        </div>
                      </TableHead>
                      {canApprove && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={canApprove ? 6 : 5}
                          className="text-center text-muted-foreground py-12"
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            {showOnlyNew ? (
                              <>
                                <AlertCircle className="h-12 w-12 text-yellow-500" />
                                <div>
                                  <p className="font-medium">Tidak ada peminjaman baru</p>
                                  <p className="text-sm mt-1">
                                    Semua permintaan peminjaman sudah divalidasi
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowOnlyNew(false);
                                    setStatusFilter('all');
                                  }}
                                >
                                  Lihat Semua Peminjaman
                                </Button>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-12 w-12 text-gray-400" />
                                <div>
                                  <p className="font-medium">Tidak ada data peminjaman</p>
                                  <p className="text-sm mt-1">
                                    {loans.length === 0
                                      ? "Belum ada data peminjaman"
                                      : "Tidak ada peminjaman yang cocok dengan filter"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {filteredLoans.map((loan) => {
                      // Tentukan apakah loan baru (dibuat dalam 24 jam terakhir)
                      const isNewLoan = (() => {
                        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return loan.status === 'menunggu' && new Date(loan.createdAt) > twentyFourHoursAgo;
                      })();
                      
                      // Tentukan class untuk highlight row baru
                      const rowClass = isNewLoan ? 'bg-yellow-50 hover:bg-yellow-100' : '';

                      return (
                        <TableRow key={loan.id} className={rowClass}>
                          {canApprove && (
                            <TableCell>
                              <div className="space-y-2">
                                <div>
                                  <p className="font-medium">{loan.borrowerName}</p>
                                  <p className="text-sm text-muted-foreground">{loan.borrowerEmail}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="size-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Diajukan: {new Date(loan.createdAt).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                                
                                {isNewLoan && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                      <Clock className="mr-1 size-3" /> Permintaan Baru
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <LoanAssetDetails loan={loan} />
                          </TableCell>
                          <TableCell>
                            <LoanDate value={loan.startDate} time={loan.startTime} />
                          </TableCell>
                          <TableCell>
                            <LoanDate value={loan.endDate} time={loan.endTime} />
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(loan.status, isNewLoan)}
                          </TableCell>
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
                                      className="bg-green-50 hover:bg-green-100 text-green-700"
                                    >
                                      {updatingLoanId === loan.id ? (
                                        <Loader2 className="mr-1 size-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="mr-1 size-4" />
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
                                      className="bg-red-50 hover:bg-red-100 text-red-700"
                                    >
                                      {updatingLoanId === loan.id ? (
                                        <Loader2 className="mr-1 size-4 animate-spin" />
                                      ) : (
                                        <XCircle className="mr-1 size-4" />
                                      )}
                                      {updatingLoanId === loan.id
                                        ? "Memproses..."
                                        : "Tolak"}
                                    </Button>
                                  </>
                                )}
                                
                                {loan.status === "menunggu" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (window.confirm("Yakin ingin menghapus peminjaman ini?")) {
                                        deleteLoan(loan.id);
                                      }
                                    }}
                                    disabled={updatingLoanId === loan.id}
                                    className="text-gray-600"
                                  >
                                    <Trash2 className="mr-1 size-4" />
                                    Hapus
                                  </Button>
                                )}
                                
                                {(loan.status === "disetujui" || loan.status === "menunggu_pengembalian") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const notes = prompt(
                                        "Masukkan catatan untuk status 'menunggu pengembalian':",
                                        ""
                                      );
                                      if (notes !== null) {
                                        updateLoanStatus(
                                          loan.id,
                                          "menunggu_pengembalian",
                                          notes
                                        );
                                      }
                                    }}
                                    disabled={updatingLoanId === loan.id}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                                  >
                                    <Clock className="mr-1 size-4" />
                                    Tandai Menunggu Kembali
                                  </Button>
                                )}
                                
                                {loan.status === "menunggu_pengembalian" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const notes = prompt(
                                        "Masukkan catatan penyelesaian:",
                                        ""
                                      );
                                      if (notes !== null) {
                                        updateLoanStatus(
                                          loan.id,
                                          "selesai",
                                          notes
                                        );
                                      }
                                    }}
                                    disabled={updatingLoanId === loan.id}
                                    className="bg-gray-50 hover:bg-gray-100 text-gray-700"
                                  >
                                    <CheckCircle className="mr-1 size-4" />
                                    Selesaikan
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* FOOTER STATISTIK */}
              {filteredLoans.length > 0 && canApprove && (
                <div className="border-t bg-muted/30 px-6 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Menunggu: {filteredLoans.filter(l => l.status === 'menunggu').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Disetujui: {filteredLoans.filter(l => l.status === 'disetujui').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Menunggu Kembali: {filteredLoans.filter(l => l.status === 'menunggu_pengembalian').length}</span>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      Total ditampilkan: {filteredLoans.length}
                    </div>
                  </div>
                </div>
              )}
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
    <div className="space-y-2">
      {loan.roomName && (
        <div className="flex items-start gap-2">
          <div className="bg-blue-100 p-1.5 rounded-md">
            <svg className="size-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Ruangan: {loan.roomName}</p>
            <p className="text-xs text-muted-foreground">Ruangan utama</p>
          </div>
        </div>
      )}
      {loan.facilities && loan.facilities.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Fasilitas Pendukung:</p>
          <ul className="space-y-1">
            {loan.facilities.map((facility, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="bg-green-100 p-1 rounded">
                  <svg className="size-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>{facility.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {facility.quantity}x
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {loan.purpose && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Keperluan:</p>
          <p className="text-sm line-clamp-2">{loan.purpose}</p>
        </div>
      )}
    </div>
  );
}

// Komponen untuk menampilkan tanggal
function LoanDate({ value, time }) {
  if (!value) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="font-medium">{new Date(value).toLocaleDateString("id-ID")}</span>
      </div>
      {time && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-3" />
          <span>{time}</span>
        </div>
      )}
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
    attachmentUrl: "",
  });
  const [facilitySearch, setFacilitySearch] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [errors, setErrors] = useState({});

  // Fungsi untuk membandingkan waktu - diperbaiki
  const isAfter5PM = (timeStr) => {
    if (!timeStr) return false;
    const [hours, minutes] = timeStr.split(":").map(Number);
    // Menggunakan >= 17:00 (jam 5 sore atau lebih)
    return hours >= 17;
  };

  const requiresPermissionLetter = isAfter5PM(formData.endTime);

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

    // Validasi surat izin untuk peminjaman di atas jam 17:00
    if (requiresPermissionLetter && !formData.attachmentUrl) {
      newErrors.attachment =
        "Surat izin wajib dilampirkan untuk peminjaman di atas jam 17:00";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Format dokumen tidak valid. Gunakan PDF atau gambar (JPG/PNG)."
      );
      return;
    }

    // validasi ukuran file maksimal 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran dokumen maksimal 5MB.");
      return;
    }

    // Simpan file untuk diupload nanti saat submit
    setAttachmentFile(file);
    setErrors((prev) => ({ ...prev, attachment: "" }));

    // Generate preview untuk semua tipe file
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      // Untuk PDF, tampilkan ikon dengan nama file
      setAttachmentPreview("pdf");
    } else {
      setAttachmentPreview("");
    }

    toast.success("File berhasil dipilih. Akan diunggah saat mengajukan peminjaman.");
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview("");
    setFormData((prev) => ({ ...prev, attachmentUrl: "" }));
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    toast.error("Harap perbaiki error pada formulir");
    return;
  }

  let attachmentUrl = null;

  // Upload file jika ada attachment yang perlu diunggah
  if (attachmentFile && requiresPermissionLetter) {
    try {
      setUploadingAttachment(true);
      toast.info("Mengunggah surat izin...");
      
      const uploadResult = await uploadService.uploadImage(attachmentFile);
      
      if (uploadResult.status === "success") {
        attachmentUrl = uploadResult.data.url;
        toast.success("Surat izin berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah surat izin");
        setUploadingAttachment(false);
        return;
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengunggah surat izin: " + error.message);
      setUploadingAttachment(false);
      return;
    } finally {
      setUploadingAttachment(false);
    }
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
    attachmentUrl: attachmentUrl,
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
    setAttachmentFile(null);
    setAttachmentPreview("");
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

          {requiresPermissionLetter && (
            <div className="flex items-center gap-2 mt-1 text-amber-600 text-sm">
              <AlertCircle className="size-4" />
              <span>Wajib melampirkan surat izin</span>
            </div>
          )}
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="attachment">
            Surat Izin {requiresPermissionLetter && "(Wajib)"}
          </Label>
          {requiresPermissionLetter && (
            <Badge variant="destructive" className="text-xs">
              Wajib
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          Format: JPG, PNG, PDF (Maks. 5MB)
          {requiresPermissionLetter &&
            " - Wajib diisi untuk peminjaman di atas jam 17:00"}
        </div>

        {!attachmentFile ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
            <Upload className="mx-auto size-12 text-muted-foreground mb-4" />
            <div className="mt-4">
              <Label
                htmlFor="attachment-upload"
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
                  requiresPermissionLetter
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {uploadingAttachment ? "Mengunggah..." : "Pilih File Surat"}
              </Label>
              <Input
                id="attachment-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleAttachmentChange}
                className="hidden"
                disabled={uploadingAttachment}
              />
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-8 text-blue-600" />
                <div>
                  <p className="font-medium">{attachmentFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeAttachment}
                disabled={uploadingAttachment}
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </div>

            {attachmentPreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                {attachmentPreview === "pdf" ? (
                  <div className="flex flex-col items-center justify-center py-4 bg-muted/30 rounded-lg">
                    <FileText className="size-16 text-red-500 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Dokumen PDF</p>
                    <p className="text-xs text-muted-foreground">{attachmentFile?.name}</p>
                  </div>
                ) : (
                  <img
                    src={attachmentPreview}
                    alt="Preview surat izin"
                    className="max-h-48 mx-auto rounded border"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {errors.attachment && (
          <p className="text-sm text-red-500">{errors.attachment}</p>
        )}
      </div>

      {/* Alert informasi - file siap diupload */}
      {requiresPermissionLetter && attachmentFile && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="size-5" />
            <span className="font-medium">Surat izin siap diunggah</span>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            File akan diunggah bersamaan saat Anda menekan tombol "Ajukan Peminjaman".
          </p>
        </div>
      )}

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

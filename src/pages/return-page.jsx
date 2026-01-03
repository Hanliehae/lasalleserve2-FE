// src/pages/return-page.jsx - PERBAIKI (hapus import yang tidak perlu dan perbaiki service)
import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  CheckCircle,
  Search,
  Package,
  User,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/auth-context.jsx";
import { loanService } from "../lib/services/loanService";
import { assetService } from "../lib/services/assetService";
import { returnService } from "../lib/services/returnService"; // Gunakan returnService

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
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";

const APPROVER_ROLES = ["staf_buf", "admin_buf"];

export function ReturnPage() {
  const { user } = useAuth();
  const [pendingReturns, setPendingReturns] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [returnData, setReturnData] = useState({
    returnedItems: [],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    today: 0,
  });

  const canApprove = APPROVER_ROLES.includes(user?.role ?? "");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // src/pages/return-page.jsx - PERBAIKI fungsi fetchData
  const fetchData = async () => {
    try {
      setLoading(true);

      if (statusFilter === "pending") {
        const result = await returnService.getPendingReturns();

        // Handle jika response error
        if (result.status === "error") {
          console.error("Error from service:", result.message);
          toast.error(result.message);
          setPendingReturns([]);
          setStats({ total: 0, overdue: 0, today: 0 });
        } else if (result.status === "success") {
          setPendingReturns(result.data.loans || []);
          setStats(result.data.stats || { total: 0, overdue: 0, today: 0 });
        } else {
          // Handle response format yang tidak dikenali
          toast.error("Format data tidak valid");
          setPendingReturns([]);
          setStats({ total: 0, overdue: 0, today: 0 });
        }
      } else if (statusFilter === "history") {
        const result = await returnService.getReturnHistory();

        if (result.status === "error") {
          console.error("Error from service:", result.message);
          toast.error(result.message);
          setReturnHistory([]);
        } else if (result.status === "success") {
          setReturnHistory(result.data.returns || []);
        }
      }

      // Ambil data aset untuk referensi
      try {
        const assetsResult = await assetService.getAssets();
        if (assetsResult.status === "success") {
          setAssets(assetsResult.data.assets || []);
        }
      } catch (assetError) {
        console.error("Error fetching assets:", assetError);
        // Lanjutkan tanpa data aset
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Terjadi kesalahan saat memuat data");

      // Set data kosong untuk mencegah crash
      setPendingReturns([]);
      setReturnHistory([]);
      setStats({ total: 0, overdue: 0, today: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    const data = statusFilter === "pending" ? pendingReturns : returnHistory;

    return data.filter((loan) => {
      const matchesSearch =
        loan.borrowerName?.toLowerCase().includes(keyword) ||
        (loan.roomName && loan.roomName.toLowerCase().includes(keyword)) ||
        loan.facilities?.some((f) => f.name?.toLowerCase().includes(keyword));

      return matchesSearch;
    });
  }, [pendingReturns, returnHistory, searchTerm, statusFilter]);

  // const getLoanStatus = (loan) => {
  //   const today = new Date().toISOString().split("T")[0];
  //   const endDate = loan.endDate;
  //   const isOverdue =
  //     loan.isOverdue ||
  //     (endDate && endDate < today && loan.status !== "selesai");

  //   if (loan.status === "selesai") {
  //     return {
  //       type: "returned",
  //       label: "Sudah Dikembalikan",
  //       variant: "outline",
  //     };
  //   } else if (loan.status === "menunggu_pengembalian" || isOverdue) {
  //     return {
  //       type: "waiting_return",
  //       label: isOverdue ? "Terlambat" : "Menunggu Pengembalian",
  //       variant: isOverdue ? "destructive" : "secondary",
  //     };
  //   } else if (endDate === today) {
  //     return {
  //       type: "due_today",
  //       label: "Jatuh Tempo Hari Ini",
  //       variant: "default",
  //     };
  //   } else {
  //     return {
  //       type: "active",
  //       label: "Sedang Dipinjam",
  //       variant: "default",
  //     };
  //   }
  // };

  const handleProcessReturn = async () => {
    if (!selectedLoan) return;

    try {
      setProcessing(true);

      // Validasi semua item dipilih
      const allItemsReturned = returnData.returnedItems.every(
        (item) => item.returned
      );
      if (!allItemsReturned) {
        toast.error("Pilih semua item untuk dikembalikan");
        return;
      }

      // Gunakan returnService untuk memproses pengembalian
      const result = await returnService.processReturn(
        selectedLoan.id,
        returnData
      );

      if (result.status === "success") {
        toast.success("Pengembalian berhasil diproses");
        setIsReturnDialogOpen(false);
        fetchData(); // Refresh data
      } else {
        toast.error(result.message || "Gagal memproses pengembalian");
      }
    } catch (error) {
      console.error("Error processing return:", error);
      toast.error(
        error.message || "Terjadi kesalahan saat memproses pengembalian"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReturnDialog = (loan) => {
    setSelectedLoan(loan);

    // Siapkan data untuk form pengembalian
    const returnedItems = [];

    // Tambahkan ruangan jika ada
    if (loan.roomId) {
      const roomAsset = assets.find((a) => a.id === loan.roomId);
      returnedItems.push({
        id: loan.roomId,
        name: loan.roomName || roomAsset?.name || "Ruangan",
        type: "room",
        quantity: 1,
        returned: true,
        condition: "baik",
      });
    }

    // Tambahkan fasilitas jika ada
    if (loan.facilities && loan.facilities.length > 0) {
      loan.facilities.forEach((facility) => {
        returnedItems.push({
          id: facility.id,
          name: facility.name,
          type: "facility",
          quantity: facility.quantity || 1,
          returned: true,
          condition: "baik",
        });
      });
    }

    setReturnData({
      returnedItems,
      notes: "",
    });
    setIsReturnDialogOpen(true);
  };

  const handleOpenDetailDialog = (loan) => {
    setSelectedLoan(loan);
    setIsDetailDialogOpen(true);
  };

  const handleItemReturnToggle = (itemId, returned) => {
    setReturnData((prev) => ({
      ...prev,
      returnedItems: prev.returnedItems.map((item) =>
        item.id === itemId ? { ...item, returned } : item
      ),
    }));
  };

  const handleItemConditionChange = (itemId, condition) => {
    setReturnData((prev) => ({
      ...prev,
      returnedItems: prev.returnedItems.map((item) =>
        item.id === itemId ? { ...item, condition } : item
      ),
    }));
  };

  // const getLoanStatus = (loan) => {
  //   const today = new Date().toISOString().split("T")[0];
  //   const endDate = loan.endDate;

  //   if (loan.status === "selesai") {
  //     return {
  //       type: "returned",
  //       label: "Sudah Dikembalikan",
  //       variant: "outline",
  //     };
  //   } else if (loan.status === "menunggu_pengembalian") {
  //     return {
  //       type: "waiting_return",
  //       label: "Menunggu Pengembalian",
  //       variant: "secondary",
  //     };
  //   } else if (endDate && endDate < today) {
  //     return { type: "overdue", label: "Terlambat", variant: "destructive" };
  //   } else {
  //     return { type: "active", label: "Sedang Dipinjam", variant: "default" };
  //   }
  // };

  // src/pages/return-page.jsx - PERBAIKI FUNGSI getLoanStatus
  const getLoanStatus = (loan) => {
    const today = new Date().toISOString().split("T")[0];
    const endDate = loan.endDate;

    if (loan.status === "selesai") {
      return {
        type: "returned",
        label: "Sudah Dikembalikan",
        variant: "outline",
      };
    } else if (loan.status === "menunggu_pengembalian") {
      return {
        type: "waiting_return",
        label: "Menunggu Pengembalian",
        variant: "secondary",
      };
    } else if (endDate && endDate < today) {
      return {
        type: "overdue",
        label: "Terlambat",
        variant: "destructive",
        showAlert: true,
      };
    } else {
      return {
        type: "active",
        label: "Sedang Dipinjam",
        variant: "default",
      };
    }
  };

  const allItemsReturned = returnData.returnedItems.every(
    (item) => item.returned
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Pengembalian Aset</h1>
          <p className="text-muted-foreground mt-2">
            {canApprove
              ? "Kelola proses pengembalian ruangan dan fasilitas"
              : "Lihat status pengembalian peminjaman Anda"}
          </p>
        </div>
        {statusFilter === "pending" && stats.total > 0 && (
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            {stats.overdue > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </div>
                <div className="text-sm text-muted-foreground">Terlambat</div>
              </div>
            )}
            {stats.today > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {stats.today}
                </div>
                <div className="text-sm text-muted-foreground">
                  Jatuh Tempo Hari Ini
                </div>
              </div>
            )}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari ruangan, fasilitas, atau peminjam..."
                className="max-w-sm"
              />
              <Button onClick={fetchData} variant="outline">
                Refresh
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status pengembalian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Sedang Dipinjam</SelectItem>
                <SelectItem value="history">Riwayat Pengembalian</SelectItem>
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
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canApprove ? 6 : 5}
                        className="text-center text-muted-foreground py-8"
                      >
                        {statusFilter === "pending"
                          ? "Tidak ada peminjaman aktif"
                          : "Tidak ada riwayat pengembalian"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => {
                      const status = getLoanStatus(loan);
                      return (
                        <TableRow key={loan.id}>
                          {canApprove && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                {loan.borrowerName}
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="space-y-1">
                              {loan.roomName && (
                                <p className="font-medium">{loan.roomName}</p>
                              )}
                              {loan.facilities &&
                                loan.facilities.length > 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    <p>Fasilitas:</p>
                                    <ul className="list-inside list-disc">
                                      {loan.facilities.map((f, idx) => (
                                        <li key={idx}>
                                          {f.name} ({f.quantity}x)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              {new Date(loan.startDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              {new Date(loan.endDate).toLocaleDateString(
                                "id-ID"
                              )}
                              {status.type === "overdue" && (
                                <Clock className="size-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          {canApprove && (
                            <TableCell>
                              <div className="flex gap-2">
                                {(loan.status === "disetujui" ||
                                  loan.status === "menunggu_pengembalian") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReturnDialog(loan)}
                                  >
                                    <CheckCircle className="mr-1 size-4" />
                                    Proses Pengembalian
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDetailDialog(loan)}
                                >
                                  <Eye className="mr-1 size-4" />
                                  Detail
                                </Button>
                                {loan.status === "menunggu" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Yakin ingin menghapus peminjaman ini?"
                                        )
                                      ) {
                                        loanService
                                          .deleteLoan(loan.id)
                                          .then(() => {
                                            toast.success(
                                              "Peminjaman berhasil dihapus"
                                            );
                                            fetchData();
                                          })
                                          .catch((error) => {
                                            toast.error(
                                              "Gagal menghapus peminjaman"
                                            );
                                          });
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-1 size-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detail */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Peminjaman</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peminjam</Label>
                  <p>{selectedLoan.borrowerName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getLoanStatus(selectedLoan).variant}>
                    {getLoanStatus(selectedLoan).label}
                  </Badge>
                </div>
                <div>
                  <Label>Tanggal Mulai</Label>
                  <p>
                    {new Date(selectedLoan.startDate).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    {selectedLoan.startTime || "08:00"}
                  </div>
                </div>
                <div>
                  <Label>Tanggal Selesai</Label>
                  <p>
                    {new Date(selectedLoan.endDate).toLocaleDateString("id-ID")}
                  </p>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      {selectedLoan.endTime || "17:00"}
                    </div>
                  </TableCell>
                </div>
              </div>

              {selectedLoan.roomName && (
                <div>
                  <Label>Ruangan</Label>
                  <p>{selectedLoan.roomName}</p>
                </div>
              )}

              {selectedLoan.facilities &&
                selectedLoan.facilities.length > 0 && (
                  <div>
                    <Label>Fasilitas</Label>
                    <ul className="list-disc list-inside">
                      {selectedLoan.facilities.map((facility, index) => (
                        <li key={index}>
                          {facility.name} ({facility.quantity}x)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedLoan.purpose && (
                <div>
                  <Label>Keperluan</Label>
                  <p>{selectedLoan.purpose}</p>
                </div>
              )}

              {selectedLoan.returnedAt && (
                <div>
                  <Label>Tanggal Dikembalikan</Label>
                  <p>
                    {new Date(selectedLoan.returnedAt).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Proses Pengembalian */}
      {canApprove && selectedLoan && (
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Proses Pengembalian Aset</DialogTitle>
              <DialogDescription>
                Verifikasi kondisi aset yang dikembalikan oleh{" "}
                {selectedLoan.borrowerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detail Peminjaman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Peminjam:</span>
                      <p>{selectedLoan.borrowerName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Periode:</span>
                      <p>
                        {new Date(selectedLoan.startDate).toLocaleDateString(
                          "id-ID"
                        )}{" "}
                        -{" "}
                        {new Date(selectedLoan.endDate).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Label>Daftar Aset yang Dipinjam</Label>
                <div className="space-y-3">
                  {returnData.returnedItems.map((item) => (
                    <div key={item.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={item.returned}
                            onCheckedChange={(checked) =>
                              handleItemReturnToggle(item.id, checked)
                            }
                          />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {item.type === "room" ? "Ruangan" : "Fasilitas"}
                              </span>
                              <span>Jumlah: {item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        {item.returned && (
                          <Select
                            value={item.condition}
                            onValueChange={(value) =>
                              handleItemConditionChange(item.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baik">Baik</SelectItem>
                              <SelectItem value="rusak_ringan">
                                Rusak Ringan
                              </SelectItem>
                              <SelectItem value="rusak_berat">
                                Rusak Berat
                              </SelectItem>
                              <SelectItem value="hilang">Hilang</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {item.returned && item.condition !== "baik" && (
                        <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                          <AlertCircle className="size-4" />
                          <span>
                            {item.condition === "rusak_ringan" &&
                              "Butuh perbaikan ringan"}
                            {item.condition === "rusak_berat" &&
                              "Butuh perbaikan berat"}
                            {item.condition === "hilang" &&
                              "Aset hilang, perlu tindakan lebih lanjut"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReturnDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleProcessReturn}
                  disabled={!allItemsReturned || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 size-4" />
                      Konfirmasi Pengembalian
                    </>
                  )}
                </Button>
              </div>

              {!allItemsReturned && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="size-4" />
                  <span>
                    Centang semua item yang sudah dikembalikan untuk melanjutkan
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import { returnService } from "../lib/services/returnService.js";
import { assetService } from "../lib/services/assetService.js";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Search,
  Package,
  MapPin,
  User,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";

import { useAuth } from "../context/auth-context.jsx";

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

const APPROVER_ROLES = ["staf_buf", "admin_buf"];
const BORROWER_ROLES = ["mahasiswa", "dosen", "staf", "civitas"];

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

  const canApprove = APPROVER_ROLES.includes(user?.role ?? "");
  const isBorrower = BORROWER_ROLES.includes(user?.role ?? "");

  // Fetch data on mount and when statusFilter changes
  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (
        statusFilter === "pending" ||
        statusFilter === "overdue" ||
        statusFilter === "waiting_return"
      ) {
        const result = await returnService.getPendingReturns();
        if (result.status === "success") {
          // Filter berdasarkan statusFilter
          let loans = result.data.loans || [];
          if (statusFilter === "overdue") {
            const today = new Date().toISOString().split("T")[0];
            loans = loans.filter((loan) => loan.end_date < today);
          } else if (statusFilter === "waiting_return") {
            loans = loans.filter(
              (loan) => loan.status === "menunggu_pengembalian"
            );
          }
          setPendingReturns(loans);
        }
      } else if (statusFilter === "returned") {
        const result = await returnService.getReturnHistory();
        if (result.status === "success") {
          setReturnHistory(result.data.returns || []);
        }
      }

      // Fetch assets for reference (jika diperlukan)
      const assetsResult = await assetService.getAssets();
      if (assetsResult.status === "success") {
        setAssets(assetsResult.data.assets || []);
      }
    } catch (error) {
      console.error("Error fetching return data:", error);
      toast.error("Gagal memuat data pengembalian");
    } finally {
      setLoading(false);
    }
  };

  // Filter loans based on search term
  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    const data = statusFilter === "pending" ? pendingReturns : returnHistory;

    return data.filter((loan) => {
      const matchesSearch =
        loan.borrower_name?.toLowerCase().includes(keyword) ||
        (loan.room_name && loan.room_name.toLowerCase().includes(keyword));

      return matchesSearch;
    });
  }, [pendingReturns, returnHistory, searchTerm, statusFilter]);

  // Handle process return
  const handleProcessReturn = async () => {
    if (!selectedLoan) return;

    try {
      // Pastikan hanya admin/staff yang bisa memproses
      if (!canApprove) {
        toast.error("Anda tidak memiliki izin untuk memproses pengembalian");
        return;
      }

      const result = await returnService.processReturn(selectedLoan.id, {
        returnedItems: returnData.returnedItems,
        notes: returnData.notes,
      });

      if (result.status === "success") {
        toast.success("Pengembalian berhasil diproses");
        setIsReturnDialogOpen(false);
        fetchData(); // Refresh data
      } else {
        toast.error(result.message || "Gagal memproses pengembalian");
      }
    } catch (error) {
      console.error("Error processing return:", error);
      toast.error("Terjadi kesalahan saat memproses pengembalian");
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleOpenReturnDialog = (loan) => {
    setSelectedLoan(loan);

    // Initialize return data dengan semua item yang dipinjam
    const returnedItems = [];

    if (loan.room_id) {
      const roomAsset = assets.find((a) => a.id === loan.room_id);
      returnedItems.push({
        id: loan.room_id,
        name: loan.room_name || roomAsset?.name || "Ruangan",
        type: "room",
        quantity: 1,
        returned: false,
        condition: "baik",
      });
    }

    if (loan.facilities) {
      loan.facilities.forEach((facility) => {
        returnedItems.push({
          id: facility.id,
          name: facility.name,
          type: "facility",
          quantity: facility.quantity,
          returned: false,
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

  const getLoanStatus = (loan) => {
    const today = new Date().toISOString().split("T")[0];

    if (loan.status === "selesai") {
      return {
        type: "returned",
        label: "Sudah Dikembalikan",
        variant: "outline",
      };
    } else if (loan.status === "menunggu_pengembalian") {
      return {
        type: "waiting_return",
        label: "Menunggu Konfirmasi",
        variant: "secondary",
      };
    } else if (loan.end_date < today) {
      return { type: "overdue", label: "Terlambat", variant: "destructive" };
    } else {
      return { type: "active", label: "Sedang Dipinjam", variant: "default" };
    }
  };

  const allItemsReturned = returnData.returnedItems.every(
    (item) => item.returned
  );

  const statusOptions = canApprove
    ? [
        { value: "pending", label: "Sedang Dipinjam" },
        { value: "history", label: "Riwayat Pengembalian" },
      ]
    : [
        { value: "pending", label: "Sedang Dipinjam" },
        { value: "history", label: "Riwayat Pengembalian" },
      ];

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
        {isBorrower && !canApprove && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Untuk mengajukan pengembalian, silakan hubungi admin BUF dengan
              membawa aset yang dipinjam.
            </p>
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
                placeholder={
                  canApprove
                    ? "Cari peminjam, ruangan, atau fasilitas..."
                    : "Cari ruangan atau fasilitas..."
                }
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status pengembalian" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={canApprove ? 6 : 5}
                        className="text-center text-muted-foreground"
                      >
                        Tidak ada data pengembalian ditemukan
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredLoans.map((loan) => {
                    const status = getLoanStatus(loan);
                    return (
                      <TableRow key={loan.id}>
                        {canApprove && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-muted-foreground" />
                              {loan.borrower_name}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <LoanAssetDetails loan={loan} />
                        </TableCell>
                        <TableCell>
                          <LoanDate value={loan.start_date} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-muted-foreground" />
                            {new Date(loan.end_date).toLocaleDateString(
                              "id-ID"
                            )}
                            {status.type === "overdue" && (
                              <Clock className="size-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canApprove && loan.status === "disetujui" && (
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detail untuk semua user */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle>Detail Peminjaman</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peminjam</Label>
                  <p>{selectedLoan.borrower_name}</p>
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
                    {new Date(selectedLoan.start_date).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                </div>
                <div>
                  <Label>Tanggal Selesai</Label>
                  <p>
                    {new Date(selectedLoan.end_date).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                </div>
              </div>

              {selectedLoan.room_name && (
                <div>
                  <Label>Ruangan</Label>
                  <p>{selectedLoan.room_name}</p>
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

              {selectedLoan.returned_at && (
                <div>
                  <Label>Tanggal Dikembalikan</Label>
                  <p>
                    {new Date(selectedLoan.returned_at).toLocaleDateString(
                      "id-ID"
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Proses Pengembalian (hanya untuk admin) */}
      {canApprove && selectedLoan && (
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="max-w-xl bg-card">
            <DialogHeader>
              <DialogTitle>Proses Pengembalian Aset</DialogTitle>
              <DialogDescription>
                Verifikasi kondisi fisik aset yang dikembalikan oleh{" "}
                {selectedLoan?.borrower_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informasi Peminjaman */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detail Peminjaman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Peminjam:</span>
                      <p>{selectedLoan.borrower_name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Periode:</span>
                      <p>
                        {new Date(selectedLoan.start_date).toLocaleDateString(
                          "id-ID"
                        )}{" "}
                        -{" "}
                        {new Date(selectedLoan.end_date).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daftar Item yang Dipinjam */}
              <div className="space-y-4">
                <Label>Daftar Aset yang Dipinjam</Label>
                <div className="space-y-3">
                  {returnData.returnedItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
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
                                  {item.type === "room"
                                    ? "Ruangan"
                                    : "Fasilitas"}
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
                                "Item hilang, perlu tindakan lebih lanjut"}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label>Catatan Pengembalian</Label>
                <Input
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={returnData.notes}
                  onChange={(e) =>
                    setReturnData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReturnDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleProcessReturn}
                  disabled={!allItemsReturned}
                >
                  <CheckCircle className="mr-2 size-4" />
                  Konfirmasi Pengembalian
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

function LoanAssetDetails({ loan }) {
  return (
    <div className="space-y-2">
      {loan.room_name && (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span className="font-medium">{loan.room_name}</span>
        </div>
      )}
      {loan.facilities && loan.facilities.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="size-4" />
            <span>Fasilitas:</span>
          </div>
          <ul className="list-inside list-disc mt-1">
            {loan.facilities.map((facility, index) => (
              <li key={`${loan.id}-${facility.id}-${index}`}>
                {facility.name} ({facility.quantity}x)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LoanDate({ value }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="size-4 text-muted-foreground" />
      {new Date(value).toLocaleDateString("id-ID")}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/auth-context.jsx";
import { loanService } from "../lib/services/loanService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export function HistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const canViewAll =
    user?.role === "admin_buf" ||
    user?.role === "staf_buf" ||
    user?.role === "kepala_buf";

  // Fetch data from backend
  useEffect(() => {
    fetchHistory();
  }, [academicYearFilter, semesterFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const result = await loanService.getLoans(
        "", // search term
        "selesai", // only completed loans
        academicYearFilter !== "all" ? academicYearFilter : "",
        semesterFilter !== "all" ? semesterFilter : ""
      );

      if (result.status === "success") {
        setLoans(result.data.loans || []);
      } else {
        toast.error(result.message || "Gagal memuat riwayat peminjaman");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 2}/${currentYear - 1}`,
      `${currentYear - 1}/${currentYear}`,
      `${currentYear}/${currentYear + 1}`,
      `${currentYear + 1}/${currentYear + 2}`,
    ];
  }, []);

  const filteredLoans = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return loans.filter((loan) => {
      const matchesSearch =
        loan.borrowerName?.toLowerCase().includes(searchTerm) ||
        (loan.roomName && loan.roomName.toLowerCase().includes(searchTerm)) ||
        (loan.facilities &&
          loan.facilities.some((f) =>
            f.name?.toLowerCase().includes(searchTerm)
          ));

      return matchesSearch;
    });
  }, [loans, search]);

  const getStatusBadge = (status) => {
    const variants = {
      menunggu: { variant: "secondary", label: "Menunggu" },
      disetujui: { variant: "default", label: "Disetujui" },
      ditolak: { variant: "destructive", label: "Ditolak" },
      selesai: { variant: "outline", label: "Selesai" },
      menunggu_pengembalian: {
        variant: "secondary",
        label: "Menunggu Pengembalian",
      },
    };
    return (
      <Badge variant={variants[status]?.variant || "secondary"}>
        {variants[status]?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Riwayat Peminjaman</h1>
        <p className="text-muted-foreground mt-2">
          {canViewAll
            ? "Lihat riwayat semua peminjaman yang sudah selesai"
            : "Lihat riwayat peminjaman Anda yang sudah selesai"}
        </p>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Peminjaman Selesai
                </p>
                <p className="text-2xl font-bold">{loans.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ditampilkan
                </p>
                <p className="text-2xl font-bold">{filteredLoans.length}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tahun Ajaran
                </p>
                <p className="text-lg font-bold">
                  {academicYearFilter === "all" ? "Semua" : academicYearFilter}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Semester
                </p>
                <p className="text-lg font-bold">
                  {semesterFilter === "all"
                    ? "Semua"
                    : semesterFilter === "ganjil"
                    ? "Ganjil"
                    : "Genap"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="size-5 text-muted-foreground" />
              <Input
                placeholder="Cari aset atau peminjam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={academicYearFilter}
                onValueChange={setAcademicYearFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {academicYearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canViewAll && <TableHead>Peminjam</TableHead>}
                    <TableHead>Aset</TableHead>
                    <TableHead>Tanggal Peminjaman</TableHead>
                    <TableHead>Tanggal Pengembalian</TableHead>
                    <TableHead>Tahun Ajaran</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canViewAll ? 7 : 6}
                        className="text-center text-muted-foreground py-8"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
                          <p>Tidak ada riwayat peminjaman selesai ditemukan</p>
                          <p className="text-sm">
                            Semua peminjaman yang sudah dikembalikan akan muncul
                            di sini
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        {canViewAll && (
                          <TableCell>{loan.borrowerName}</TableCell>
                        )}
                        <TableCell>
                          <div className="space-y-1">
                            {loan.roomName && (
                              <p className="font-medium">{loan.roomName}</p>
                            )}
                            {loan.facilities && loan.facilities.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p>Fasilitas:</p>
                                <ul className="list-disc list-inside">
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
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>
                                {new Date(loan.startDate).toLocaleDateString(
                                  "id-ID"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="size-3" />
                              <span>
                                {loan.startTime || "08:00"} -{" "}
                                {loan.endTime || "17:00"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3 text-green-500" />
                              <span>
                                {loan.returnedAt
                                  ? new Date(
                                      loan.returnedAt
                                    ).toLocaleDateString("id-ID")
                                  : new Date(loan.endDate).toLocaleDateString(
                                      "id-ID"
                                    )}
                              </span>
                            </div>
                            {loan.returnedAt && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="size-3" />
                                <span>
                                  {new Date(loan.returnedAt).toLocaleTimeString(
                                    "id-ID",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {loan.academicYear || "2025/2026"}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {loan.semester || "ganjil"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(loan.status)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

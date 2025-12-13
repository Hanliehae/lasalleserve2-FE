import { useAuth } from "../context/auth-context.jsx";
import { exportService } from "../lib/services/exportService";
import { assetService } from "../lib/services/assetService";
import { loanService } from "../lib/services/loanService";
import { reportService } from "../lib/services/reportService";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Download,
  FileText,
  Package,
  AlertTriangle,
  ClipboardList,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";

const getAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
};

export function ExportPage() {
  const { user } = useAuth();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [reportType, setReportType] = useState("peminjaman");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalLoans: 0,
    totalReports: 0,
    activeLoans: 0,
  });

  const canExport = user?.role === "kepala_buf" || user?.role === "admin_buf";

  useEffect(() => {
    if (canExport) {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const assetsResult = await assetService.getAssets();
      if (assetsResult.status === "success") {
        setStats((prev) => ({
          ...prev,
          totalAssets: assetsResult.data.assets?.length || 0,
        }));
      }

      const loansResult = await loanService.getLoans();
      if (loansResult.status === "success") {
        const loans = loansResult.data.loans || [];
        setStats((prev) => ({
          ...prev,
          totalLoans: loans.length,
          activeLoans: loans.filter((l) => l.status === "disetujui").length,
        }));
      }

      const reportsResult = await reportService.getDamageReports();
      if (reportsResult.status === "success") {
        setStats((prev) => ({
          ...prev,
          totalReports: reportsResult.data.damageReports?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Gagal memuat statistik");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error("Anda tidak memiliki izin untuk mengekspor data");
      return;
    }

    try {
      setExporting(true);

      if (reportType === "peminjaman") {
        await exportService.exportLoans(
          selectedAcademicYear === "all" ? "" : selectedAcademicYear,
          selectedSemester,
          "csv"
        );
        toast.success("Data peminjaman berhasil diekspor");
      } else if (reportType === "kerusakan") {
        await exportService.exportDamageReports(
          selectedAcademicYear === "all" ? "" : selectedAcademicYear,
          selectedSemester,
          "csv"
        );
        toast.success("Data kerusakan berhasil diekspor");
      } else {
        toast.error("Jenis laporan belum didukung");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  };

  const academicYearOptions = getAcademicYearOptions();

  if (!canExport) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Akses Ditolak</h3>
              <p className="text-muted-foreground mt-2">
                Anda tidak memiliki izin untuk mengakses halaman ini. Hanya
                Kepala BUF dan Admin BUF yang dapat mengekspor data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Laporan & Ekspor Data</h1>
        <p className="text-muted-foreground mt-2">
          Lihat ringkasan dan ekspor data BUF
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-muted-foreground">Total Aset</CardTitle>
            <Package className="size-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-sm text-muted-foreground">Terdaftar di sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-muted-foreground">
              Total Peminjaman
            </CardTitle>
            <ClipboardList className="size-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-sm text-muted-foreground">
              {stats.activeLoans} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-muted-foreground">
              Laporan Kerusakan
            </CardTitle>
            <AlertTriangle className="size-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-sm text-muted-foreground">Perlu penanganan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-muted-foreground">
              Tahun Ajaran
            </CardTitle>
            <FileText className="size-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {selectedAcademicYear === "all" ? "Semua" : selectedAcademicYear}
            </div>
            <p className="text-sm text-muted-foreground">Filter aktif</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Pilih tahun ajaran, semester, dan jenis laporan untuk diekspor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Tahun Ajaran</Label>
              <Select
                value={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
              >
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Pilih Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                  {academicYearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger id="semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-type">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peminjaman">Laporan Peminjaman</SelectItem>
                  <SelectItem value="kerusakan">Laporan Kerusakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ekspor Laporan</CardTitle>
          <CardDescription>Export data dalam format CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Detail Ekspor:</h4>
              <p className="text-sm">
                • Tahun Ajaran: {selectedAcademicYear === "all" ? "Semua" : selectedAcademicYear}
                <br />• Semester:{" "}
                {selectedSemester === "all"
                  ? "Semua"
                  : selectedSemester === "ganjil"
                  ? "Ganjil"
                  : "Genap"}
                <br />• Jenis Laporan:{" "}
                {reportType === "peminjaman" ? "Peminjaman" : "Kerusakan"}
                <br />• Format: CSV (Excel compatible)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Mengekspor...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Catatan: File CSV dapat dibuka di Microsoft Excel, Google Sheets,
              atau aplikasi spreadsheet lainnya.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

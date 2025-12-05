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
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";

// Fungsi untuk mendapatkan opsi tahun ajaran
const getAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
};

// Fungsi untuk mendapatkan opsi semester
const getSemesterOptions = () => [
  { value: "all", label: "Semua Semester" },
  { value: "ganjil", label: "Ganjil" },
  { value: "genap", label: "Genap" },
];

export function ExportPage() {
  const { user } = useAuth();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [reportType, setReportType] = useState("peminjaman");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalLoans: 0,
    totalReports: 0,
    activeLoans: 0,
  });

  const canExport = user?.role === "kepala_buf" || user?.role === "admin_buf";

  // Fetch initial stats
  useEffect(() => {
    if (canExport) {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch asset count
      const assetsResult = await assetService.getAssets();
      if (assetsResult.status === "success") {
        setStats((prev) => ({
          ...prev,
          totalAssets: assetsResult.data.assets?.length || 0,
        }));
      }

      // Fetch loan count
      const loansResult = await loanService.getLoans();
      if (loansResult.status === "success") {
        const loans = loansResult.data.loans || [];
        setStats((prev) => ({
          ...prev,
          totalLoans: loans.length,
          activeLoans: loans.filter((l) => l.status === "disetujui").length,
        }));
      }

      // Fetch report count
      const reportsResult = await reportService.getDamageReports();
      if (reportsResult.status === "success") {
        setStats((prev) => ({
          ...prev,
          totalReports: reportsResult.data.damageReports?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleExport = async (format) => {
    if (!canExport) {
      toast.error("Anda tidak memiliki izin untuk mengekspor data");
      return;
    }

    try {
      setLoading(true);

      if (reportType === "peminjaman" || reportType === "pengembalian") {
        await exportService.exportLoans(
          selectedAcademicYear || "",
          selectedSemester,
          format
        );
        toast.success("Data peminjaman berhasil diekspor");
      } else if (reportType === "kerusakan") {
        await exportService.exportDamageReports(
          selectedAcademicYear || "",
          selectedSemester,
          format
        );
        toast.success("Data kerusakan berhasil diekspor");
      } else {
        toast.error("Jenis laporan belum didukung");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data");
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      peminjaman: "Peminjaman",
      pengembalian: "Pengembalian",
      kerusakan: "Kerusakan",
    };
    return labels[type] || type;
  };

  const academicYearOptions = getAcademicYearOptions();
  const semesterOptions = getSemesterOptions();

  if (!canExport) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Anda tidak memiliki akses ke halaman ini
            </p>
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

      {/* Ringkasan Statistik */}
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
            <div className="text-2xl font-bold">
              {selectedAcademicYear || "Semua"}
            </div>
            <p className="text-sm text-muted-foreground">Filter aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Laporan dengan Semester */}
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
                  <SelectItem>Semua Tahun Ajaran</SelectItem>
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
                  {semesterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="pengembalian">
                    Laporan Pengembalian
                  </SelectItem>
                  <SelectItem value="kerusakan">Laporan Kerusakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ekspor Laporan */}
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
                • Tahun Ajaran: {selectedAcademicYear || "Semua"}
                <br />• Semester:{" "}
                {
                  semesterOptions.find((s) => s.value === selectedSemester)
                    ?.label
                }
                <br />• Jenis Laporan: {getReportTypeLabel(reportType)}
                <br />• Format: CSV (Excel compatible)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleExport("csv")}
                disabled={loading}
                className="flex-1"
              >
                <Download className="mr-2 size-4" />
                {loading ? "Memproses..." : "Export CSV"}
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

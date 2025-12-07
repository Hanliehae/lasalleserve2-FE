import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  Pie,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/auth-context.jsx";
import { reportService } from "../lib/services/reportService";
import { toast } from "sonner";

const PERIOD_OPTIONS = [
  { value: "7", label: "7 Hari Terakhir" },
  { value: "30", label: "30 Hari Terakhir" },
  { value: "90", label: "90 Hari Terakhir" },
  { value: "180", label: "6 Bulan Terakhir" },
];

const STAT_CARDS = [
  {
    key: "total",
    title: "Total Laporan",
    icon: AlertTriangle,
    description: (period) => `Dalam ${period} hari terakhir`,
  },
  {
    key: "priority",
    title: "Prioritas Tinggi",
    icon: TrendingUp,
    description: () => "Memerlukan perhatian segera",
  },
  {
    key: "menunggu",
    title: "Menunggu",
    icon: Calendar,
    description: () => "Belum ditangani",
  },
  {
    key: "selesai",
    title: "Selesai",
    icon: Package,
    description: () => "Sudah diperbaiki",
  },
];

export function DamageHistoryPage() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("30");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const result = await reportService.getDamageReports();

      if (result.status === "success") {
        setReports(result.data.damageReports || []);
      } else {
        toast.error(result.message || "Gagal memuat data laporan kerusakan");
      }
    } catch (error) {
      console.error("Error fetching damage reports:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 1}/${currentYear}`,
      `${currentYear}/${currentYear + 1}`,
      `${currentYear + 1}/${currentYear + 2}`,
    ];
  }, []);

  const filteredReports = useMemo(() => {
    const now = Date.now();
    const cutoff = now - Number(timePeriod) * 24 * 60 * 60 * 1000;

    let filtered = reports.filter(
      (report) => new Date(report.createdAt).getTime() >= cutoff
    );

    // Filter berdasarkan tahun ajaran
    if (academicYearFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.academicYear === academicYearFilter
      );
    }

    // Filter berdasarkan semester
    if (semesterFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.semester === semesterFilter
      );
    }

    return filtered;
  }, [reports, timePeriod, academicYearFilter, semesterFilter]);

  const priorityStats = useMemo(() => {
    return filteredReports.reduce(
      (acc, report) => {
        acc[report.priority] = (acc[report.priority] || 0) + 1;
        return acc;
      },
      { tinggi: 0, sedang: 0, rendah: 0 }
    );
  }, [filteredReports]);

  const statusStats = useMemo(() => {
    return filteredReports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      { menunggu: 0, dalam_perbaikan: 0, selesai: 0 }
    );
  }, [filteredReports]);

  const priorityChartData = useMemo(
    () => [
      { name: "Tinggi", value: priorityStats.tinggi, fill: "#ef4444" },
      { name: "Sedang", value: priorityStats.sedang, fill: "#f59e0b" },
      { name: "Rendah", value: priorityStats.rendah, fill: "#10b981" },
    ],
    [priorityStats]
  );

  const statusChartData = useMemo(
    () => [
      { name: "Menunggu", value: statusStats.menunggu },
      { name: "Dalam Perbaikan", value: statusStats.dalam_perbaikan },
      { name: "Selesai", value: statusStats.selesai },
    ],
    [statusStats]
  );

  const trendData = useMemo(() => {
    const totalWeeks = Math.max(1, Math.ceil(Number(timePeriod) / 7));

    return Array.from({ length: totalWeeks }).map((_, index) => {
      const startOffset = totalWeeks - index;
      const weekStart = Date.now() - startOffset * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

      const count = filteredReports.filter((report) => {
        const createdAt = new Date(report.createdAt).getTime();
        return createdAt >= weekStart && createdAt < weekEnd;
      }).length;

      return {
        week: `Minggu ${index + 1}`,
        laporan: count,
      };
    });
  }, [filteredReports, timePeriod]);

  const getTopDamagedAssets = useMemo(() => {
    const assetCounts = {};

    filteredReports.forEach((report) => {
      const assetName = report.assetName || "Unknown Asset";
      assetCounts[assetName] = (assetCounts[assetName] || 0) + 1;
    });

    return Object.entries(assetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Riwayat Kerusakan</h1>
        <p className="text-muted-foreground mt-2">
          Analisis dan statistik laporan kerusakan aset
        </p>
      </header>

      <PeriodSelector
        value={timePeriod}
        onChange={setTimePeriod}
        academicYearFilter={academicYearFilter}
        setAcademicYearFilter={setAcademicYearFilter}
        academicYearOptions={academicYearOptions}
        semesterFilter={semesterFilter}
        setSemesterFilter={setSemesterFilter}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STAT_CARDS.map(({ key, title, icon: Icon, description }) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {key === "total"
                      ? filteredReports.length
                      : key === "priority"
                      ? priorityStats.tinggi
                      : key === "menunggu"
                      ? statusStats.menunggu
                      : statusStats.selesai}
                  </div>
                  {description && (
                    <p className="text-xs text-muted-foreground">
                      {description(timePeriod)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Prioritas</CardTitle>
                <CardDescription>
                  Jumlah laporan berdasarkan tingkat prioritas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {priorityChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Laporan</CardTitle>
                <CardDescription>
                  Distribusi status penanganan laporan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend Laporan Kerusakan</CardTitle>
              <CardDescription>
                Perkembangan jumlah laporan per minggu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="laporan"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aset Paling Sering Rusak</CardTitle>
              <CardDescription>
                5 aset dengan laporan kerusakan terbanyak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopDamagedAssets.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {asset.count} laporan
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (asset.count /
                                Math.max(
                                  ...getTopDamagedAssets.map((a) => a.count)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
  academicYearFilter,
  setAcademicYearFilter,
  academicYearOptions,
  semesterFilter,
  setSemesterFilter,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Laporan</CardTitle>
        <CardDescription>
          Pilih periode, tahun ajaran, dan semester untuk melihat statistik
          kerusakan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="period">Periode Waktu</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="academicYear">Tahun Ajaran</Label>
            <Select
              value={academicYearFilter}
              onValueChange={setAcademicYearFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                {academicYearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                <SelectItem value="ganjil">Ganjil</SelectItem>
                <SelectItem value="genap">Genap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

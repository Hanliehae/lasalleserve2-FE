import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit,
  Eye,
  Calendar,
  Package,
  TrendingUp,
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
import {
  mockDamageReports,
  mockAssets,
  getAcademicYearOptions,
  getAcademicYear,
  getSemesterOptions,
  getSemesterFromDate,
} from "../lib/mock-data.js";

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
    getValue: (reports) => reports.length,
    description: (period) => `Dalam ${period} hari terakhir`,
  },
  {
    key: "priority",
    title: "Prioritas Tinggi",
    icon: TrendingUp,
    getValue: (_, priorityStats) => priorityStats.tinggi,
    description: () => "Memerlukan perhatian segera",
  },
  {
    key: "menunggu",
    title: "Menunggu",
    icon: Calendar,
    getValue: (_, __, statusStats) => statusStats.menunggu,
    description: () => "Belum ditangani",
  },
  {
    key: "selesai",
    title: "Selesai",
    icon: Package,
    getValue: (_, __, statusStats) => statusStats.selesai,
    description: () => "Sudah diperbaiki",
  },
];

// Tambahkan fungsi untuk mendapatkan tahun ajaran dari tanggal
const getAcademicYearFromDate = (dateString) => {
  const date = new Date(dateString);
  return getAcademicYear(date);
};

export function DamageHistoryPage() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("30");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const filteredReports = useMemo(() => {
    const now = Date.now();
    const cutoff = now - Number(timePeriod) * 24 * 60 * 60 * 1000;

    let reports = mockDamageReports.filter(
      (report) => new Date(report.createdAt).getTime() >= cutoff
    );

    // Filter berdasarkan tahun ajaran
    if (academicYearFilter !== "all") {
      reports = reports.filter(
        (report) =>
          getAcademicYearFromDate(report.createdAt) === academicYearFilter
      );
    }

    // TAMBAHKAN FILTER SEMESTER
    if (semesterFilter !== "all") {
      reports = reports.filter(
        (report) =>
          getSemesterFromDate(report.createdAt) === semesterFilter ||
          report.semester === semesterFilter
      );
    }

    return reports;
  }, [timePeriod, academicYearFilter, semesterFilter]);

  const academicYearOptions = getAcademicYearOptions();
  const semesterOptions = getSemesterOptions();

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

  const facilityDamageChartData = useMemo(() => {
    const counts = filteredReports.reduce((acc, report) => {
      const asset = mockAssets.find((item) => item.id === report.assetId);

      if (asset?.category === "fasilitas") {
        acc[asset.name] = (acc[asset.name] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({
        name: name.length > 20 ? `${name.slice(0, 20)}...` : name,
        value,
      }));
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
        semesterOptions={semesterOptions}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, title, icon: Icon, getValue, description }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getValue(filteredReports, priorityStats, statusStats)}
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

      <ChartsSection
        priorityChartData={priorityChartData}
        statusChartData={statusChartData}
      />

      <TrendChart data={trendData} />

      <TopFacilitiesChart data={facilityDamageChartData} />
    </div>
  );
}

/* -------------------------------------------------------------
   COMPONENTS
-------------------------------------------------------------- */

function PeriodSelector({
  value,
  onChange,
  academicYearFilter,
  setAcademicYearFilter,
  academicYearOptions,
  semesterFilter,
  setSemesterFilter,
  semesterOptions,
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
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                {semesterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartsSection({ priorityChartData, statusChartData }) {
  return (
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
  );
}

function TrendChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Laporan Kerusakan</CardTitle>
        <CardDescription>
          Perkembangan jumlah laporan per minggu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
  );
}

function TopFacilitiesChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fasilitas Paling Sering Rusak</CardTitle>
        <CardDescription>5 fasilitas dengan laporan terbanyak</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// src/pages/dashboard-page.js
import { useMemo, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Clock,
  Package,
  TrendingDown,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../context/auth-context.jsx";
import { dashboardService } from "../lib/services/dashboardService";
import { toast } from "sonner";

const STAT_TEMPLATES = {
  totalAssets: { title: "Total Aset", icon: Package, color: "text-blue-600" },
  totalLoans: {
    title: "Total Peminjaman",
    icon: ClipboardList,
    color: "text-green-600",
  },
  totalReports: {
    title: "Laporan Kerusakan",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  lowStockAssets: {
    title: "Stok Rendah",
    icon: TrendingDown,
    color: "text-red-600",
  },
  pendingLoans: {
    title: "Permintaan Menunggu",
    icon: Clock,
    color: "text-yellow-600",
  },
  activeLoans: {
    title: "Peminjaman Aktif",
    icon: ClipboardList,
    color: "text-green-600",
  },
  pendingReports: {
    title: "Laporan Menunggu",
    icon: AlertTriangle,
    color: "text-red-600",
  },
  overdueLoans: {
    title: "Pinjaman Jatuh Tempo",
    icon: Clock,
    color: "text-orange-600",
  },
};

const ROLE_STAT_KEYS = {
  kepala_buf: ["totalAssets", "totalLoans", "totalReports", "lowStockAssets"],
  admin_buf: ["totalAssets", "pendingLoans", "activeLoans", "pendingReports"],
  staf_buf: ["pendingLoans", "pendingReports", "activeLoans", "overdueLoans"],
  default: ["activeLoans", "pendingLoans", "totalReports"],
};

const QUICK_ACTIONS = {
  civitas: [
    {
      title: "Ajukan Peminjaman Baru",
      description: "Pilih aset dan buat permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Lapor Kerusakan",
      description: "Laporkan kerusakan aset yang ditemukan",
      path: "/reports",
    },
  ],
  mahasiswa: [
    {
      title: "Ajukan Peminjaman Baru",
      description: "Pilih aset dan buat permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Lapor Kerusakan",
      description: "Laporkan kerusakan aset yang ditemukan",
      path: "/reports",
    },
  ],
  dosen: [
    {
      title: "Ajukan Peminjaman Baru",
      description: "Pilih aset dan buat permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Lapor Kerusakan",
      description: "Laporkan kerusakan aset yang ditemukan",
      path: "/reports",
    },
  ],
  staf: [
    {
      title: "Ajukan Peminjaman Baru",
      description: "Pilih aset dan buat permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Lapor Kerusakan",
      description: "Laporkan kerusakan aset yang ditemukan",
      path: "/reports",
    },
  ],
  staf_buf: [
    {
      title: "Validasi Peminjaman",
      description: "Review dan approve permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Proses Pengembalian",
      description: "Kelola proses pengembalian aset",
      path: "/return",
    },
  ],
  admin_buf: [
    {
      title: "Validasi Peminjaman",
      description: "Review dan approve permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Kelola Aset",
      description: "Tambah atau update data aset",
      path: "/assets",
    },
  ],
  kepala_buf: [
    {
      title: "Ekspor Laporan",
      description: "Download laporan peminjaman dan kerusakan",
      path: "/export",
    },
    {
      title: "Monitor Kerusakan",
      description: "Analisis data laporan kerusakan",
      path: "/damage-history",
    },
    {
      title: "Lihat Ringkasan",
      description: "Analisis data peminjaman dan aset",
    },
  ],
  default: [
    {
      title: "Ajukan Peminjaman Baru",
      description: "Pilih aset dan buat permintaan peminjaman",
      path: "/loans",
    },
    {
      title: "Lapor Kerusakan",
      description: "Laporkan kerusakan aset yang ditemukan",
      path: "/reports",
    },
  ],
};

const ACTIVITY_LOGS = [
  {
    statusColor: "bg-green-600",
    title: "Peminjaman disetujui",
    description: "Ruang Seminar A - 2 jam yang lalu",
  },
  {
    statusColor: "bg-yellow-600",
    title: "Permintaan baru masuk",
    description: "Proyektor LCD (2 unit) - 3 jam yang lalu",
  },
  {
    statusColor: "bg-red-600",
    title: "Laporan kerusakan",
    description: "Laptop Dell - 5 jam yang lalu",
  },
  {
    statusColor: "bg-blue-600",
    title: "Aset dikembalikan",
    description: "Sound System - 1 hari yang lalu",
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "default";
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getStats();

      if (result.status === "success") {
        setStats(result.data.stats || {});
      } else {
        toast.error(result.message || "Gagal memuat data dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Terjadi kesalahan saat memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(() => {
    const keys = ROLE_STAT_KEYS[role] ?? ROLE_STAT_KEYS.default;

    return keys.map((key) => {
      const template = STAT_TEMPLATES[key];
      const Icon = template.icon;

      return {
        key,
        title: template.title,
        value: stats[key] ?? 0,
        Icon,
        color: template.color,
      };
    });
  }, [role, stats]);

  const quickActions = QUICK_ACTIONS[role] ?? QUICK_ACTIONS.default;

  const handleQuickAction = (action) => {
    if (action.path) {
      window.location.href = action.path;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1>Beranda</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang, {user?.name ?? "Pengguna"}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))
          : statCards.map(({ key, title, value, Icon, color }) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm">
                    {title}
                  </CardTitle>
                  <Icon className={`size-5 ${color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                type="button"
                variant="outline"
                className="h-auto flex w-full flex-col items-start gap-1 p-3 text-left hover:bg-accent"
                onClick={() => handleQuickAction(action)}
              >
                <span className="font-medium">{action.title}</span>
                <span className="text-sm text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Update terkini sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ACTIVITY_LOGS.map((activity) => (
              <article key={activity.title} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-2 size-2 rounded-full ${activity.statusColor}`}
                />
                <div className="flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card> */}
      </section>
    </div>
  );
}

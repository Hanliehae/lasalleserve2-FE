import { useAuth } from "../../context/auth-context.jsx";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  AlertTriangle,
  History,
  FileText,
  LogOut,
  Settings,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Button } from "../ui/button";

// sidebar-nav.jsx - Pastikan konfigurasi sudah benar
const navItems = [
  {
    title: "Beranda",
    href: "/",
    icon: LayoutDashboard,
    roles: [
      "dosen",
      "mahasiswa",
      "staf",
      "staf_buf",
      "admin_buf",
      "kepala_buf",
    ],
  },
  {
    title: "Aset",
    href: "/assets",
    icon: Package,
    roles: ["admin_buf"], // Hanya admin yang bisa kelola aset
  },
  {
    title: "Peminjaman",
    href: "/loans",
    icon: ClipboardList,
    roles: ["dosen", "mahasiswa", "staf", "staf_buf", "admin_buf"],
  },
  {
    title: "Pengembalian",
    href: "/return",
    icon: CheckCircle,
    roles: ["mahasiswa", "dosen", "staf", "staf_buf", "admin_buf"],
  },
  {
    title: "Laporan Kerusakan",
    href: "/reports",
    icon: AlertTriangle,
    roles: [
      "dosen",
      "mahasiswa",
      "staf",
      "staf_buf",
      "admin_buf",
      "kepala_buf",
    ],
  },
  {
    title: "Riwayat Kerusakan",
    href: "/damage-history",
    icon: TrendingUp,
    roles: ["admin_buf", "kepala_buf"],
  },
  {
    title: "Riwayat Peminjaman",
    href: "/history",
    icon: History,
    roles: [
      "dosen",
      "mahasiswa",
      "staf",
      "staf_buf",
      "admin_buf",
      "kepala_buf",
    ],
  },
  {
    title: "Laporan & Ekspor",
    href: "/export",
    icon: FileText,
    roles: ["kepala_buf", "admin_buf"],
  },
];

export function SidebarNav({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card shrink-0">
      <div className="border-b p-6">
        <h2 className="truncate">BUF UKDLSM</h2>
        <p className="text-muted-foreground mt-1 truncate">{user?.name}</p>
        <p className="text-muted-foreground mt-0.5 capitalize truncate">
          {user?.role?.replace("_", " ")}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => onNavigate("/settings")}
        >
          <Settings className="size-5 shrink-0" />
          <span className="truncate">Pengaturan</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={logout}
        >
          <LogOut className="size-5 shrink-0" />
          <span className="truncate">Keluar</span>
        </Button>
      </div>
    </div>
  );
}

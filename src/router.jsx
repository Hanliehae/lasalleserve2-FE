import { AssetsPage } from "./pages/assets-page";
import { DamageHistoryPage } from "./pages/damage-history-page";
import { DashboardPage } from "./pages/dashboard-page";
import { ExportPage } from "./pages/export-page";
import { HistoryPage } from "./pages/history-page";
import { LoansPage } from "./pages/loans-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";
import { ReportsPage } from "./pages/reports-page";

const DEFAULT_ROUTE = "/";

/**
 * Declarative map of every route in the application.
 * New routes should be registered here to keep App.jsx lean.
 */
export const routes = [
  {
    path: "/",
    key: "dashboard",
    label: "Dashboard",
    component: DashboardPage,
    isProtected: true,
  },
  {
    path: "/assets",
    key: "assets",
    label: "Daftar Aset",
    component: AssetsPage,
    isProtected: true,
  },
  {
    path: "/loans",
    key: "loans",
    label: "Peminjaman",
    component: LoansPage,
    isProtected: true,
  },
  {
    path: "/reports",
    key: "reports",
    label: "Laporan Kerusakan",
    component: ReportsPage,
    isProtected: true,
  },
  {
    path: "/damage-history",
    key: "damage-history",
    label: "Riwayat Kerusakan",
    component: DamageHistoryPage,
    isProtected: true,
  },
  {
    path: "/history",
    key: "history",
    label: "Riwayat Peminjaman",
    component: HistoryPage,
    isProtected: true,
  },
  {
    path: "/export",
    key: "export",
    label: "Ekspor Laporan",
    component: ExportPage,
    isProtected: true,
  },
  {
    path: "/login",
    key: "login",
    label: "Masuk",
    component: LoginPage,
    isProtected: false,
  },
  {
    path: "/register",
    key: "register",
    label: "Daftar",
    component: RegisterPage,
    isProtected: false,
  },
  // `/settings` masih menunggu desain final, sehingga tidak ditautkan ke komponen khusus.
];

const routeMap = routes.reduce((acc, route) => {
  acc[route.path] = route;
  return acc;
}, {});

export const protectedRoutes = routes.filter((route) => route.isProtected);
export const publicRoutes = routes.filter((route) => !route.isProtected);

export function resolveRouteComponent(pathname) {
  const route = routeMap[pathname];
  if (route?.component) {
    return route.component;
  }
  return routeMap[DEFAULT_ROUTE].component;
}

export function getRouteMetadata(pathname) {
  return routeMap[pathname] ?? routeMap[DEFAULT_ROUTE];
}

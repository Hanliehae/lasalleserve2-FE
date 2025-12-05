import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./components/layout/sidebar-nav.jsx";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/auth-context.jsx";
import { AssetsPage } from "./pages/assets-page";
import { DamageHistoryPage } from "./pages/damage-history-page";
import { DashboardPage } from "./pages/dashboard-page";
import { ExportPage } from "./pages/export-page";
import { HistoryPage } from "./pages/history-page";
import { LoansPage } from "./pages/loans-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";
import { ReportsPage } from "./pages/reports-page";
import { ReturnPage } from "./pages/return-page";

const ROUTE_COMPONENTS = {
  "/": DashboardPage,
  "/assets": AssetsPage,
  "/loans": LoansPage,
  "/reports": ReportsPage,
  "/damage-history": DamageHistoryPage,
  "/history": HistoryPage,
  "/export": ExportPage,
  "/return": ReturnPage,
};

const brandTitle = "BUF UKDLSM";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState("login");
  const [currentPath, setCurrentPath] = useState("/");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isRegisterView = authView === "register";

  const showLoginPage = () => setAuthView("login");
  const showRegisterPage = () => setAuthView("register");

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);

  const handleNavigation = (path) => {
    setCurrentPath(path);
    closeMobileSidebar();
  };

  const pageContent = useMemo(() => {
    if (currentPath === "/settings") {
      return <SettingsPlaceholder />;
    }

    const PageComponent = ROUTE_COMPONENTS[currentPath] ?? DashboardPage;
    return <PageComponent />;
  }, [currentPath]);

  if (!isAuthenticated) {
    return isRegisterView ? (
      <RegisterPage onNavigateToLogin={showLoginPage} />
    ) : (
      <LoginPage onNavigateToRegister={showRegisterPage} />
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block">
        <SidebarNav currentPath={currentPath} onNavigate={handleNavigation} />
      </div>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <SidebarNav currentPath={currentPath} onNavigate={handleNavigation} />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={closeMobileSidebar}
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background p-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={openMobileSidebar}>
            <Menu className="size-5" />
          </Button>
          <h2 className="truncate">{brandTitle}</h2>
        </div>

        <div className="container mx-auto max-w-7xl p-4 sm:p-6">
          {pageContent}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Pengaturan</h1>
        <p className="text-muted-foreground mt-2">
          Kelola pengaturan akun dan preferensi Anda
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Halaman pengaturan sedang dalam pengembangan
      </div>
    </div>
  );
}

import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/lib/error-boundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import { SectionPage } from "@/pages/SectionPage";
import HotelPage from "@/pages/hotel/HotelPage";
import PurchasesPage from "@/pages/purchases/PurchasesPage";
import CashPage from "@/pages/cash/CashPage";
import AccountsPage from "@/pages/accounts/AccountsPage";
import FinancialReportsPage from "@/pages/reports/FinancialReportsPage";
import FundReportsPage from "@/pages/fund-reports/FundReportsPage";
import CashReportsPage from "@/pages/cash-reports/CashReportsPage";
import InventoryReportsPage from "@/pages/inventory-reports/InventoryReportsPage";
import ProfitReportsPage from "@/pages/profit-reports/ProfitReportsPage";
import WarehousesPage from "@/pages/warehouses/WarehousesPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import AttendancePage from "@/pages/attendance/AttendancePage";
import { Building2 } from "lucide-react";

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route
                path="about"
                element={
                  <SectionPage
                    title="اسم الشركة"
                    icon={Building2}
                    description="نبذة عامة عن الشركة المطورة للنظام"
                    accentColor="text-teal-500"
                  />
                }
              />
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route path="hotel" element={<HotelPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="cash" element={<CashPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="financial-reports" element={<FinancialReportsPage />} />
              <Route path="fund-reports" element={<FundReportsPage />} />
              <Route path="cash-reports" element={<CashReportsPage />} />
              <Route path="inventory-reports" element={<InventoryReportsPage />} />
              <Route path="profit-reports" element={<ProfitReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

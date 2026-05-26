import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthSessionHandler from './components/AuthSessionHandler';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ExpiryAlertsPage from './pages/ExpiryAlertsPage';
import StockInPage from './pages/StockInPage';
import StockOutPage from './pages/StockOutPage';
import SuppliersPage from './pages/SuppliersPage';
import SalesPage from './pages/SalesPage';
import CategoriesPage from './pages/CategoriesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

const allNavRoutes = [
  { path: '/dashboard', title: 'Dashboard', icon: 'bi-house', guest: true },
  { path: '/inventory', title: 'Inventory', icon: 'bi-box-seam', guest: true },
  { path: '/expiry-alerts', title: 'Expiry Alerts', icon: 'bi-calendar-x', guest: true },
  { path: '/stock-in', title: 'Stock In', icon: 'bi-box-arrow-in-down', adminOnly: true },
  { path: '/stock-out', title: 'Stock Out', icon: 'bi-box-arrow-up', adminOnly: true },
  { path: '/suppliers', title: 'Suppliers', icon: 'bi-truck', guest: true },
  { path: '/sales', title: 'Sales', icon: 'bi-currency-dollar', adminOnly: true },
  { path: '/categories', title: 'Categories', icon: 'bi-tags', guest: true },
  { path: '/notifications', title: 'Notifications', icon: 'bi-bell', guest: true },
  { path: '/reports', title: 'Reports', icon: 'bi-bar-chart-line', guest: true },
  { path: '/settings', title: 'Settings', icon: 'bi-gear', adminOnly: true },
];

const pages = {
  dashboard: DashboardPage,
  inventory: InventoryPage,
  'expiry-alerts': ExpiryAlertsPage,
  'stock-in': StockInPage,
  'stock-out': StockOutPage,
  suppliers: SuppliersPage,
  sales: SalesPage,
  categories: CategoriesPage,
  notifications: NotificationsPage,
  reports: ReportsPage,
  settings: SettingsPage,
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthSessionHandler />
        <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout allNavRoutes={allNavRoutes} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          {allNavRoutes.map((r) => {
            const slug = r.path.slice(1);
            const Page = pages[slug];
            return (
              <Route
                key={r.path}
                path={slug}
                element={
                  <ProtectedRoute adminOnly={r.adminOnly}>
                    <Page />
                  </ProtectedRoute>
                }
              />
            );
          })}
        </Route>
        <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

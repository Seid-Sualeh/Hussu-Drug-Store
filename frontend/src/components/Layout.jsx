import { useState, useEffect, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FooterLegend from "./FooterLegend";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const SIDEBAR_KEY = "medicare_sidebar_collapsed";

export default function Layout({ allNavRoutes }) {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const navRoutes = useMemo(
    () =>
      allNavRoutes.filter((r) => (isAdmin ? true : r.guest && !r.adminOnly)),
    [allNavRoutes, isAdmin],
  );

  const hideFooter = ["/", "/dashboard", "/reports"].includes(
    location.pathname,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    api
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [location.pathname, loadStats]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setSidebarOpen(false);
  };

  const handleMenuClick = () => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(true);
    } else {
      toggleSidebarCollapse();
    }
  };

  return (
    <div
      className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}
    >
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        navRoutes={navRoutes}
        stats={stats}
        statsLoading={statsLoading}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-wrapper">
        <Topbar
          stats={stats}
          statsLoading={statsLoading}
          onMenuClick={handleMenuClick}
          onAddMedicine={() =>
            window.dispatchEvent(new CustomEvent("open-medicine-modal"))
          }
          onLogout={logout}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="main-content">
          <Outlet context={{ stats, refreshStats: loadStats, statsLoading }} />
        </main>
        {!hideFooter && (
          <div className="px-3 pb-3">
            <FooterLegend />
          </div>
        )}
      </div>
    </div>
  );
}

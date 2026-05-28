import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatNumber, api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Topbar({
  stats,
  statsLoading,
  onMenuClick,
  onAddMedicine,
  onLogout,
  sidebarCollapsed,
}) {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 992);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const { user, canEdit, isGuest } = useAuth();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchNotifCount = async () => {
      setNotifLoading(true);
      try {
        const data = await api.getNotificationCount();
        setNotifCount(data.count ?? 0);
      } catch {
        setNotifCount(0);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleIcon = isMobile
    ? "bi-list"
    : sidebarCollapsed
      ? "bi-layout-text-sidebar"
      : "bi-layout-text-sidebar-reverse";

  const notifCountDisplay = notifLoading ? null : notifCount;

  return (
    <header className="topbar">
      <button
        type="button"
        className={`topbar-menu-btn ${sidebarCollapsed ? "is-collapsed" : ""}`}
        onClick={onMenuClick}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i className={`bi ${toggleIcon}`} />
      </button>

      <div className="topbar-search">
        <i className="bi bi-search" />
        <input
          type="text"
          placeholder="Search medicine, category, supplier..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && globalSearch.trim()) {
              const q = encodeURIComponent(globalSearch.trim());
              navigate(`/inventory?search=${q}`);
              window.dispatchEvent(
                new CustomEvent("inventory-search", {
                  detail: globalSearch.trim(),
                }),
              );
            }
          }}
        />
      </div>

      <div className="topbar-badges">
        {isGuest && (
          <span
            className="alert-badge"
            style={{ background: "#dbeafe", color: "#1d4ed8" }}
          >
            <i className="bi bi-eye" />
            View only
          </span>
        )}
        <span className="alert-badge low-stock">
          <i className="bi bi-exclamation-triangle-fill" />
          Low Stock: {statsLoading
            ? "…"
            : formatNumber(stats?.lowStock ?? 0)}{" "}
          items
        </span>
        <span className="alert-badge expiring">
          <i className="bi bi-clock-history" />
          Expiring Soon:{" "}
          {statsLoading
            ? "…"
            : formatNumber(stats?.expiringIn6Months ?? 0)}{" "}
          items
        </span>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="notification-btn"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <i className="bi bi-bell" />
          {notifCountDisplay > 0 && (
            <span className="badge-dot">{notifCountDisplay}</span>
          )}
        </button>

        <div className="user-profile">
          <div className="user-avatar">{user?.avatar_initials || "—"}</div>
          <div className="user-info">
            <div className="name">{user?.name || "—"}</div>
            <div className="role">
              {user?.role === "admin" ? "Admin" : "Guest"}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-outline-green btn-sm ms-1"
          onClick={onLogout}
          title="Sign out"
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </header>
  );
}

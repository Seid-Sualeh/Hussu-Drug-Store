import { NavLink } from "react-router-dom";
import { formatETB, formatNumber } from "../api/client";

export default function Sidebar({
  navRoutes,
  stats,
  statsLoading,
  open,
  collapsed,
  onClose,
}) {
  return (
    <aside
      className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
    >
      <div className="sidebar-logo">
        <div className="logo-icon moon-icon">
          <i className="bi bi-moon-stars-fill" />
        </div>
        {!collapsed && (
          <h1>
            Hussu
            <br />
            Drug Store
          </h1>
        )}
      </div>

      <nav className="sidebar-nav">
        {navRoutes.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onClose}
            title={collapsed ? item.title : undefined}
          >
            <i className={`bi ${item.icon}`} />
            {!collapsed && (
              <span className="sidebar-link-text">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-card">
          <div className="label">Inventory Value</div>
          <div className="value">
            {statsLoading ? (
              <span className="placeholder-glow">
                <span className="placeholder col-8" />
              </span>
            ) : stats ? (
              formatETB(stats.inventoryValue)
            ) : (
              "—"
            )}
          </div>
          <div className="sub">
            Total Items:{" "}
            <strong>
              {statsLoading
                ? "…"
                : stats
                  ? formatNumber(stats.totalItems)
                  : "—"}
            </strong>
          </div>
          <NavLink to="/reports" onClick={onClose}>
            <i className="bi bi-bar-chart-line" />
            View Full Report
          </NavLink>
        </div>
      )}

      {collapsed && (
        <div
          className="sidebar-card-mini"
          title={`Inventory: ${stats ? formatETB(stats.inventoryValue) : "—"}`}
        >
          <i className="bi bi-safe" />
          <span className="mini-value">
            {statsLoading ? "…" : stats ? formatNumber(stats.totalItems) : "—"}
          </span>
        </div>
      )}
    </aside>
  );
}

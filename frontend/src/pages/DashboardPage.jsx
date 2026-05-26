import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import SummaryCards from '../components/SummaryCards';
import { useAuth } from '../context/AuthContext';
import { api, formatETB, formatDate, formatNumber } from '../api/client';
import '../styles/dashboard.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [usingFallback, setUsingFallback] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoadError(null);
    api
      .getDashboard()
      .then((d) => {
        setData(d);
        setUsingFallback(Boolean(d._fallback));
      })
      .catch((err) => {
        console.error(err);
        setLoadError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = (rows, headers, filename) => {
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportExcel = () => {
    if (!data?.expiryAlerts?.length) return;
    exportCsv(
      data.expiryAlerts.map((r) => [r.name, r.expiryDate, r.daysLabel, r.status]),
      ['Medicine', 'Expiry Date', 'Days Left', 'Status'],
      'medicare-dashboard-export.csv'
    );
  };

  const handleExpiryReport = () => {
    if (!data?.expiryAlerts?.length) return;
    exportCsv(
      data.expiryAlerts.map((r) => [
        r.displayName,
        formatDate(r.expiryDate),
        r.daysLabel,
        r.alert,
      ]),
      ['Medicine', 'Expiry Date', 'Days Left', 'Alert'],
      'medicare-expiry-report.csv'
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page text-center py-5">
        <div className="spinner-border text-success" />
        <p className="mt-2 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-page">
        <div className="alert alert-danger">
          {loadError || 'Could not load dashboard. Ensure the backend is running on port 5000.'}
        </div>
        <p className="text-muted small">
          Start MySQL and the backend, then open{' '}
          <a href="http://localhost:5000/install" target="_blank" rel="noreferrer">
            http://localhost:5000/install
          </a>
          .
        </p>
      </div>
    );
  }

  const { summary, stockChart, expiryAlerts, profitByCategory, categoryDistribution, supplierPerformance, shelfTracking, urgentReorder } = data;

  const stockChartData = {
    labels: ['Under Stock', 'Normal', 'Over Stock', 'Out of Stock'],
    datasets: [
      {
        data: [
          stockChart.underStock,
          stockChart.normal,
          stockChart.overStock,
          stockChart.outOfStock,
        ],
        backgroundColor: ['#ef4444', '#10b981', '#8b5cf6', '#9ca3af'],
        borderWidth: 0,
      },
    ],
  };

  const profitChartData = {
    labels: profitByCategory.map((p) =>
      p.category.length > 22 ? `${p.category.slice(0, 20)}…` : p.category
    ),
    datasets: [
      {
        label: 'Profit (ETB)',
        data: profitByCategory.map((p) => p.profit),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="dashboard-page">
      {usingFallback && (
        <div className="alert alert-warning py-2 small mb-0">
          <i className="bi bi-info-circle me-1" />
          Showing demo data until MySQL is connected. Open{' '}
          <a href="http://localhost:5000/install" target="_blank" rel="noreferrer">
            localhost:5000/install
          </a>
          .
        </div>
      )}

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Quick answers for stock, expiry, profit, categories, suppliers & shelves</p>
        </div>
        <div className="quick-actions">
          {canEdit && (
            <button
              type="button"
              className="btn-action primary"
              onClick={() => window.dispatchEvent(new CustomEvent('open-medicine-modal'))}
            >
              <i className="bi bi-plus-lg" /> Add Medicine
            </button>
          )}
          <button type="button" className="btn-action" onClick={handleExportExcel}>
            <i className="bi bi-file-earmark-excel" /> Export Excel
          </button>
          <button type="button" className="btn-action" onClick={() => window.print()}>
            <i className="bi bi-printer" /> Print Report
          </button>
          <button type="button" className="btn-action" onClick={handleExpiryReport}>
            <i className="bi bi-calendar-x" /> Generate Expiry Report
          </button>
        </div>
      </div>

      {/* Design summary cards: Total Medicines, Total Quantity, Expiring, Low/Over/Out Stock */}
      <SummaryCards
        stats={{
          totalMedicines: summary.totalMedicines,
          totalQuantity: summary.totalQuantity,
          expiringIn6Months: summary.expiringIn6Months,
          lowStock: summary.lowStock ?? summary.underStock,
          overStock: summary.overStock,
          outOfStock: summary.outOfStock,
        }}
        onFilter={(filter) => {
          const params = new URLSearchParams();
          if (filter.expiry) params.set('expiry', filter.expiry);
          if (filter.stockStatus) params.set('stockStatus', filter.stockStatus);
          const q = params.toString();
          navigate(q ? `/inventory?${q}` : '/inventory');
        }}
      />

      {/* Extra metrics row */}
      <div className="dashboard-summary dashboard-summary-2">
        <div className="dash-card d-flex justify-content-between align-items-start highlight-profit">
          <div>
            <div className="label">Total Profit (Stock)</div>
            <div className="value">{formatETB(summary.totalProfit)}</div>
          </div>
          <div className="icon-wrap" style={{ background: '#d1fae5', color: '#059669' }}>
            <i className="bi bi-currency-exchange" />
          </div>
        </div>
        <div className="dash-card d-flex justify-content-between align-items-start">
          <div>
            <div className="label">Total Inventory Value</div>
            <div className="value">{formatETB(summary.inventoryValue)}</div>
          </div>
          <div className="icon-wrap" style={{ background: '#ccfbf1', color: '#0d9488' }}>
            <i className="bi bi-safe" />
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2">
        {/* 2. Expiry alerts */}
        <div className="dashboard-panel">
          <h3>
            <i className="bi bi-exclamation-triangle text-warning" />
            Expiry Alert Section
          </h3>
          <div className="expiry-legend">
            <span><span className="legend-dot red" /> Expired</span>
            <span><span className="legend-dot orange" /> Expiring Soon (≤180 days)</span>
            <span><span className="legend-dot green" /> Safe</span>
          </div>
          <div className="table-responsive">
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiryAlerts.slice(0, 12).map((row) => (
                  <tr key={row.id} className={`expiry-row ${row.status}`}>
                    <td>
                      <strong>{row.name}</strong>
                      <div className="text-muted small">{row.strengthForm}</div>
                    </td>
                    <td>{formatDate(row.expiryDate)}</td>
                    <td>{row.daysLabel}</td>
                    <td>
                      <span className={`pill-badge ${row.status === 'expired' ? 'yes' : row.status === 'expiring' ? 'yes' : 'no'}`}>
                        {row.status === 'expired' ? 'Expired' : row.status === 'expiring' ? 'Expiring Soon' : 'Safe'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/expiry-alerts" className="small fw-semibold text-success mt-2 d-inline-block">
            View all expiry alerts →
          </Link>
        </div>

        {/* 3. Stock status chart */}
        <div className="dashboard-panel">
          <h3>
            <i className="bi bi-pie-chart text-success" />
            Stock Status
          </h3>
          <p className="text-muted small mb-3">Based on min limit, max limit & current quantity</p>
          <div className="chart-wrap">
            <Doughnut
              data={stockChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
          <div className="mt-3 d-flex gap-3 flex-wrap small">
            <span><strong>{stockChart.underStock}</strong> Under Stock</span>
            <span><strong>{stockChart.normal}</strong> Normal</span>
            <span><strong>{stockChart.overStock}</strong> Over Stock</span>
            <span><strong>{stockChart.outOfStock}</strong> Out of Stock</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2">
        {/* 4. Profit analytics */}
        <div className="dashboard-panel">
          <h3>
            <i className="bi bi-bar-chart-line text-success" />
            Profit Analytics by Category
          </h3>
          <p className="text-muted small mb-2">Profit = (Sell − Buy) × Qty | Profit % = (Profit ÷ Buy) × 100</p>
          <div className="chart-wrap" style={{ height: 300 }}>
            <Bar
              data={profitChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (v) => `ETB ${formatNumber(v)}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 5. Category distribution */}
        <div className="dashboard-panel">
          <h3>
            <i className="bi bi-grid-3x3-gap text-success" />
            Category Distribution
          </h3>
          <p className="text-muted small mb-3">Which category has the highest stock?</p>
          <div className="category-cards">
            {categoryDistribution.map((cat) => (
              <div key={cat.category} className="category-mini-card">
                <div className="cat-name">{cat.category}</div>
                <div className="cat-qty">{formatNumber(cat.totalQty)}</div>
                <div className="text-muted small">{cat.medicineCount} medicines</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-3">
        <div className="dashboard-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* 6. Supplier performance */}
          <div className="dashboard-panel">
            <h3>
              <i className="bi bi-truck text-success" />
              Supplier Performance
            </h3>
            <p className="text-muted small mb-3">Which supplier gives most products?</p>
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th className="text-end">Total Medicines</th>
                  <th className="text-end">Total Qty</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.map((s) => (
                  <tr key={s.supplier}>
                    <td>{s.supplier}</td>
                    <td className="text-end fw-semibold">{formatNumber(s.totalMedicines)}</td>
                    <td className="text-end text-muted">{formatNumber(s.totalQuantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 8. Urgent reorder */}
          <div className="dashboard-panel">
            <h3>
              <i className="bi bi-lightning-charge text-danger" />
              Urgent Reorder
            </h3>
            <p className="text-muted small mb-3">Medicines below min limit or out of stock</p>
            <div className="urgent-list">
              {urgentReorder.length === 0 ? (
                <p className="text-muted small">No urgent reorders needed.</p>
              ) : (
                urgentReorder.map((m) => (
                  <div key={m.id} className="urgent-item">
                    <div>
                      <strong>{m.name}</strong>
                      <div className="text-muted small">
                        Qty: {m.qty} / Min: {m.minLimit}
                      </div>
                    </div>
                    <span className="urgent-badge">{m.qty === 0 ? 'Out of Stock' : 'Under Stock'}</span>
                  </div>
                ))
              )}
            </div>
            <Link to="/inventory?stockStatus=under" className="small fw-semibold text-success mt-2 d-inline-block">
              View in inventory →
            </Link>
          </div>
        </div>

        {/* 7. Shelf tracking */}
        <div className="dashboard-panel">
          <h3>
            <i className="bi bi-map text-success" />
            Shelf Tracking
          </h3>
          <p className="text-muted small mb-3">Which shelf contains which medicine?</p>
          <div className="shelf-grid">
            {shelfTracking.map((s) => (
              <div key={s.shelf} className="shelf-card" title={s.medicines?.map((m) => m.name).join(', ')}>
                <div className="shelf-code">{s.shelf}</div>
                <div className="shelf-count">{s.medicineCount}</div>
                <div className="shelf-label">medicines</div>
              </div>
            ))}
          </div>
          {shelfTracking[0]?.medicines?.length > 0 && (
            <div className="mt-3 small text-muted">
              <strong>Example {shelfTracking[0].shelf}:</strong>{' '}
              {shelfTracking[0].medicines.map((m) => m.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

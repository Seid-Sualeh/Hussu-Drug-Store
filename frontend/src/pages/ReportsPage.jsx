import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { api, formatETB, formatDate, formatNumber, downloadCsv } from '../api/client';
import '../styles/pages.css';

const TABS = [
  { id: 'summary', label: 'Summary', icon: 'bi-clipboard-data' },
  { id: 'expiry', label: 'Expiry Report', icon: 'bi-calendar-x' },
  { id: 'stock', label: 'Stock Movements', icon: 'bi-arrow-left-right' },
  { id: 'sales', label: 'Sales Report', icon: 'bi-graph-up' },
  { id: 'lowstock', label: 'Low Stock / Reorder', icon: 'bi-exclamation-triangle' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('summary');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const loaders = {
      summary: () => api.getReportSummary(),
      expiry: () => api.getReportExpiry(),
      stock: () => api.getReportStock(),
      sales: () => api.getReportSales(),
      lowstock: () => api.getReportLowStock(),
    };
    loaders[tab]()
      .then((result) => setData((d) => ({ ...d, [tab]: result })))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const exportCurrent = () => {
    const d = data[tab];
    if (!d) return;
    if (tab === 'expiry' && Array.isArray(d)) {
      downloadCsv(
        'expiry-report.csv',
        ['Medicine', 'Form', 'Category', 'Expiry', 'Days Left', 'Qty'],
        d.map((r) => [r.name, r.strength_form, r.category, r.expiry_date, r.days_left, r.qty])
      );
    } else if (tab === 'lowstock' && Array.isArray(d)) {
      downloadCsv(
        'low-stock-report.csv',
        ['Medicine', 'Form', 'Category', 'Qty', 'Min', 'Max'],
        d.map((r) => [r.name, r.strength_form, r.category, r.qty, r.min_limit, r.max_limit])
      );
    }
  };

  const summary = data.summary;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Export and analyze inventory, expiry, sales & stock data"
        icon="bi-bar-chart-line"
        action={
          <button type="button" className="btn-outline-green" onClick={exportCurrent}>
            <i className="bi bi-download" /> Export CSV
          </button>
        }
      />

      <div className="report-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`report-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon} me-1`} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-panel text-center py-5">
          <div className="spinner-border text-success" />
        </div>
      ) : (
        <>
          {tab === 'summary' && summary && (
            <div>
              <div className="stat-row">
                <div className="stat-box">
                  <div className="label">Total Medicines</div>
                  <div className="value">{formatNumber(summary.inventory.medicines)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Inventory Value</div>
                  <div className="value">{formatETB(summary.inventory.inventoryValue)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Potential Profit</div>
                  <div className="value">{formatETB(summary.inventory.potentialProfit)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Sales (30 days)</div>
                  <div className="value">{formatNumber(summary.salesLast30Days.count)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Revenue (30 days)</div>
                  <div className="value">{formatETB(summary.salesLast30Days.revenue)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Profit (30 days)</div>
                  <div className="value">{formatETB(summary.salesLast30Days.profit)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Stock In (30 days)</div>
                  <div className="value">{formatNumber(summary.stockLast30Days.stockIn)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Stock Out (30 days)</div>
                  <div className="value">{formatNumber(summary.stockLast30Days.stockOut)}</div>
                </div>
              </div>
              <div className="page-panel">
                <h3>Quick Report Actions</h3>
                <div className="quick-actions">
                  <button type="button" className="btn-action" onClick={() => window.print()}>
                    <i className="bi bi-printer" /> Print Report
                  </button>
                  <button type="button" className="btn-action" onClick={() => setTab('expiry')}>
                    <i className="bi bi-calendar-x" /> Expiry Report
                  </button>
                  <button type="button" className="btn-action" onClick={() => setTab('lowstock')}>
                    <i className="bi bi-exclamation-triangle" /> Reorder Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'expiry' && data.expiry && (
            <div className="page-panel">
              <h3>Expiry Report — የሚያበቃበት ቀን</h3>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Form</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiry.map((r, i) => (
                    <tr key={i} className={r.days_left < 0 ? 'expiry-row expired' : r.days_left <= 180 ? 'expiry-row expiring' : ''}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.strength_form}</td>
                      <td>{r.category || '—'}</td>
                      <td>{formatDate(r.expiry_date)}</td>
                      <td>{r.days_left < 0 ? `Expired ${Math.abs(r.days_left)}d` : `${r.days_left} days`}</td>
                      <td>{r.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'stock' && data.stock && (
            <div className="page-panel">
              <h3>Stock Movement Report</h3>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stock.map((r, i) => (
                    <tr key={i}>
                      <td>{formatDate(r.created_at)}</td>
                      <td>
                        <span className={r.type === 'in' ? 'badge-in' : 'badge-out'}>
                          {r.type === 'in' ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td>{r.medicine_name}</td>
                      <td>{r.quantity}</td>
                      <td>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'sales' && data.sales && (
            <div>
              <div className="page-panel">
                <h3>Sales by Category</h3>
                <table className="page-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-end">Units</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.byCategory?.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.category}</strong></td>
                        <td className="text-end">{formatNumber(r.units)}</td>
                        <td className="text-end">{formatETB(r.revenue)}</td>
                        <td className="text-end text-success fw-semibold">{formatETB(r.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="page-panel">
                <h3>Daily Sales (Last 30 Days)</h3>
                <table className="page-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Sales</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.byDay?.map((r, i) => (
                      <tr key={i}>
                        <td>{formatDate(r.date)}</td>
                        <td className="text-end">{r.sales}</td>
                        <td className="text-end">{formatETB(r.revenue)}</td>
                        <td className="text-end">{formatETB(r.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'lowstock' && data.lowstock && (
            <div className="page-panel">
              <h3>Low Stock & Urgent Reorder Report</h3>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Form</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Min Limit</th>
                    <th>Max Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowstock.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.strength_form}</td>
                      <td>{r.category || '—'}</td>
                      <td className="fw-semibold text-danger">{r.qty}</td>
                      <td>{r.min_limit}</td>
                      <td>{r.max_limit}</td>
                      <td>
                        <span className="urgent-badge">{r.qty === 0 ? 'Out of Stock' : 'Under Stock'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

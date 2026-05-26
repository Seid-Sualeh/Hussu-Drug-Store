import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api/client';
import '../styles/dashboard.css';

export default function ExpiryAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((d) => setAlerts(d.expiryAlerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Expiry Alerts</h1>
          <p>የሚያበቃበት ቀን · ማስጠንቀቂያ — medicines expiring within 6 months or already expired</p>
        </div>
        <Link to="/dashboard" className="btn-outline-green text-decoration-none">
          <i className="bi bi-speedometer2" /> Back to Dashboard
        </Link>
      </div>

      <div className="dashboard-panel">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" />
          </div>
        ) : (
          <>
            <div className="expiry-legend">
              <span><span className="legend-dot red" /> Expired</span>
              <span><span className="legend-dot orange" /> Expiring Soon</span>
              <span><span className="legend-dot green" /> Safe</span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No expiry alerts in the next 6 months.</p>
            ) : (
            <div className="table-responsive">
              <table className="expiry-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Alert</th>
                    <th>Qty</th>
                    <th>Shelf</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((row, i) => (
                    <tr key={row.id} className={`expiry-row ${row.status}`}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{row.name}</strong>
                        <div className="text-muted small">{row.strengthForm}</div>
                      </td>
                      <td>{row.categoryName}</td>
                      <td>{formatDate(row.expiryDate)}</td>
                      <td>{row.daysLabel}</td>
                      <td>{row.alert}</td>
                      <td>{row.qty}</td>
                      <td>{row.shelfNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api, formatDateTime } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import '../styles/pages.css';

const TYPE_LABELS = {
  low_stock: { label: 'Low Stock', icon: 'bi-exclamation-triangle-fill', color: 'text-warning' },
  expiry: { label: 'Expiry', icon: 'bi-calendar-x-fill', color: 'text-danger' },
  over_stock: { label: 'Over Stock', icon: 'bi-box-seam', color: 'text-info' },
  system: { label: 'System', icon: 'bi-gear-fill', color: 'text-muted' },
};

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
    } catch (err) {
      showToast(err.message);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="System alerts and important updates"
        icon="bi-bell"
      />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="alert alert-light text-center">No notifications to display.</div>
      ) : (
        <div className="page-panel">
          <div className="table-responsive">
            <table className="page-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const typeInfo = TYPE_LABELS[n.type] || TYPE_LABELS.system;
                  return (
                    <tr key={n.id} className={n.isRead ? '' : 'bg-light'}>
                      <td>
                        <span
                          className={`badge ${
                            n.isRead ? 'bg-secondary' : 'bg-primary'
                          }`}
                        >
                          {n.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td>
                        <i className={`bi ${typeInfo.icon} ${typeInfo.color}`} />{' '}
                        {typeInfo.label}
                      </td>
                      <td>
                        <strong>{n.title}</strong>
                      </td>
                      <td>{n.message}</td>
                      <td>{formatDateTime(n.createdAt)}</td>
                      <td>
                        {!n.isRead && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            disabled={markingId === n.id}
                            onClick={() => handleMarkRead(n.id)}
                          >
                            {markingId === n.id ? '…' : 'Mark Read'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
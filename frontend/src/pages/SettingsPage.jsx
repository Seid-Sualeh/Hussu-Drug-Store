import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    pharmacy_name: '',
    currency: 'ETB',
    expiry_alert_days: '180',
    low_stock_alert: '1',
    email: '',
    phone: '',
    address: '',
    tax_rate: '0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Pharmacy profile, alerts, currency & contact information"
        icon="bi-gear"
      />

      <div className="page-grid-2">
        <div className="page-panel form-panel">
          <h3>Pharmacy Settings</h3>
          {saved && (
            <div className="alert alert-success py-2 small">Settings saved successfully.</div>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Pharmacy Name</Form.Label>
              <Form.Control
                value={settings.pharmacy_name}
                onChange={(e) => handleChange('pharmacy_name', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="INR">INR (Indian Rupee)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Alert (days)</Form.Label>
              <Form.Control
                type="number"
                value={settings.expiry_alert_days}
                onChange={(e) => handleChange('expiry_alert_days', e.target.value)}
              />
              <Form.Text className="text-muted">Alert when expiry is within this many days (default 180)</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Low Stock Alerts</Form.Label>
              <Form.Select
                value={settings.low_stock_alert}
                onChange={(e) => handleChange('low_stock_alert', e.target.value)}
              >
                <option value="1">Enabled</option>
                <option value="0">Disabled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tax Rate (%)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                value={settings.tax_rate}
                onChange={(e) => handleChange('tax_rate', e.target.value)}
              />
            </Form.Group>
            <hr />
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="btn-primary-green border-0" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Form>
        </div>

        <div className="page-panel">
          <h3>System Info</h3>
          <ul className="list-unstyled small text-muted">
            <li className="mb-2"><i className="bi bi-check-circle text-success me-2" />React + Vite frontend</li>
            <li className="mb-2"><i className="bi bi-check-circle text-success me-2" />Node.js + Express API</li>
            <li className="mb-2"><i className="bi bi-check-circle text-success me-2" />MySQL database</li>
            <li className="mb-2"><i className="bi bi-check-circle text-success me-2" />Bootstrap 5 UI</li>
            <li className="mb-2"><i className="bi bi-check-circle text-success me-2" />Chart.js analytics</li>
          </ul>
          <hr />
          <h3 className="h6">Stock Status Logic</h3>
          <pre className="small bg-light p-3 rounded" style={{ fontSize: 11 }}>
{`if (qty < minLimit) → Under Stock
else if (qty > maxLimit) → Over Stock
else → Normal

profit = sellPrice - buyPrice
profit% = (profit / buyPrice) × 100

if (daysLeft ≤ 180) → Expiring Soon`}
          </pre>
        </div>
      </div>
    </div>
  );
}

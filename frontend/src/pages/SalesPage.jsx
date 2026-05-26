import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api, formatETB, formatDateTime, formatNumber } from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

export default function SalesPage() {
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicineId: '',
    quantity: '',
    unitPrice: '',
    customerName: '',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getInventory({ limit: 500, page: 1 }),
      api.getSales({ limit: 50 }),
    ])
      .then(([inv, data]) => {
        setMedicines(inv.items);
        setSales(data.items);
        setSummary(data.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const selected = medicines.find((m) => m.id === Number(form.medicineId));

  useEffect(() => {
    if (selected) {
      setForm((f) => ({ ...f, unitPrice: String(selected.sellPrice) }));
    } else {
      setForm((f) => ({ ...f, unitPrice: '' }));
    }
  }, [form.medicineId, selected?.id, selected?.sellPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createSale({
        medicineId: Number(form.medicineId),
        quantity: Number(form.quantity),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        customerName: form.customerName,
        notes: form.notes,
      });
      setForm({ medicineId: '', quantity: '', unitPrice: '', customerName: '', notes: '' });
      load();
      showToast('Sale recorded successfully.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const profitPreview =
    selected && form.quantity && form.unitPrice
      ? (Number(form.unitPrice) - selected.buyPrice) * Number(form.quantity)
      : 0;

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Record sales — updates stock & tracks profit (የገዛኸው / የሽያጭ / ትርፍ)"
        icon="bi-currency-dollar"
      />

      {summary && (
        <div className="stat-row">
          <div className="stat-box">
            <div className="label">Total Sales</div>
            <div className="value">{formatNumber(summary.totalSales)}</div>
          </div>
          <div className="stat-box">
            <div className="label">Total Revenue</div>
            <div className="value" style={{ color: 'var(--primary)' }}>{formatETB(summary.totalRevenue)}</div>
          </div>
          <div className="stat-box">
            <div className="label">Total Profit</div>
            <div className="value" style={{ color: 'var(--primary)' }}>{formatETB(summary.totalProfit)}</div>
          </div>
          <div className="stat-box">
            <div className="label">Units Sold</div>
            <div className="value">{formatNumber(summary.totalUnits)}</div>
          </div>
        </div>
      )}

      <div className="page-grid-2">
        <div className="page-panel form-panel">
          <h3><i className="bi bi-cart-plus text-success" /> New Sale</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Medicine *</Form.Label>
              <Form.Select
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value, unitPrice: '' })}
                required
              >
                <option value="">Select medicine</option>
                {medicines.filter((m) => m.qty > 0).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Stock: {m.qty} · Sell: {formatETB(m.sellPrice)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selected && (
              <p className="small text-muted mb-2">
                Buy: {formatETB(selected.buyPrice)} · Sell: {formatETB(selected.sellPrice)} ·
                Profit/unit: {formatETB(selected.sellPrice - selected.buyPrice)}
              </p>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={selected?.qty}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sell Price (ETB) *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
              />
            </Form.Group>
            {profitPreview > 0 && (
              <p className="small fw-semibold text-success mb-3">
                Estimated profit: {formatETB(profitPreview)}
              </p>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Form.Control
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Walk-in / Clinic name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Form.Group>
            <Button type="submit" className="btn-primary-green border-0 w-100" disabled={saving}>
              {saving ? 'Processing...' : 'Record Sale'}
            </Button>
          </Form>
        </div>

        <div className="page-panel">
          <h3>Sales History</h3>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-success" /></div>
          ) : (
            <div className="table-responsive">
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Profit</th>
                    <th>%</th>
                    <th>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDateTime(s.createdAt)}</td>
                      <td><strong>{s.medicineName}</strong></td>
                      <td>{s.quantity}</td>
                      <td>{formatETB(s.unitPrice)}</td>
                      <td className="fw-semibold">{formatETB(s.totalAmount)}</td>
                      <td className="text-success fw-semibold">{formatETB(s.profit)}</td>
                      <td>{s.profitPct}</td>
                      <td>{s.customerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

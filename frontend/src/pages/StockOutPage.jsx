import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api, formatDateTime, formatNumber } from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

export default function StockOutPage() {
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicineId: '',
    quantity: '',
    reason: 'Dispensed',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getInventory({ limit: 500, page: 1 }),
      api.getStockMovements({ type: 'out', limit: 30 }),
    ])
      .then(([inv, stock]) => {
        setMedicines(inv.items);
        setMovements(stock.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.stockOut({
        medicineId: Number(form.medicineId),
        quantity: Number(form.quantity),
        reason: form.reason,
        notes: form.notes,
      });
      setForm({ medicineId: '', quantity: '', reason: 'Dispensed', notes: '' });
      load();
      showToast('Stock removed successfully.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selected = medicines.find((m) => m.id === Number(form.medicineId));

  return (
    <div>
      <PageHeader
        title="Stock Out"
        subtitle="Remove stock for dispensing, expiry disposal, or transfers"
        icon="bi-box-arrow-up"
      />

      <div className="page-grid-2">
        <div className="page-panel form-panel">
          <h3><i className="bi bi-dash-circle text-warning" /> Record Stock Out</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Medicine *</Form.Label>
              <Form.Select
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                required
              >
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Available: {m.qty}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selected && (
              <p className="small text-muted mb-3">
                Available: <strong>{formatNumber(selected.qty)}</strong> · Min limit: {selected.minLimit}
              </p>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={selected?.qty || undefined}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option>Dispensed</option>
                <option>Expired disposal</option>
                <option>Damaged</option>
                <option>Transfer Out</option>
                <option>Sample</option>
                <option>Other</option>
              </Form.Select>
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
              {saving ? 'Saving...' : 'Record Stock Out'}
            </Button>
          </Form>
        </div>

        <div className="page-panel">
          <h3>Recent Stock Out History</h3>
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
                    <th>Reason</th>
                    <th>Before → After</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.createdAt)}</td>
                      <td><strong>{m.medicineName}</strong></td>
                      <td><span className="badge-out">-{m.quantity}</span></td>
                      <td>{m.reason}</td>
                      <td>{m.previousQty} → <strong>{m.newQty}</strong></td>
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

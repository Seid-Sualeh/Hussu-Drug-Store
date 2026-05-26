import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api, formatDateTime, formatNumber } from '../api/client';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

export default function StockInPage() {
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicineId: '',
    quantity: '',
    supplierId: '',
    referenceNo: '',
    reason: 'Purchase Order',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getInventory({ limit: 500, page: 1 }),
      api.getSuppliersFull(),
      api.getStockMovements({ type: 'in', limit: 30 }),
    ])
      .then(([inv, sup, stock]) => {
        setMedicines(inv.items);
        setSuppliers(sup);
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
      await api.stockIn({
        medicineId: Number(form.medicineId),
        quantity: Number(form.quantity),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        referenceNo: form.referenceNo,
        reason: form.reason,
        notes: form.notes,
      });
      setForm({ medicineId: '', quantity: '', supplierId: '', referenceNo: '', reason: 'Purchase Order', notes: '' });
      load();
      showToast('Stock added successfully.', 'success');
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
        title="Stock In"
        subtitle="Receive medicines from suppliers — increases inventory quantity"
        icon="bi-box-arrow-in-down"
      />

      <div className="page-grid-2">
        <div className="page-panel form-panel">
          <h3><i className="bi bi-plus-circle text-success" /> Record Stock In</h3>
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
                    {m.name} — Qty: {m.qty}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selected && (
              <p className="small text-muted mb-3">
                Current stock: <strong>{formatNumber(selected.qty)}</strong> · Shelf: {selected.shelfNo}
              </p>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Supplier</Form.Label>
              <Form.Select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reference / PO No.</Form.Label>
              <Form.Control
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                placeholder="PO-2026-001"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option>Purchase Order</option>
                <option>Donation</option>
                <option>Return from customer</option>
                <option>Transfer In</option>
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
              {saving ? 'Saving...' : 'Add Stock In'}
            </Button>
          </Form>
        </div>

        <div className="page-panel">
          <h3>Recent Stock In History</h3>
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
                    <th>Supplier</th>
                    <th>Ref</th>
                    <th>Before → After</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.createdAt)}</td>
                      <td><strong>{m.medicineName}</strong></td>
                      <td><span className="badge-in">+{m.quantity}</span></td>
                      <td>{m.supplierName}</td>
                      <td>{m.referenceNo}</td>
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

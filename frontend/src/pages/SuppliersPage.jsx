import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api, formatNumber } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

const empty = { name: '', contactPhone: '', contactEmail: '', address: '' };

export default function SuppliersPage() {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getSuppliersFull().then(setSuppliers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const openAdd = () => {
    setEdit(null);
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEdit(s);
    setForm({
      name: s.name,
      contactPhone: s.contactPhone || '',
      contactEmail: s.contactEmail || '',
      address: s.address || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) await api.updateSupplier(edit.id, form);
      else await api.createSupplier(form);
      setShowModal(false);
      load();
      showToast(edit ? 'Supplier updated.' : 'Supplier added.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete supplier "${s.name}"? Medicines will be unlinked.`)) return;
    try {
      await api.deleteSupplier(s.id);
      load();
      showToast('Supplier deleted.', 'success');
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage pharmaceutical suppliers — አቅራቢ"
        icon="bi-truck"
        action={
          canEdit ? (
            <button type="button" className="btn-primary-green" onClick={openAdd}>
              <i className="bi bi-plus-lg" /> Add Supplier
            </button>
          ) : null
        }
      />

      <div className="page-panel">
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border text-success" /></div>
        ) : (
          <div className="table-responsive">
            <table className="page-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th className="text-end">Medicines</th>
                  <th className="text-end">Total Qty</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.contactPhone || '—'}</td>
                    <td>{s.contactEmail || '—'}</td>
                    <td>{s.address || '—'}</td>
                    <td className="text-end fw-semibold">{formatNumber(s.medicineCount)}</td>
                    <td className="text-end">{formatNumber(s.totalQty)}</td>
                    {canEdit && (
                      <td>
                        <button type="button" className="action-btn edit me-1" onClick={() => openEdit(s)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button type="button" className="action-btn delete" onClick={() => handleDelete(s)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canEdit && (
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{edit ? 'Edit Supplier' : 'Add Supplier'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-green border-0" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      )}
    </div>
  );
}

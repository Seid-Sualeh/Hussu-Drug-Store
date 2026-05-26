import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PageHeader from '../components/PageHeader';
import { api, formatNumber } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/pages.css';

const empty = { code: '', name: '', sortOrder: '' };

export default function CategoriesPage() {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getCategoriesFull().then(setCategories).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const openAdd = () => {
    setEdit(null);
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEdit(c);
    setForm({ code: c.code || '', name: c.name, sortOrder: String(c.sortOrder) });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { code: form.code, name: form.name, sortOrder: Number(form.sortOrder) || 99 };
      if (edit) await api.updateCategory(edit.id, body);
      else await api.createCategory(body);
      setShowModal(false);
      load();
      showToast(edit ? 'Category updated.' : 'Category added.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.deleteCategory(c.id);
      load();
      showToast('Category deleted.', 'success');
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize medicines by program — ARVs, TB, Maternal Health, Malaria, etc."
        icon="bi-tags"
        action={
          canEdit ? (
            <button type="button" className="btn-primary-green" onClick={openAdd}>
              <i className="bi bi-plus-lg" /> Add Category
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
                  <th>Code</th>
                  <th>Category Name</th>
                  <th>Sort</th>
                  <th className="text-end">Medicines</th>
                  <th className="text-end">Total Stock Qty</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.code && <span className="category-code-badge">{c.code}</span>}
                    </td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.sortOrder}</td>
                    <td className="text-end">{formatNumber(c.medicineCount)}</td>
                    <td className="text-end fw-semibold text-success">{formatNumber(c.totalQty)}</td>
                    {canEdit && (
                      <td>
                        <button type="button" className="action-btn edit me-1" onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button type="button" className="action-btn delete" onClick={() => handleDelete(c)}>
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
          <Modal.Title>{edit ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Code (e.g. A, B, M.1.2)</Form.Label>
              <Form.Control value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="A" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sort Order</Form.Label>
              <Form.Control type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-green border-0" disabled={saving}>Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      )}
    </div>
  );
}

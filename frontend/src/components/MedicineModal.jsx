import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

const emptyForm = {
  name: '',
  strengthForm: '',
  categoryId: '',
  supplierId: '',
  qty: 0,
  expiryDate: '',
  minLimit: 10,
  maxLimit: 500,
  buyPrice: '',
  sellPrice: '',
  shelfNo: '',
  notes: '',
};

export default function MedicineModal({
  show,
  onHide,
  onSave,
  medicine,
  categories,
  suppliers,
  saving,
}) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(medicine?.id);

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name || '',
        strengthForm: medicine.strengthForm || '',
        categoryId: medicine.categoryId || '',
        supplierId: medicine.supplierId || '',
        qty: medicine.qty ?? 0,
        expiryDate: medicine.expiryDate?.slice?.(0, 10) || medicine.expiryDate || '',
        minLimit: medicine.minLimit ?? 10,
        maxLimit: medicine.maxLimit ?? 500,
        buyPrice: medicine.buyPrice ?? '',
        sellPrice: medicine.sellPrice ?? '',
        shelfNo: medicine.shelfNo === '—' ? '' : medicine.shelfNo || '',
        notes: medicine.notes === '—' ? '' : medicine.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [medicine, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      strengthForm: form.strengthForm,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      qty: Number(form.qty),
      expiryDate: form.expiryDate,
      minLimit: Number(form.minLimit),
      maxLimit: Number(form.maxLimit),
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      shelfNo: form.shelfNo,
      notes: form.notes,
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Medicine' : 'Add Medicine'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Medicine Name</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} required />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Strength / Form</Form.Label>
                <Form.Control
                  name="strengthForm"
                  value={form.strengthForm}
                  onChange={handleChange}
                  placeholder="e.g. 500mg - Tablet"
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select name="categoryId" value={form.categoryId} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code}. ${c.name}` : c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Supplier</Form.Label>
                <Form.Select name="supplierId" value={form.supplierId} onChange={handleChange}>
                  <option value="">Select supplier</option>
                  {suppliers?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  name="qty"
                  min="0"
                  value={form.qty}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Expiry Date</Form.Label>
                <Form.Control
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Min Limit</Form.Label>
                <Form.Control
                  type="number"
                  name="minLimit"
                  min="0"
                  value={form.minLimit}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Max Limit</Form.Label>
                <Form.Control
                  type="number"
                  name="maxLimit"
                  min="1"
                  value={form.maxLimit}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Buy Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="buyPrice"
                  value={form.buyPrice}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Sell Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="sellPrice"
                  value={form.sellPrice}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Shelf No.</Form.Label>
                <Form.Control
                  name="shelfNo"
                  value={form.shelfNo}
                  onChange={handleChange}
                  placeholder="A-01-01"
                />
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary-green border-0" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Medicine' : 'Add Medicine'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

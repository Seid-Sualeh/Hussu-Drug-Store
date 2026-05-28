import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import InventoryTable from '../components/InventoryTable';
import PaginationBar from '../components/PaginationBar';
import MedicineModal from '../components/MedicineModal';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const defaultPagination = { page: 1, limit: 10, total: 0, totalPages: 1, from: 0, to: 0 };

export default function InventoryPage() {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const { refreshStats } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: 'all',
    search: searchParams.get('search') || '',
    expiry: searchParams.get('expiry') || 'all',
    stockStatus: searchParams.get('stockStatus') || 'all',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
      if (filters.search) params.search = filters.search;
      if (filters.expiry !== 'all') params.expiry = filters.expiry;
      if (filters.stockStatus !== 'all') params.stockStatus = filters.stockStatus;

      const data = await api.getInventory(params);
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, showToast]);

  useEffect(() => {
    const stock = searchParams.get('stockStatus');
    const expiry = searchParams.get('expiry');
    if (stock || expiry) {
      setFilters((f) => ({
        ...f,
        ...(stock && { stockStatus: stock }),
        ...(expiry && { expiry }),
      }));
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getSuppliers().then(setSuppliers).catch(console.error);
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    const openModal = () => {
      if (!canEdit) return;
      setEditMedicine(null);
      setShowModal(true);
    };
    const onSearch = (e) => {
      setFilters((f) => ({ ...f, search: e.detail }));
      setPage(1);
    };
    window.addEventListener('open-medicine-modal', openModal);
    window.addEventListener('inventory-search', onSearch);
    return () => {
      window.removeEventListener('open-medicine-modal', openModal);
      window.removeEventListener('inventory-search', onSearch);
    };
  }, [canEdit]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleSave = async (body) => {
    setSaving(true);
    try {
      const payload = { ...body };

      if (payload.newCategoryName) {
        const category = await api.createCategory({ name: payload.newCategoryName.trim() });
        payload.categoryId = category.id;
        await api.getCategories().then(setCategories).catch(console.error);
      }

      if (payload.newSupplierName) {
        const supplier = await api.createSupplier({ name: payload.newSupplierName.trim() });
        payload.supplierId = supplier.id;
        await api.getSuppliers().then(setSuppliers).catch(console.error);
      }

      delete payload.newCategoryName;
      delete payload.newSupplierName;

      if (editMedicine?.id) {
        await api.updateMedicine(editMedicine.id, payload);
      } else {
        await api.createMedicine(payload);
      }
      setShowModal(false);
      setEditMedicine(null);
      await loadInventory();
      refreshStats?.();
      showToast(editMedicine?.id ? 'Medicine updated.' : 'Medicine added.', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteMedicine(deleteTarget.id);
      setDeleteTarget(null);
      await loadInventory();
      refreshStats?.();
      showToast('Medicine deleted.', 'success');
    } catch (err) {
      showToast(err.message);
    }
  };

  const exportCsv = () => {
    const headers = [
      '#', 'Medicine Name', 'Qty', 'Expiry', 'Exp 6mo', 'Alert', 'Min', 'Max',
      'Status', 'Buy', 'Sell', 'Profit', 'Profit%', 'Supplier', 'Shelf', 'Notes',
    ];
    const rows = items.map((r) => [
      r.index, r.displayName, r.qty, r.expiryDate, r.expIn6Months, r.alert,
      r.minLimit, r.maxLimit, r.stockStatus, r.buyPrice, r.sellPrice, r.profit,
      r.profitPct, r.supplierName, r.shelfNo, r.notes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicare-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="mb-1" style={{ fontSize: '22px', fontWeight: 700 }}>Inventory / Medicine List</h2>
          <p className="text-muted mb-0 small">Full medicine table with filters, export & CRUD</p>
        </div>
        <Link to="/dashboard" className="btn-outline-green text-decoration-none">
          <i className="bi bi-speedometer2" /> Dashboard
        </Link>
      </div>

      <section className="inventory-section">
        <div className="inventory-header">
          <h2 className="visually-hidden">Inventory filters</h2>
          <div className="actions">
            <button type="button" className="btn-outline-green" onClick={exportCsv}>
              <i className="bi bi-download" />
              Export
            </button>
            {canEdit && (
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => {
                  setEditMedicine(null);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-plus-lg" />
                Add Medicine
              </button>
            )}
          </div>
        </div>

        <div className="filters-row">
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code}. ${c.name}` : c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="search-input"
            placeholder="Search medicine..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />

          <div className="position-relative d-inline-block">
          <i className="bi bi-calendar3 position-absolute text-muted" style={{ left: 10, top: 10, zIndex: 1, pointerEvents: 'none' }} />
          <select
            className="ps-4"
            value={filters.expiry}
            onChange={(e) => handleFilterChange('expiry', e.target.value)}
          >
            <option value="all">Expiry: All</option>
            <option value="expiring">Expiring in 6 Months</option>
            <option value="expired">Expired</option>
            <option value="safe">Safe</option>
          </select>
          </div>

          <select
            value={filters.stockStatus}
            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
          >
            <option value="all">Stock Status: All</option>
            <option value="normal">Normal</option>
            <option value="under">Under Stock</option>
            <option value="over">Over Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <button
            type="button"
            className="btn-more-filters"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            <i className="bi bi-funnel" />
            More Filters
          </button>
        </div>

        {showMoreFilters && (
          <div className="filters-row border-top-0 pt-0">
            <input
              type="text"
              placeholder="Supplier name..."
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <button
              type="button"
              className="btn-outline-green btn-sm"
              onClick={() => {
                setFilters({ categoryId: 'all', search: '', expiry: 'all', stockStatus: 'all' });
                setPage(1);
              }}
            >
              Clear all filters
            </button>
          </div>
        )}

        <InventoryTable
          items={items}
          loading={loading}
          canEdit={canEdit}
          onEdit={(row) => {
            setEditMedicine(row);
            setShowModal(true);
          }}
          onDelete={(row) => setDeleteTarget(row)}
        />

        <PaginationBar
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </section>

      {canEdit && (
      <MedicineModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditMedicine(null);
        }}
        medicine={editMedicine}
        categories={categories}
        suppliers={suppliers}
        onSave={handleSave}
        saving={saving}
      />
      )}

      {canEdit && (
      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Medicine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.displayName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      )}
    </>
  );
}

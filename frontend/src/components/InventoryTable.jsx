import { formatINR, formatDate, formatNumber } from "../api/client";

function stockBadgeClass(status) {
  if (status === "Normal") return "normal";
  if (status === "Under Stock") return "under";
  if (status === "Over Stock") return "over";
  return "out";
}

export default function InventoryTable({
  items,
  loading,
  onEdit,
  onDelete,
  canEdit = true,
}) {
  if (loading) {
    return (
      <div className="table-wrapper p-4 text-center text-muted">
        <div className="spinner-border text-success" role="status" />
        <p className="mt-2 mb-0">Loading inventory...</p>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="table-wrapper p-5 text-center text-muted">
        No medicines found. Try adjusting filters or add a new medicine.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine Name</th>
            <th>Qty</th>
            <th>Expiry Date</th>
            <th>Exp. in 6 Months?</th>
            <th>Alert</th>
            <th>Min Limit</th>
            <th>Max Limit</th>
            <th>Stock Status</th>
            <th>Buy Price (ETB)</th>
            <th>Sell Price (ETB)</th>
            <th>Profit (ETB)</th>
            <th>Profit %</th>
            <th>Supplier</th>
            <th>Shelf No.</th>
            <th>Notes</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id}>
              <td>{row.index}</td>
              <td className="medicine-name-cell">
                <div className="name">{row.name}</div>
                <div className="form">{row.strengthForm}</div>
              </td>
              <td>{formatNumber(row.qty)}</td>
              <td>{formatDate(row.expiryDate)}</td>
              <td>
                <span
                  className={`pill-badge ${row.expIn6Months === "Yes" ? "yes" : "no"}`}
                >
                  {row.expIn6Months}
                </span>
              </td>
              <td>
                <span className={`alert-text ${row.alertType}`}>
                  {row.alert}
                </span>
              </td>
              <td>{row.minLimit}</td>
              <td>{row.maxLimit}</td>
              <td>
                <span
                  className={`stock-badge ${stockBadgeClass(row.stockStatus)}`}
                >
                  {row.stockStatus}
                </span>
              </td>
              <td>{formatINR(row.buyPrice)}</td>
              <td>{formatINR(row.sellPrice)}</td>
              <td>{formatINR(row.profit)}</td>
              <td>{row.profitPct}</td>
              <td>{row.supplierName || "—"}</td>
              <td>{row.shelfNo}</td>
              <td>{row.notes}</td>
              {canEdit && (
                <td>
                  <div className="action-btns">
                    <button
                      type="button"
                      className="action-btn edit"
                      title="Edit"
                      onClick={() => onEdit(row)}
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button
                      type="button"
                      className="action-btn delete"
                      title="Delete"
                      onClick={() => onDelete(row)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

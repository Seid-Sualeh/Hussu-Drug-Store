import { formatNumber } from '../api/client';

export default function PaginationBar({ pagination, onPageChange, onLimitChange }) {
  const { page, limit, total, totalPages, from, to } = pagination;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination-bar">
      <div className="info">
        Showing {formatNumber(from)} to {formatNumber(to)} of {formatNumber(total)} items
      </div>
      <div className="pagination-controls">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          &lt;
        </button>
        {start > 1 && (
          <>
            <button type="button" onClick={() => onPageChange(1)}>
              1
            </button>
            {start > 2 && <span className="text-muted px-1">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={p === page ? 'active' : ''}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-muted px-1">...</span>}
            <button type="button" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          &gt;
        </button>
        <select
          className="page-size-select ms-2"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
    </div>
  );
}

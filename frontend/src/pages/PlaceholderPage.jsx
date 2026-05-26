export default function PlaceholderPage({ title, icon }) {
  return (
    <div className="page-placeholder">
      <i className={`bi ${icon} text-success`} style={{ fontSize: 48 }} />
      <h2 className="mt-3">{title}</h2>
      <p>This section is ready for future development. Use Inventory for the full dashboard.</p>
    </div>
  );
}

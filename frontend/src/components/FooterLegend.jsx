export default function FooterLegend() {
  return (
    <footer className="footer-legend">
      <div className="legend-group">
        <span className="legend-title">Stock Status:</span>
        <span className="legend-item">
          <span className="legend-dot red" /> Under Stock
        </span>
        <span className="legend-item">
          <span className="legend-dot green" /> Normal
        </span>
        <span className="legend-item">
          <span className="legend-dot purple" /> Over Stock
        </span>
      </div>
      <div className="legend-group">
        <span className="legend-title">Expiry Alert:</span>
        <span className="legend-item">
          <span className="legend-dot red" /> Expired
        </span>
        <span className="legend-item">
          <span className="legend-dot orange" /> Expiring in 6 Months
        </span>
        <span className="legend-item">
          <span className="legend-dot green" /> Safe
        </span>
      </div>
    </footer>
  );
}

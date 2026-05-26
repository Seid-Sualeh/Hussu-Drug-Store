import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, icon, action }) {
  return (
    <div className="page-header">
      <div>
        {icon && <i className={`bi ${icon} page-header-icon`} />}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header-actions">
        {action}
        <Link to="/dashboard" className="btn-outline-green text-decoration-none">
          <i className="bi bi-speedometer2" /> Dashboard
        </Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { formatNumber } from '../api/client';

const cards = [
  {
    key: 'totalMedicines',
    title: 'Total Medicines',
    icon: 'bi-capsule',
    color: 'green',
    link: 'View all items',
    filter: {},
  },
  {
    key: 'totalQuantity',
    title: 'Total Quantity',
    icon: 'bi-boxes',
    color: 'blue',
    link: 'View stock',
    filter: {},
  },
  {
    key: 'expiringIn6Months',
    title: 'Expiring in 6 Months',
    icon: 'bi-calendar-event',
    color: 'orange',
    link: 'View items',
    filter: { expiry: 'expiring' },
  },
  {
    key: 'lowStock',
    title: 'Low Stock Items',
    icon: 'bi-graph-down-arrow',
    color: 'red',
    link: 'Reorder now',
    filter: { stockStatus: 'under' },
  },
  {
    key: 'overStock',
    title: 'Over Stock Items',
    icon: 'bi-graph-up-arrow',
    color: 'purple',
    link: 'Review stock',
    filter: { stockStatus: 'over' },
  },
  {
    key: 'outOfStock',
    title: 'Out of Stock',
    icon: 'bi-x-circle',
    color: 'grey',
    link: 'View items',
    filter: { stockStatus: 'out' },
  },
];

function buildInventoryLink(filter) {
  const params = new URLSearchParams();
  if (filter.expiry) params.set('expiry', filter.expiry);
  if (filter.stockStatus) params.set('stockStatus', filter.stockStatus);
  const q = params.toString();
  return q ? `/inventory?${q}` : '/inventory';
}

export default function SummaryCards({ stats, onFilter }) {
  return (
    <div className="summary-cards">
      {cards.map((card) => {
        const displayValue =
          card.key === 'lowStock'
            ? (stats?.lowStock ?? stats?.underStock ?? 0)
            : (stats?.[card.key] ?? 0);

        return (
          <div key={card.key} className="summary-card">
            <div className="summary-card-header">
              <div>
                <div className="title">{card.title}</div>
                <div className="number">{formatNumber(displayValue)}</div>
              </div>
              <div className={`icon-circle ${card.color}`}>
                <i className={`bi ${card.icon}`} />
              </div>
            </div>
            {onFilter ? (
              <a
                href={buildInventoryLink(card.filter)}
                className="link"
                onClick={(e) => {
                  e.preventDefault();
                  onFilter(card.filter);
                }}
              >
                {card.link}
              </a>
            ) : (
              <Link to={buildInventoryLink(card.filter)} className="link">
                {card.link}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

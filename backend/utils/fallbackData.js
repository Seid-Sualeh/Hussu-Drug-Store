export function getStatsFallback() {
  return {
    totalMedicines: 1256,
    totalQuantity: 98765,
    inventoryValue: 1248750,
    totalItems: 1256,
    expiringIn6Months: 17,
    lowStock: 23,
    overStock: 31,
    outOfStock: 5,
    totalProfit: 245000,
    user: {
      name: 'Aman Singh',
      role: 'admin',
      avatar_initials: 'AS',
      notification_count: 8,
    },
    _fallback: true,
  };
}

export function getDashboardFallback() {
  const summary = {
    totalMedicines: 1256,
    totalQuantity: 98765,
    expiringIn6Months: 17,
    underStock: 23,
    lowStock: 23,
    overStock: 31,
    outOfStock: 5,
    totalProfit: 245000,
    inventoryValue: 1248750,
    normalStock: 1207,
  };
  return {
    summary,
    stockChart: {
      underStock: 23,
      normal: 1207,
      overStock: 31,
      outOfStock: 5,
    },
    expiryAlerts: [
      {
        id: 1,
        name: 'Nevirapine',
        strengthForm: '10mg/ml - 10ml - Suspension',
        expiryDate: '2026-06-15',
        daysLabel: '22 Days',
        status: 'expiring',
        alert: 'Expires in 22 days',
        expIn6Months: 'Yes',
      },
      {
        id: 6,
        name: 'Atazanavir + Ritonavir (ATV/r)',
        strengthForm: '300mg + 100mg - Capsule',
        expiryDate: '2026-04-18',
        daysLabel: 'Expired 37 days ago',
        status: 'expired',
        alert: 'Expired 37 days ago',
        expIn6Months: 'Yes',
      },
    ],
    profitByCategory: [
      { category: 'D. Anti-Retroviral Drugs (HAART-II)', profit: 20000, medicineCount: 120, totalQty: 4500 },
      { category: 'C. Anti-Tuberculosis Drugs (TB-FDC-I)', profit: 15000, medicineCount: 95, totalQty: 3200 },
      { category: 'J. Anti-Malaria Medicines', profit: 12000, medicineCount: 80, totalQty: 2100 },
    ],
    categoryDistribution: [
      { category: 'I. Neonatal and Child Health (NCH)', medicineCount: 180, totalQty: 15000 },
      { category: 'B. Medicines for Opportunistic Infections', medicineCount: 150, totalQty: 12000 },
      { category: 'D. Anti-Retroviral Drugs (HAART-II)', medicineCount: 120, totalQty: 9800 },
    ],
    supplierPerformance: [
      { supplier: 'Cipla Ltd.', totalMedicines: 120, totalQuantity: 8500 },
      { supplier: 'Sun Pharma', totalMedicines: 98, totalQuantity: 7200 },
    ],
    shelfTracking: [
      { shelf: 'A-01-01', medicineCount: 45, medicines: [{ name: 'Nevirapine' }] },
      { shelf: 'B-02-03', medicineCount: 23, medicines: [{ name: 'Amoxicillin' }] },
    ],
    urgentReorder: [
      { id: 5, name: 'Tenofovir + Lamivudine + Dolutegravir', qty: 0, minLimit: 30, stockStatus: 'Out of Stock' },
      { id: 2, name: 'Amoxicillin', qty: 8, minLimit: 25, stockStatus: 'Under Stock' },
    ],
    _fallback: true,
  };
}

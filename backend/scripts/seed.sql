-- Passwords set in setupDatabase.js: admin/admin123, guest/guest123
INSERT INTO users (username, password_hash, name, role, avatar_initials, email, notification_count) VALUES
('admin', '$2a$10$placeholder', 'Aman Singh', 'admin', 'AS', 'admin@medicare.com', 0),
('guest', '$2a$10$placeholder', 'Guest User', 'guest', 'GU', 'guest@medicare.com', 0);

INSERT INTO categories (code, name, sort_order) VALUES
('A', 'ARVs for PMTCT', 1),
('B', 'Medicines for Opportunistic Infections', 2),
('C', 'Anti-Tuberculosis Drugs (TB-FDC-I)', 3),
('D', 'Anti-Retroviral Drugs (HAART-II)', 4),
('G', 'Family Health (FH)', 5),
('H', 'Maternal Health (MH)', 6),
('I', 'Neonatal and Child Health (NCH)', 7),
('J', 'Anti-Malaria Medicines', 8),
('M.1.2', 'Viral Load and EID Supplies', 9),
('O', 'Malaria Diagnostic Reagents', 10),
('P', 'TB and Malaria Diagnostic Supplies', 11),
('Q', 'Lab Consumables', 12),
('R', 'HIV Rapid Tests', 13);

INSERT INTO suppliers (name, contact_phone, contact_email) VALUES
('Cipla Ltd.', '+91-22-2300-0001', 'orders@cipla.com'),
('Sun Pharma', '+91-22-4324-4324', 'supply@sunpharma.com'),
('Dr. Reddy''s', '+91-40-4545-4545', 'b2b@drreddys.com'),
('Lupin Ltd.', '+91-22-2740-2740', 'pharma@lupin.com'),
('Abbott India', '+91-22-3090-0000', 'trade@abbott.com'),
('Glenmark', '+91-22-4018-4018', 'sales@glenmark.com'),
('Torrent Pharma', '+91-79-2659-2659', 'dist@torrent.com'),
('Alkem Labs', '+91-22-3985-3985', 'supply@alkem.com');

-- First 10 rows matching design table
INSERT INTO medicines (name, strength_form, category_id, supplier_id, qty, expiry_date, min_limit, max_limit, buy_price, sell_price, shelf_no, notes) VALUES
('Nevirapine', '10mg/ml - 10ml - Suspension', 1, 1, 245, '2026-10-15', 50, 400, 85.00, 120.00, 'A-01-01', 'Store in cool place'),
('Amoxicillin', '250mg - Tablet', 7, 2, 8, '2027-03-20', 25, 300, 12.50, 22.00, 'I-02-03', 'Prescription required'),
('Sulfamethoxazole + Trimethoprim', '800mg + 160mg - Tablet', 2, 3, 1250, '2028-01-10', 100, 2000, 2.80, 5.00, 'B-01-05', NULL),
('Ethambutol (E)', '400mg - Tablet', 3, 4, 320, '2026-08-22', 40, 500, 18.00, 32.00, 'C-03-02', NULL),
('Tenofovir + Lamivudine + Dolutegravir', '300mg + 300mg + 50mg - Tablet', 4, 5, 0, '2027-06-15', 30, 600, 8.50, 15.00, 'D-01-08', 'Reorder urgently'),
('Atazanavir + Ritonavir (ATV/r)', '300mg + 100mg - Capsule', 4, 2, 45, '2026-04-18', 20, 200, 45.00, 78.00, 'D-02-01', 'Expiring soon'),
('Artemether + Lumefantrine', '20mg + 120mg (6x1) - Tablet', 8, 6, 180, '2027-11-30', 35, 400, 55.00, 95.00, 'J-03-07', NULL),
('Ferrous Sulfate + Folic Acid', '200mg + 0.4mg - Tablet', 6, 7, 890, '2028-05-12', 50, 1000, 25.00, 45.00, 'H-01-02', 'High demand'),
('Oxytocin', '10IU - 1ml - Ampoule - Injection', 6, 8, 12, '2027-02-28', 40, 350, 3.20, 6.50, 'H-02-04', 'Low stock alert'),
('Malaria RDT', 'Pan/Pf - Test Kit', 10, 5, 28, '2026-06-30', 15, 80, 420.00, 580.00, 'O-01-01', 'Store dry');

INSERT INTO settings (setting_key, setting_value) VALUES
('pharmacy_name', 'MediCare Drug Store'),
('currency', 'ETB'),
('expiry_alert_days', '180'),
('low_stock_alert', '1'),
('email', 'contact@medicare.com'),
('phone', '+251-11-000-0000'),
('address', 'Addis Ababa, Ethiopia'),
('tax_rate', '0');

INSERT INTO stock_movements (type, medicine_id, quantity, supplier_id, reference_no, reason, notes, previous_qty, new_qty) VALUES
('in', 1, 100, 1, 'PO-2026-001', 'Purchase Order', 'Monthly restock', 145, 245),
('in', 3, 500, 3, 'PO-2026-002', 'Purchase Order', NULL, 750, 1250),
('out', 2, 5, NULL, NULL, 'Dispensed', 'Walk-in customer', 13, 8),
('out', 9, 3, NULL, NULL, 'Expired disposal', 'Removed expired batch', 15, 12),
('in', 7, 50, 6, 'PO-2026-003', 'Purchase Order', NULL, 130, 180);

INSERT INTO notifications (title, message, type, is_read) VALUES
('Low Stock Alert', '23 medicines are below minimum stock level', 'low_stock', 0),
('Expiring Soon', '17 medicines expire within 6 months', 'expiry', 0),
('Out of Stock', '5 medicines are completely out of stock', 'low_stock', 0),
('Over Stock', '31 items exceed maximum stock limit', 'over_stock', 0),
('Welcome', 'MediCare Drug Store system is ready', 'system', 1),
('Reorder: Amoxicillin', 'Amoxicillin stock is critically low (8 units)', 'low_stock', 0),
('Expiry: Atazanavir', 'Atazanavir batch expiring in April 2026', 'expiry', 0),
('System Update', 'Dashboard reports module enabled', 'system', 1);

INSERT INTO sales (medicine_id, quantity, unit_price, buy_price, total_amount, profit, customer_name, notes) VALUES
(1, 10, 120.00, 85.00, 1200.00, 350.00, 'Walk-in', NULL),
(3, 50, 5.00, 2.80, 250.00, 110.00, 'Health Center', 'Bulk order'),
(7, 5, 95.00, 55.00, 475.00, 200.00, NULL, NULL),
(8, 20, 45.00, 25.00, 900.00, 400.00, 'Clinic A', NULL);

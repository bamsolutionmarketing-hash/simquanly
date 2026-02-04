const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.post('/', async (req, res) => {
    const { simTypes, packages, customers, orders, transactions } = req.body;

    try {
        // 1. Sim Types (Upsert)
        if (simTypes?.length) {
            await supabase.from('sim_types').upsert(simTypes);
        }

        // 2. Customers
        if (customers?.length) {
            await supabase.from('customers').upsert(customers);
        }

        // 3. Packages
        if (packages?.length) {
            // Map frontend keys to DB columns if needed, but schema name/name matches mostly
            const cleanPackages = packages.map(p => ({
                id: p.id,
                code: p.code,
                name: p.name,
                sim_type_id: p.simTypeId,
                import_date: p.importDate,
                quantity: p.quantity,
                total_import_price: p.totalImportPrice
            }));
            await supabase.from('sim_packages').upsert(cleanPackages);
        }

        // 4. Orders
        if (orders?.length) {
            const cleanOrders = orders.map(o => ({
                id: o.id,
                code: o.code,
                date: o.date,
                customer_id: o.customerId,
                agent_name: o.agentName,
                sale_type: o.saleType,
                sim_type_id: o.simTypeId,
                sim_package_id: o.simPackageId,
                quantity: o.quantity,
                sale_price: o.salePrice,
                due_date: o.dueDate,
                due_date_changes: o.dueDateChanges,
                note: o.note,
                is_finished: o.isFinished
            }));
            await supabase.from('sale_orders').upsert(cleanOrders);
        }

        // 5. Transactions
        if (transactions?.length) {
            const cleanTx = transactions.map(t => ({
                id: t.id,
                code: t.code,
                date: t.date,
                type: t.type,
                category: t.category,
                amount: t.amount,
                method: t.method,
                sale_order_id: t.saleOrderId,
                sim_package_id: t.simPackageId,
                note: t.note
            }));
            await supabase.from('transactions').upsert(cleanTx);
        }

        res.json({ success: true, message: 'Import successful' });

    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

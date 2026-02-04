const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('sale_orders').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('sale_orders').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/', async (req, res) => {
    const { code, date, customer_id, agent_name, sale_type, sim_type_id, sim_package_id, quantity, sale_price, due_date, note, is_finished } = req.body;
    const { data, error } = await supabase
        .from('sale_orders')
        .insert([{ code, date, customer_id, agent_name, sale_type, sim_type_id, sim_package_id, quantity, sale_price, due_date, note, is_finished }])
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase.from('sale_orders').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('sale_orders').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted successfully' });
});

module.exports = router;

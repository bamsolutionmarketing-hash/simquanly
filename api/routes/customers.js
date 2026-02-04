const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/', async (req, res) => {
    const { cid, name, phone, email, address, type, note } = req.body;
    const { data, error } = await supabase
        .from('customers')
        .insert([{ cid, name, phone, email, address, type, note }])
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted successfully' });
});

module.exports = router;

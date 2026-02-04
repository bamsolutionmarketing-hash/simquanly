const express = require('express');
const router = express.Router();
const supabase = require('../db');

// GET all sim types
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('sim_types').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET one by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('sim_types').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST create
router.post('/', async (req, res) => {
    const { name } = req.body;
    const { data, error } = await supabase.from('sim_types').insert([{ name }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// PUT update
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const { data, error } = await supabase.from('sim_types').update({ name }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('sim_types').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted successfully' });
});

module.exports = router;

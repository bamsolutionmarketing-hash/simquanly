const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const requireAuth = require('./middleware/auth');

const simTypesRoutes = require('./routes/sim-types');
const simPackagesRoutes = require('./routes/sim-packages');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders');
const transactionsRoutes = require('./routes/transactions');
const importRoutes = require('./routes/import');

// Apply auth middleware to all API routes
app.use('/api', requireAuth);

app.use('/api/sim-types', simTypesRoutes);
app.use('/api/sim-packages', simPackagesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/import', importRoutes);

app.get('/', (req, res) => {
    res.send('Sim Manager Backend is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;

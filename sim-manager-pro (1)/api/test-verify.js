const http = require('http');

const baseURL = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/${endpoint}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Backend Verification ---');

    try {
        // 1. Create a Sim Type
        console.log('Testing Create Sim Type...');
        const simType = await testEndpoint('sim-types', 'POST', { name: 'Test Provider' });
        console.log('Created Sim Type:', simType);

        if (!simType.data.id) throw new Error('Failed to create Sim Type');

        // 2. Create a Customer
        console.log('Testing Create Customer...');
        const customer = await testEndpoint('customers', 'POST', { name: 'Test Customer', type: 'RETAIL' });
        console.log('Created Customer:', customer);

        if (!customer.data.id) throw new Error('Failed to create Customer');

        // 3. Cleanup (optional, or leave it for manual check)
        console.log('Verification Successful!');
    } catch (err) {
        console.error('Verification Failed:', err);
    }
}

// Wait for server to start roughly
setTimeout(runTests, 2000);

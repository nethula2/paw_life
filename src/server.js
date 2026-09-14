const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('../database/db');

// Import route modules for all 6 team members
const adminRoutes = require('./routes/admin.routes');
const petEhrRoutes = require('./routes/pet_ehr.routes');
const appointmentRoutes = require('./routes/appointments.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const operationsRoutes = require('./routes/operations.routes');
const groomingRoutes = require('./routes/grooming.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount API Routes per Student Module
app.use('/api/admin', adminRoutes);         // Member 01: Sanvidu S.D.N (IT25100618)
app.use('/api', petEhrRoutes);              // Member 02: De Silva L.P.B (IT25101709)
app.use('/api/appointments', appointmentRoutes); // Member 03: Subasinghe R.A.G.I (IT25102521)
app.use('/api/inventory', inventoryRoutes); // Member 04: Balasooriya B.A.H.N (IT25103607)
app.use('/api/operations', operationsRoutes); // Member 05: Alahakoon A.M.B.U (IT25101534)
app.use('/api/grooming', groomingRoutes);   // Member 06: Warnakulasuriya G.A.D.T.S (IT25103408)

// Dedicated Hospital Management Dashboard Route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Catch-all route serves SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize database and start HTTP server
const startServer = async () => {
    await initDatabase();
    app.listen(PORT, () => {
        console.log('===============================================================');
        console.log(`🐾 PawLife Web Application running at: http://localhost:${PORT}`);
        console.log('SE2030 Software Engineering Module Project - Group MLB-B6G2-07');
        console.log('Ready for Progress Viva (75% Functional Scope Demonstration)');
        console.log('===============================================================');
    });
};

startServer();

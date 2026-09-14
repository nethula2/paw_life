/**
 * Comprehensive Automated Verification Suite for PawLife
 * Validates functional workflows and alternative flows for all 6 team members
 */

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, text: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🐾 Starting PawLife Automated Test Suite...\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ [PASS] ${message}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // --- MEMBER 01: Sanvidu S.D.N (IT25100618) - Admin & BI ---
        console.log('📌 [Member 01: Sanvidu S.D.N] Testing RBAC, Audit & R Analytics:');
        
        // Test 1.1: Fetch RBAC Matrix
        const rbacRes = await request('GET', '/api/admin/roles');
        assert(rbacRes.status === 200 && rbacRes.body.roles.length > 0, 'Fetched RBAC permission matrix for all roles');

        // Test 1.2: Master Role Lock (Alternative Flow 3.a.1)
        const masterEditRes = await request('PUT', '/api/admin/roles/Admin', {
            permissions: [{ module_name: 'Smart Inventory', can_delete: false }]
        });
        assert(masterEditRes.status === 403, 'Master Role Lock: Rejects unauthorized modification of Admin master role (403 Forbidden)');

        // Test 1.3: Audit Log Retention
        const auditRes = await request('GET', '/api/admin/audit-logs');
        assert(auditRes.status === 200 && auditRes.body.logs.length > 0, 'Retrieved immutable administrative audit logs');

        // Test 1.4: R Language BI Analytics Engine
        const biRes = await request('GET', '/api/admin/bi-analytics');
        assert(biRes.status === 200 && biRes.body.metrics.total_revenue > 0, 'R language BI statistical engine executed and returned revenue metrics');

        // --- MEMBER 02: De Silva L.P.B (IT25101709) - Pet Profiles & EHR ---
        console.log('\n📌 [Member 02: De Silva L.P.B] Testing Pet EHR, Consultations & Vaccines:');
        
        // Test 2.1: Search Pet (Match)
        const petMatch = await request('GET', '/api/pets?search=Buddy');
        assert(petMatch.status === 200 && petMatch.body.pets.length > 0, 'Found registered pet "Buddy" by name');

        // Test 2.2: Search Pet (Alternative Flow 2.a - No match)
        const petNoMatch = await request('GET', '/api/pets?search=NonExistentPet123');
        assert(petNoMatch.body.pets.length === 0 && petNoMatch.body.message, 'Alternative Flow 2.a handled: Clean empty response for unmatched query');

        // Test 2.3: Consultation Mandatory Field Validation (Alternative Flow 8.a)
        const emptyConsult = await request('POST', '/api/consultations', {
            pet_id: 1,
            diagnosis: '',
            treatment_notes: ''
        });
        assert(emptyConsult.status === 400, 'Alternative Flow 8.a enforced: Missing mandatory clinical diagnosis rejected (400 Bad Request)');

        // Test 2.4: Vaccination Next Due Date Auto-Calculation
        const vacRes = await request('POST', '/api/vaccinations', {
            pet_id: 1,
            vaccine_name: 'Canine Parvovirus Booster',
            batch_number: 'VAC-2026-P01',
            date_administered: '2026-09-14'
        });
        assert(vacRes.status === 200 && vacRes.body.next_due_date.startsWith('2027'), `Auto-calculated next preventative booster date: ${vacRes.body.next_due_date}`);

        // --- MEMBER 03: Subasinghe R.A.G.I (IT25102521) - Appointments & Conflict Engine ---
        const d = new Date(Date.now() + Math.floor(Math.random() * 50000000000) + 86400000);
        const testBookingDate = d.toISOString().split('T')[0];
        const testSlot = '10:00 AM - 10:30 AM';

        // Test 3.1: Check Available Slots
        const slotsRes = await request('GET', `/api/appointments/available-slots?date=${testBookingDate}`);
        assert(slotsRes.status === 200 && slotsRes.body.slots.length > 0, 'Checked real-time slot availability for booking date');

        // Test 3.2: Book Appointment
        const bookRes = await request('POST', '/api/appointments/book', {
            pet_id: 2,
            owner_id: 1,
            service_type: 'Veterinary Care',
            booking_date: testBookingDate,
            time_slot: testSlot,
            notes: 'Automated test booking'
        });
        assert(bookRes.status === 200, `Appointment #${bookRes.body?.appointment_id} booked successfully on ${testBookingDate}`);

        // Test 3.3: Concurrent Booking Conflict (Alternative Flow 6.a)
        const conflictRes = await request('POST', '/api/appointments/book', {
            pet_id: 3,
            owner_id: 2,
            service_type: 'Veterinary Care',
            booking_date: testBookingDate,
            time_slot: testSlot
        });
        assert(conflictRes.status === 409 && conflictRes.body.conflict === true, 'Alternative Flow 6.a enforced: Concurrent slot conflict detected and rejected (409 Conflict)');

        // --- MEMBER 04: Balasooriya B.A.H.N (IT25103607) - Smart Inventory ---
        console.log('\n📌 [Member 04: Balasooriya B.A.H.N] Testing Inventory, Batches & Low-Stock:');
        
        // Test 4.1: Future Expiry Validation (Alternative Flow 4.a)
        const pastExpiryRes = await request('POST', '/api/inventory/batch', {
            supply_name: 'Expired Test Ampoule',
            batch_number: 'EXP-TEST',
            quantity: 10,
            expiry_date: '2020-01-01'
        });
        assert(pastExpiryRes.status === 400, 'Alternative Flow 4.a enforced: Rejects past expiry dates (400 Bad Request)');

        // Test 4.2: Add Valid Stock Batch
        const validBatchRes = await request('POST', '/api/inventory/batch', {
            supply_name: 'Antiseptic Solution 500ml',
            category: 'Surgical Supply',
            batch_number: `BAT-${Date.now().toString().slice(-4)}`,
            quantity: 25,
            min_threshold: 5,
            expiry_date: '2028-06-30'
        });
        assert(validBatchRes.status === 200, `Stock batch recorded. Available quantity: ${validBatchRes.body.total_quantity}`);

        // Test 4.3: Customer Online Store Purchase (Live Stock Deduction)
        const buyRes = await request('POST', '/api/inventory/purchase', {
            supply_id: 19,
            quantity: 1,
            customer_name: 'John Doe',
            customer_phone: '077-1234567',
            delivery_method: 'Pickup at Clinic Desk',
            payment_method: 'Cash / Card on Delivery'
        });
        assert(buyRes.status === 200 && buyRes.body.order_id && buyRes.body.remaining_stock >= 0, `Customer online purchase confirmed [${buyRes.body?.order_id}]: 1x ${buyRes.body?.product_name}. Remaining stock: ${buyRes.body?.remaining_stock}`);

        // Test 4.4: Insufficient Stock Rejection (Alternative Flow)
        const overBuyRes = await request('POST', '/api/inventory/purchase', {
            supply_id: 19,
            quantity: 99999,
            customer_name: 'Overbuyer',
            customer_phone: '077-9999999'
        });
        assert(overBuyRes.status === 400 && overBuyRes.body.error.includes('Insufficient stock'), 'Alternative Flow enforced: Excessive purchase quantity exceeding available stock rejected (400 Bad Request)');

        // --- MEMBER 05: Alahakoon A.M.B.U (IT25101534) - Operational Centre & Staff ---
        console.log('\n📌 [Member 05: Alahakoon A.M.B.U] Testing Operations Dashboard & Shift Conflicts:');
        
        // Test 5.1: Summary Dashboard KPIs
        const opRes = await request('GET', '/api/operations/dashboard');
        assert(opRes.status === 200 && opRes.body.kpis.total_pets > 0, 'Centre Manager operations dashboard retrieved live KPIs');

        // Test 5.2: Shift Conflict Detection (Alternative Flow 5.a)
        // User 2 (Dr. De Silva) already has Morning shift on 2026-09-14
        const shiftConflictRes = await request('POST', '/api/operations/shifts', {
            user_id: 2,
            shift_date: '2026-09-14',
            shift_type: 'Evening',
            start_time: '14:00:00',
            end_time: '20:00:00'
        });
        assert(shiftConflictRes.status === 409 && shiftConflictRes.body.conflict === true, 'Alternative Flow 5.a enforced: Shift overlap for same staff rejected (409 Conflict)');

        // --- MEMBER 06: Warnakulasuriya G.A.D.T.S (IT25103408) - Pet Grooming Workflow ---
        console.log('\n📌 [Member 06: Warnakulasuriya G.A.D.T.S] Testing Grooming Queue & Ready Alert:');
        
        // Test 6.1: Active Queue Display
        const queueRes = await request('GET', '/api/grooming/queue');
        assert(queueRes.status === 200 && queueRes.body.queue.length > 0, 'Retrieved active grooming station queue');

        // Test 6.2: Advance Stage to "Ready for Pick-up" (Alternative Flow 7.a)
        const stageRes = await request('PUT', '/api/grooming/sessions/1/status', {
            progress_status: 'Ready for Pick-up',
            observations: 'Grooming completed. Pet looks great!'
        });
        assert(stageRes.status === 200 && stageRes.body.owner_notified === true, 'Alternative Flow 7.a enforced: Owner notified when stage becomes "Ready for Pick-up"');

        // --- CUSTOMER PORTAL: Pet Parent Self-Service & Health Updates ---
        console.log('\n📌 [Pet Parent Portal] Testing Customer Authentication & Real-Time Pet Updates:');
        
        // Test 7.1: Pet Owner Login (Kavinda Silva)
        const custLoginRes = await request('POST', '/api/customer/login', {
            identifier: 'kavinda.s@gmail.com',
            password: 'password123'
        });
        assert(custLoginRes.status === 200 && custLoginRes.body.success === true && custLoginRes.body.user.first_name === 'Kavinda', 
            'Pet Owner logged in successfully via customer portal');

        // Test 7.2: Pet Parent Portal Data (Registered Pets, EHR, Grooming, Notifications)
        const portalRes = await request('GET', `/api/customer/portal?user_id=${custLoginRes.body.user.user_id}`);
        assert(portalRes.status === 200 && portalRes.body.success === true 
            && portalRes.body.pets.some(p => p.pet_name === 'Bella')
            && portalRes.body.grooming.length > 0,
            'Retrieved live pet updates: registered pets, EHR, and real-time grooming session');

        console.log('\n===============================================================');
        console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log('===============================================================');
        process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
        console.error('Fatal test execution error:', err);
        process.exit(1);
    }
}

// Allow server to be running before executing tests
setTimeout(runTests, 1000);

/**
 * PawLife Pet Parent Customer Portal Module (customer_portal.js)
 * Enables pet owners to authenticate, view their registered pets,
 * track live care & grooming progress, review EHR medical history, and manage appointments.
 */

const CustomerPortal = {
    currentUser: null,
    portalData: null,
    activeTab: 'pets',

    init() {
        this.checkSession();
    },

    checkSession() {
        const slot = document.getElementById('nav-customer-slot');
        const userStr = localStorage.getItem('pawlife_customer_user');

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.user_id) {
                    this.currentUser = user;
                    if (slot) {
                        slot.innerHTML = `
                            <div class="flex items-center space-x-2">
                                <button onclick="CustomerPortal.openPortal()" class="flex items-center space-x-2 py-2 px-3.5 rounded-full border-2 border-slate-900 bg-amber-100 hover:bg-amber-200 text-slate-900 text-xs font-black transition shadow-[2px_2px_0px_#000] cursor-pointer">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <i class="fas fa-paw text-[#FF5A27]"></i>
                                    <span>${user.first_name}'s Pets</span>
                                </button>
                            </div>
                        `;
                    }
                    return;
                }
            } catch (e) {}
        }

        this.currentUser = null;
        if (slot) {
            slot.innerHTML = `
                <button onclick="CustomerPortal.openLoginModal()" class="flex items-center space-x-1.5 py-2 px-4 rounded-full border-2 border-slate-900 bg-white hover:bg-amber-50 text-slate-900 text-xs font-black transition shadow-[2px_2px_0px_#000] cursor-pointer">
                    <i class="fas fa-paw text-[#FF5A27]"></i>
                    <span>Pet Parent Login</span>
                </button>
            `;
        }
    },

    openLoginModal() {
        const modal = document.getElementById('customer-login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            const alertBox = document.getElementById('cust-login-error');
            if (alertBox) alertBox.classList.add('hidden');
        }
    },

    closeLoginModal() {
        const modal = document.getElementById('customer-login-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    autofillCustomer(email) {
        const idInput = document.getElementById('cust-login-identifier');
        const pwdInput = document.getElementById('cust-login-password');
        if (idInput) idInput.value = email;
        if (pwdInput) pwdInput.value = 'password123';
        const alertBox = document.getElementById('cust-login-error');
        if (alertBox) alertBox.classList.add('hidden');
    },

    async submitLogin(event) {
        if (event) event.preventDefault();
        const idInput = document.getElementById('cust-login-identifier');
        const pwdInput = document.getElementById('cust-login-password');
        const alertBox = document.getElementById('cust-login-error');
        const submitBtn = document.getElementById('cust-login-submit-btn');

        const identifier = idInput?.value?.trim();
        const password = pwdInput?.value?.trim();

        if (!identifier || !password) {
            if (alertBox) {
                alertBox.textContent = 'Please enter your email or phone and password.';
                alertBox.classList.remove('hidden');
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading Your Pet Profile...';
        }
        if (alertBox) alertBox.classList.add('hidden');

        try {
            const res = await fetch('/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (!data.success) {
                if (alertBox) {
                    alertBox.textContent = data.error || 'Login failed. Please check credentials.';
                    alertBox.classList.remove('hidden');
                }
                return;
            }

            // Save customer session
            localStorage.setItem('pawlife_customer_user', JSON.stringify(data.user));
            this.currentUser = data.user;
            this.checkSession();
            this.closeLoginModal();

            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`Welcome back, ${data.user.first_name}! Your pet dashboard is ready.`, 'success');
            }

            // Open the portal automatically
            await this.openPortal();

        } catch (err) {
            if (alertBox) {
                alertBox.textContent = 'Connection error: ' + err.message;
                alertBox.classList.remove('hidden');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-1.5"></i><span>VIEW MY PET DASHBOARD</span>';
            }
        }
    },

    async openPortal() {
        if (!this.currentUser) {
            this.openLoginModal();
            return;
        }

        const modal = document.getElementById('customer-portal-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Load data
        await this.loadPortalData();
    },

    closePortal() {
        const modal = document.getElementById('customer-portal-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    async loadPortalData() {
        const container = document.getElementById('customer-portal-content');
        if (!container) return;

        container.innerHTML = `
            <div class="p-12 text-center text-slate-500 font-bold">
                <i class="fas fa-spinner fa-spin text-2xl text-[#FF5A27] mb-2"></i>
                <div>Loading your pets' health, appointments & grooming updates...</div>
            </div>
        `;

        try {
            const url = `/api/customer/portal?user_id=${this.currentUser.user_id}&owner_id=${this.currentUser.owner_id || ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            this.portalData = data;
            this.renderPortal();
        } catch (err) {
            container.innerHTML = `
                <div class="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border-2 border-rose-300">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <div>Failed to load pet data: ${err.message}</div>
                </div>
            `;
        }
    },

    switchPortalTab(tabKey) {
        this.activeTab = tabKey;
        document.querySelectorAll('.cust-tab-btn').forEach(b => {
            if (b.dataset.tab === tabKey) {
                b.className = "cust-tab-btn px-4 py-2 rounded-xl text-xs font-black border-2 border-slate-900 bg-[#FF5A27] text-white shadow-sm cursor-pointer";
            } else {
                b.className = "cust-tab-btn px-4 py-2 rounded-xl text-xs font-bold border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer";
            }
        });

        document.querySelectorAll('.cust-tab-panel').forEach(p => p.classList.add('hidden'));
        const activeP = document.getElementById(`cust-panel-${tabKey}`);
        if (activeP) activeP.classList.remove('hidden');
    },

    renderPortal() {
        const container = document.getElementById('customer-portal-content');
        if (!container || !this.portalData) return;

        const { owner, pets, appointments, consultations, vaccinations, grooming, notifications } = this.portalData;

        container.innerHTML = `
            <!-- Top Summary Card -->
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-slate-900 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex items-center space-x-3.5">
                    <div class="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-2xl font-black shadow-[3px_3px_0px_#000]">
                        🐾
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h3 class="text-xl font-black text-slate-900 font-chunky">${owner.first_name} ${owner.last_name}'s Pet Family</h3>
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300">Verified Owner</span>
                        </div>
                        <div class="text-xs text-slate-600 font-medium">
                            <span>📞 ${owner.phone_number || 'N/A'}</span> • <span>✉️ ${owner.email}</span> • <span class="font-bold text-[#FF5A27]">${pets.length} Registered Pet(s)</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center space-x-2">
                    <button onclick="CustomerPortal.quickBookVisit()" class="btn-chunky-brown py-2.5 px-4 text-xs uppercase tracking-wider shadow-md">
                        <i class="fas fa-calendar-plus mr-1.5 text-amber-300"></i>Book A Visit
                    </button>
                    <button onclick="CustomerPortal.logout()" title="Sign Out" class="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition">
                        <i class="fas fa-sign-out-alt mr-1"></i>Sign Out
                    </button>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="flex flex-wrap items-center gap-2 mb-6 border-b-2 border-slate-200 pb-3">
                <button onclick="CustomerPortal.switchPortalTab('pets')" data-tab="pets" class="cust-tab-btn px-4 py-2 rounded-xl text-xs font-black border-2 border-slate-900 bg-[#FF5A27] text-white shadow-sm cursor-pointer">
                    <i class="fas fa-paw mr-1.5"></i>My Pets (${pets.length})
                </button>
                <button onclick="CustomerPortal.switchPortalTab('appointments')" data-tab="appointments" class="cust-tab-btn px-4 py-2 rounded-xl text-xs font-bold border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                    <i class="fas fa-calendar-alt mr-1.5 text-teal-600"></i>Appointments (${appointments.length})
                </button>
                <button onclick="CustomerPortal.switchPortalTab('health')" data-tab="health" class="cust-tab-btn px-4 py-2 rounded-xl text-xs font-bold border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                    <i class="fas fa-heartbeat mr-1.5 text-rose-600"></i>Health & Vaccines (${vaccinations.length + consultations.length})
                </button>
                <button onclick="CustomerPortal.switchPortalTab('grooming')" data-tab="grooming" class="cust-tab-btn px-4 py-2 rounded-xl text-xs font-bold border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                    <i class="fas fa-cut mr-1.5 text-pink-600"></i>Live Grooming Tracker (${grooming.length})
                </button>
                <button onclick="CustomerPortal.switchPortalTab('notifications')" data-tab="notifications" class="cust-tab-btn px-4 py-2 rounded-xl text-xs font-bold border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                    <i class="fas fa-bell mr-1.5 text-amber-600"></i>Notifications (${notifications.length})
                </button>
            </div>

            <!-- TAB 1: MY PETS -->
            <div id="cust-panel-pets" class="cust-tab-panel">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    ${pets.map(p => `
                        <div class="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#000] space-y-3">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center text-2xl">
                                        ${p.species === 'Cat' ? '🐱' : p.species === 'Bird' ? '🦜' : p.species === 'Rabbit' ? '🐇' : '🐶'}
                                    </div>
                                    <div>
                                        <div class="text-base font-black text-slate-900 font-chunky">${p.pet_name}</div>
                                        <div class="text-xs text-slate-500 font-bold">${p.species} • ${p.breed}</div>
                                    </div>
                                </div>
                                <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Active Patient
                                </span>
                            </div>

                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                                <div><span class="text-slate-500 font-bold">Gender:</span> <span class="font-bold text-slate-800">${p.gender}</span></div>
                                <div><span class="text-slate-500 font-bold">Born:</span> <span class="font-mono font-bold text-slate-800">${p.date_of_birth}</span></div>
                                <div class="col-span-2"><span class="text-slate-500 font-bold">Microchip:</span> <span class="font-mono font-black text-indigo-700">${p.microchip_no || 'Pending Implant'}</span></div>
                                <div class="col-span-2 text-slate-600 italic">"${p.medical_notes || 'Healthy & active'}"</div>
                            </div>

                            <div class="flex items-center space-x-2 pt-1">
                                <button onclick="CustomerPortal.bookForPet(${p.pet_id})" class="flex-1 py-2 px-3 text-xs font-bold rounded-xl border-2 border-slate-900 bg-amber-50 hover:bg-amber-100 text-slate-900 transition flex items-center justify-center space-x-1">
                                    <i class="fas fa-calendar-check text-[#FF5A27]"></i>
                                    <span>Book Appointment</span>
                                </button>
                                <button onclick="PetEhrModule.openEHRModal(${p.pet_id})" class="py-2 px-3 text-xs font-bold rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-700 transition">
                                    <i class="fas fa-file-medical"></i> EHR
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- TAB 2: APPOINTMENTS -->
            <div id="cust-panel-appointments" class="cust-tab-panel hidden space-y-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-500">Upcoming & Past Appointments</span>
                    <button onclick="CustomerPortal.quickBookVisit()" class="text-xs font-black text-[#FF5A27] hover:underline">
                        + Book New Slot
                    </button>
                </div>
                ${appointments.length === 0 ? `
                    <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                        No appointments booked yet. Click "Book A Visit" to reserve your first slot!
                    </div>
                ` : `
                    <div class="space-y-3">
                        ${appointments.map(a => `
                            <div class="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <div class="flex items-center space-x-2">
                                        <span class="font-mono font-bold text-xs text-slate-500">#APP-${a.appointment_id}</span>
                                        <span class="text-sm font-black text-slate-900 font-chunky">${a.pet_name} (${a.service_type})</span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${
                                            a.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                            a.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                            a.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                            a.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                            'bg-slate-100 text-slate-800'
                                        }">${a.status}</span>
                                    </div>
                                    <div class="text-xs text-slate-600 mt-1 flex items-center space-x-3">
                                        <span><i class="far fa-calendar text-[#FF5A27] mr-1"></i>${a.booking_date}</span>
                                        <span><i class="far fa-clock text-amber-600 mr-1"></i>${a.time_slot}</span>
                                        <span><i class="fas fa-user-md text-teal-600 mr-1"></i>${a.staff_name || 'Clinic Team'}</span>
                                    </div>
                                    ${a.notes ? `<div class="text-[11px] text-slate-500 italic mt-0.5">Note: ${a.notes}</div>` : ''}
                                </div>

                                ${a.status !== 'Completed' && a.status !== 'Cancelled' ? `
                                    <button onclick="CustomerPortal.cancelAppointment(${a.appointment_id})" class="px-3 py-1.5 text-xs font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl transition">
                                        Cancel Visit
                                    </button>
                                ` : `<span class="text-xs text-slate-400 font-mono">Archived</span>`}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <!-- TAB 3: HEALTH & VACCINES (EHR) -->
            <div id="cust-panel-health" class="cust-tab-panel hidden space-y-6">
                <!-- Vaccines -->
                <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
                        <i class="fas fa-shield-virus text-emerald-600"></i>
                        <span>Preventative Vaccinations & Booster Due Dates</span>
                    </h4>
                    ${vaccinations.length === 0 ? `
                        <div class="p-4 bg-slate-50 border rounded-xl text-xs text-slate-500">No vaccination records logged yet.</div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            ${vaccinations.map(v => `
                                <div class="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-sm space-y-2">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <div class="font-extrabold text-sm text-slate-900">${v.vaccine_name}</div>
                                            <div class="text-[11px] text-slate-500">For: <span class="font-bold text-slate-800">${v.pet_name}</span> • Batch: ${v.batch_number}</div>
                                        </div>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">Verified</span>
                                    </div>
                                    <div class="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Given:</span>
                                            <span class="font-bold text-slate-800">${v.date_administered}</span>
                                        </div>
                                        <div class="flex justify-between mt-0.5">
                                            <span class="text-emerald-900 font-black">Next Booster Due:</span>
                                            <span class="font-black text-emerald-700">${v.next_due_date}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Consultations -->
                <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
                        <i class="fas fa-stethoscope text-blue-600"></i>
                        <span>Veterinary Clinical Consultations & Prescriptions</span>
                    </h4>
                    ${consultations.length === 0 ? `
                        <div class="p-4 bg-slate-50 border rounded-xl text-xs text-slate-500">No clinical consultations on file.</div>
                    ` : `
                        <div class="space-y-3">
                            ${consultations.map(c => `
                                <div class="bg-white p-4 rounded-xl border-2 border-slate-900 space-y-2">
                                    <div class="flex justify-between">
                                        <div class="font-extrabold text-sm text-slate-900">${c.pet_name} • ${c.diagnosis || 'General Clinical Checkup'}</div>
                                        <span class="text-xs font-mono text-slate-500">${c.consultation_date}</span>
                                    </div>
                                    <div class="text-xs text-slate-600">Attending Vet: <span class="font-bold">${c.vet_name || 'Veterinary Officer'}</span></div>
                                    ${c.treatment_notes ? `<div class="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">Notes: ${c.treatment_notes}</div>` : ''}
                                    ${c.medication_details ? `
                                        <div class="bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-xs">
                                            <span class="font-black text-purple-900">Prescription:</span> ${c.medication_details} (${c.dosage || 'As directed'}) — ${c.instructions || 'With food'}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- TAB 4: LIVE GROOMING TRACKER -->
            <div id="cust-panel-grooming" class="cust-tab-panel hidden space-y-4">
                <div class="flex items-center space-x-2 text-xs text-slate-600 mb-2">
                    <i class="fas fa-info-circle text-[#FF5A27]"></i>
                    <span>Real-time updates directly from the grooming salon stations terminal:</span>
                </div>
                ${grooming.length === 0 ? `
                    <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                        None of your pets are currently checked into the grooming salon. Book a grooming visit to track real-time progress!
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${grooming.map(g => `
                            <div class="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#000] space-y-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="text-xs font-mono font-bold text-slate-400">Queue Ticket #${g.queue_id}</span>
                                        <h4 class="text-lg font-black text-slate-900 font-chunky">${g.pet_name} (${g.breed})</h4>
                                        <div class="text-xs text-slate-500 font-medium">Service: <span class="font-bold text-slate-800">${g.service_name || 'Spa & Bath'}</span></div>
                                    </div>
                                    <span class="px-3 py-1.5 rounded-full text-xs font-black ${
                                        g.status === 'Ready for Pick-up' ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 animate-pulse' :
                                        'bg-purple-100 text-purple-900 border-2 border-purple-300'
                                    }">${g.status}</span>
                                </div>

                                <!-- Progress Stepper -->
                                <div class="grid grid-cols-4 gap-2 pt-2 text-center text-[10px] font-black">
                                    <div class="p-2 rounded-xl border ${['Checked-In', 'Bathing & Drying', 'Styling & Trimming', 'Ready for Pick-up'].includes(g.status) ? 'bg-emerald-500 text-white border-slate-900' : 'bg-slate-100 text-slate-400'}">
                                        1. Check-In
                                    </div>
                                    <div class="p-2 rounded-xl border ${['Bathing & Drying', 'Styling & Trimming', 'Ready for Pick-up'].includes(g.status) ? 'bg-emerald-500 text-white border-slate-900' : 'bg-slate-100 text-slate-400'}">
                                        2. Bath & Dry
                                    </div>
                                    <div class="p-2 rounded-xl border ${['Styling & Trimming', 'Ready for Pick-up'].includes(g.status) ? 'bg-emerald-500 text-white border-slate-900' : 'bg-slate-100 text-slate-400'}">
                                        3. Styling
                                    </div>
                                    <div class="p-2 rounded-xl border ${g.status === 'Ready for Pick-up' ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-sm' : 'bg-slate-100 text-slate-400'}">
                                        4. Pick-Up Ready!
                                    </div>
                                </div>

                                ${g.status === 'Ready for Pick-up' ? `
                                    <div class="p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                                        <i class="fas fa-bell text-emerald-600 text-base animate-bounce"></i>
                                        <span>Your pet is all fresh, styled and ready for pickup at the front desk!</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <!-- TAB 5: NOTIFICATIONS -->
            <div id="cust-panel-notifications" class="cust-tab-panel hidden space-y-3">
                ${notifications.length === 0 ? `
                    <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                        No new notifications.
                    </div>
                ` : `
                    <div class="space-y-2.5">
                        ${notifications.map(n => `
                            <div class="p-3.5 bg-white rounded-xl border-2 border-slate-900 shadow-sm flex items-start space-x-3">
                                <div class="w-8 h-8 rounded-lg bg-amber-100 border border-slate-900 flex items-center justify-center text-sm text-[#FF5A27] shrink-0">
                                    <i class="fas ${n.notification_type?.includes('Vaccin') ? 'fa-syringe' : n.notification_type?.includes('Groom') ? 'fa-cut' : 'fa-bell'}"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between">
                                        <div class="text-xs font-bold text-slate-900">${n.notification_type || 'Notification'}</div>
                                        <span class="text-[10px] text-slate-400 font-mono">${n.date_created}</span>
                                    </div>
                                    <div class="text-xs text-slate-600 mt-0.5">${n.message}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    quickBookVisit() {
        this.closePortal();
        const sec = document.getElementById('booking-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    },

    bookForPet(petId) {
        this.closePortal();
        const sec = document.getElementById('booking-section');
        if (sec) {
            sec.scrollIntoView({ behavior: 'smooth' });
            const sel = document.getElementById('book-pet-select');
            if (sel) {
                sel.value = petId;
                AppointmentsModule.setCustomerMode('existing');
            }
        }
    },

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const res = await fetch('/api/customer/cancel-appointment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id: appointmentId })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast(data.message, 'success');
                }
                await this.loadPortalData();
                AppointmentsModule.loadAppointments();
            }
        } catch (err) {
            alert('Error cancelling: ' + err.message);
        }
    },

    logout() {
        localStorage.removeItem('pawlife_customer_user');
        this.currentUser = null;
        this.portalData = null;
        this.closePortal();
        this.checkSession();
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Signed out of Pet Parent Portal.', 'info');
        }
    }
};

// Initialize Customer Portal when script loads
document.addEventListener('DOMContentLoaded', () => {
    CustomerPortal.init();
});

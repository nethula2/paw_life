/**
 * PawLife Enterprise Dashboard Controller (dashboard.js)
 * Manages full-screen clinic & hospital management dashboard views and interactions
 */

const DashboardApp = {
    currentView: 'overview',

    knownApptIds: new Set(),
    knownAlertKeys: new Set(),
    pollerInitialized: false,

    async init() {
        console.log('🐾 Initializing PawLife Enterprise Dashboard...');
        
        // 1. Enforce Staff/Admin Session Authentication Check (sessionStorage)
        if (!this.checkAuth()) {
            console.log('🔒 Staff/Admin authentication required to access VetOps console.');
            return;
        }

        this.bindEvents();
        this.startLiveClock();

        // Load all data modules
        await this.loadAllModules();

        // Switch to default or URL hash view
        const hash = window.location.hash.replace('#', '');
        const validViews = ['overview', 'booking', 'ehr', 'inventory', 'grooming', 'operations', 'admin'];
        if (validViews.includes(hash)) {
            await this.switchView(hash);
        } else {
            await this.switchView('overview');
        }

        // 2. Start Real-time Live Notifications Poller (without refreshing)
        this.startLiveAlertPoller();
    },

    checkAuth() {
        const overlay = document.getElementById('admin-auth-overlay');
        // Check sessionStorage first (required: must sign in every time they visit if closed site)
        let userStr = sessionStorage.getItem('pawlife_admin_user');
        
        // If not in sessionStorage, check localStorage for seamless migration, then move to sessionStorage
        if (!userStr && localStorage.getItem('pawlife_admin_user')) {
            userStr = localStorage.getItem('pawlife_admin_user');
            sessionStorage.setItem('pawlife_admin_user', userStr);
            localStorage.removeItem('pawlife_admin_user');
        }
        
        if (!userStr) {
            window.location.href = '/?auth=admin';
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            // Strictly enforce: ONLY Administrator role can access the Admin Dashboard
            if (user && user.role === 'Admin') {
                if (overlay) overlay.classList.add('hidden');
                this.updateAdminSidebar(user);
                return true;
            } else {
                sessionStorage.removeItem('pawlife_admin_user');
                localStorage.removeItem('pawlife_admin_user');
                window.location.href = '/?auth=admin&error=admin_only';
                return false;
            }
        } catch (e) {
            sessionStorage.removeItem('pawlife_admin_user');
            localStorage.removeItem('pawlife_admin_user');
            window.location.href = '/?auth=admin';
            return false;
        }
    },

    updateAdminSidebar(user) {
        const nameEl = document.getElementById('sidebar-admin-name');
        const avatarEl = document.getElementById('sidebar-admin-avatar');
        const staffId = user.staff_id || `STF-${String(user.user_id || 1).padStart(3, '0')}`;
        
        if (nameEl) nameEl.textContent = `${user.first_name} ${user.last_name || ''}`.trim() || 'Staff User';
        if (avatarEl) {
            const initials = ((user.first_name?.[0] || 'S') + (user.last_name?.[0] || 'A')).toUpperCase();
            avatarEl.textContent = initials;
        }

        // Update badge below admin name in sidebar
        const roleBadgeEl = document.querySelector('#sidebar-admin-name + div');
        if (roleBadgeEl) {
            roleBadgeEl.innerHTML = `
                <i class="fas fa-id-badge text-[9px] text-[#FF5A27]"></i>
                <span class="font-mono">${staffId}</span> • <span>${user.role || 'Staff'}</span>
            `;
        }
    },

    async handleAdminLogin(event) {
        if (event) event.preventDefault();
        const usernameInput = document.getElementById('admin-login-username');
        const passwordInput = document.getElementById('admin-login-password');
        const errorAlert = document.getElementById('auth-error-alert');
        const loginBtn = document.getElementById('admin-login-submit-btn');

        const username = usernameInput?.value?.trim();
        const password = passwordInput?.value?.trim();

        if (!username || !password) {
            this.showAuthError('Please enter Staff ID/Email and password.');
            return;
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying Clearance...';
        }
        if (errorAlert) errorAlert.classList.add('hidden');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!data.success) {
                this.showAuthError(data.error || 'Authentication failed.');
                return;
            }

            if (!data.user || data.user.role !== 'Admin') {
                this.showAuthError('Access Denied: Only system Administrators are authorized to access the Admin Dashboard.');
                return;
            }

            // Save in sessionStorage (cleared when site/tab closed)
            sessionStorage.setItem('pawlife_admin_user', JSON.stringify(data.user));
            localStorage.removeItem('pawlife_admin_user');

            // Hide overlay
            const overlay = document.getElementById('admin-auth-overlay');
            if (overlay) overlay.classList.add('hidden');

            const staffId = data.user.staff_id || `STF-${String(data.user.user_id).padStart(3, '0')}`;
            this.showToast(`Welcome back, ${data.user.first_name}! [${staffId}] Unlocked.`, 'success');
            this.updateAdminSidebar(data.user);

            // Continue dashboard initialization
            this.bindEvents();
            this.startLiveClock();
            await this.loadAllModules();
            await this.switchView('overview');
            this.startLiveAlertPoller();
        } catch (err) {
            this.showAuthError('Connection error during authentication: ' + err.message);
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-shield-alt mr-1.5"></i><span>SIGN IN TO DASHBOARD</span>';
            }
        }
    },

    showAuthError(msg) {
        const errorAlert = document.getElementById('auth-error-alert');
        if (errorAlert) {
            errorAlert.textContent = msg;
            errorAlert.className = "p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold rounded-xl mb-4";
            errorAlert.classList.remove('hidden');
        }
    },

    autofillAdmin() {
        const usernameInput = document.getElementById('admin-login-username');
        const passwordInput = document.getElementById('admin-login-password');
        if (usernameInput) usernameInput.value = 'STF-001';
        if (passwordInput) passwordInput.value = 'password123';
        const errorAlert = document.getElementById('auth-error-alert');
        if (errorAlert) errorAlert.classList.add('hidden');
    },

    logout() {
        sessionStorage.removeItem('pawlife_admin_user');
        localStorage.removeItem('pawlife_admin_user');
        window.location.href = '/?auth=admin';
    },

    // =========================================================================
    // REAL-TIME LIVE NOTIFICATIONS POLLER (Without page refreshing)
    // =========================================================================

    playAlertChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.36);
        } catch (e) {
            // Ignore audio block if user has not interacted
        }
    },

    startLiveAlertPoller() {
        if (this._pollerInterval) clearInterval(this._pollerInterval);

        const pollTick = async () => {
            try {
                // 1. Check for newly booked appointments
                const resAppt = await fetch('/api/appointments');
                const dataAppt = await resAppt.json();
                if (dataAppt.success && Array.isArray(dataAppt.appointments)) {
                    if (!this.pollerInitialized) {
                        dataAppt.appointments.forEach(a => this.knownApptIds.add(a.appointment_id));
                    } else {
                        for (const a of dataAppt.appointments) {
                            if (!this.knownApptIds.has(a.appointment_id)) {
                                this.knownApptIds.add(a.appointment_id);
                                this.playAlertChime();
                                this.showToast(
                                    `🔔 New Appointment: ${a.pet_name} booked for ${a.service_type || 'Care'} on ${a.date} (${a.time_slot})!`,
                                    'warning'
                                );
                                // Silent update of appointments view and counters
                                if (typeof AppointmentsModule !== 'undefined' && typeof AppointmentsModule.loadAppointments === 'function') {
                                    AppointmentsModule.loadAppointments();
                                }
                                if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadDashboardKPIs === 'function') {
                                    OperationsModule.loadDashboardKPIs();
                                }
                            }
                        }
                    }
                }

                // 2. Check for operational alerts (e.g. low stock, overdue vaccines)
                const resAlerts = await fetch('/api/operations/alerts');
                const dataAlerts = await resAlerts.json();
                if (dataAlerts.success && Array.isArray(dataAlerts.alerts)) {
                    if (!this.pollerInitialized) {
                        dataAlerts.alerts.forEach(al => this.knownAlertKeys.add(`${al.alert_id || al.id || al.message}`));
                    } else {
                        for (const al of dataAlerts.alerts) {
                            const key = `${al.alert_id || al.id || al.message}`;
                            if (!this.knownAlertKeys.has(key)) {
                                this.knownAlertKeys.add(key);
                                this.playAlertChime();
                                this.showToast(
                                    `⚠️ Stock / Clinical Alert: ${al.message || al.title || 'Attention Required'}`,
                                    'danger'
                                );
                                if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadOperationalAlerts === 'function') {
                                    OperationsModule.loadOperationalAlerts();
                                }
                                if (typeof InventoryModule !== 'undefined' && typeof InventoryModule.loadSupplies === 'function') {
                                    InventoryModule.loadSupplies();
                                }
                            }
                        }
                    }
                }

                this.pollerInitialized = true;
            } catch (err) {
                // Silently handle transient connection glitch
            }
        };

        // Initial check immediately
        pollTick();
        // Recurring poll every 3.8 seconds without page reload
        this._pollerInterval = setInterval(pollTick, 3800);
    },

    bindEvents() {
        // Sidebar navigation clicks
        document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });

        // Global search input in top bar
        const searchInput = document.getElementById('dash-global-search');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                        this.executeGlobalSearch(query);
                    }
                }
            });
        }
    },

    startLiveClock() {
        const clockEl = document.getElementById('dash-live-clock');
        const updateClock = () => {
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }) + ' • ' + now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        };
        updateClock();
        setInterval(updateClock, 30000);
    },

    async loadAllModules() {
        try {
            await Promise.allSettled([
                OperationsModule.loadDashboardKPIs(),
                OperationsModule.loadOperationalAlerts(),
                OperationsModule.loadShifts(),
                AppointmentsModule.loadAppointments(),
                PetEhrModule.loadPets(),
                InventoryModule.loadSupplies(),
                GroomingModule.loadActiveQueue()
            ]);
            this.syncOverviewFeed();
        } catch (err) {
            console.error('Error loading dashboard modules:', err);
        }
    },

    async switchView(viewId) {
        this.currentView = viewId;
        window.location.hash = viewId;

        // 1. Update Sidebar Active Button State
        document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.className = 'sidebar-nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-black text-xs bg-[#FF5A27] text-white border-2 border-slate-900 shadow-[3px_3px_0px_#000] transition cursor-pointer';
            } else {
                btn.className = 'sidebar-nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-bold text-xs text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer';
            }
        });

        // 2. Hide all view panels, show active view
        document.querySelectorAll('.dashboard-view').forEach(view => {
            view.classList.add('hidden');
        });

        const targetPanel = document.getElementById(`view-${viewId}`);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }

        // 3. Update Breadcrumb & Header Title
        const breadcrumbTitle = document.getElementById('dash-breadcrumb-title');
        const breadcrumbDesc = document.getElementById('dash-breadcrumb-desc');

        const viewMeta = {
            'overview': {
                title: 'Hospital Operations Overview',
                desc: 'Real-time clinic throughput, active appointments, and priority operational alerts'
            },
            'booking': {
                title: 'Appointments & Scheduling Hub',
                desc: 'Master veterinary calendar, real-time slot conflict engine, and booking management'
            },
            'ehr': {
                title: 'Electronic Health Records & Consultations (EHR)',
                desc: 'Digital patient medical histories, clinical diagnosis logger, and vaccination tracking'
            },
            'inventory': {
                title: 'Pharmacy & Smart Supply Chain',
                desc: 'Batch tracking, automated low-stock warnings, and pharmaceutical usage deductions'
            },
            'grooming': {
                title: 'Pet Grooming & Spa Station Queue',
                desc: 'Interactive 4-station workflow pipeline with automated owner notification triggers'
            },
            'operations': {
                title: 'Operational Centre & Staff Rosters',
                desc: 'Centre throughput metrics, weekly staff duty schedule, and shift conflict validation'
            },
            'admin': {
                title: 'System Administration & Business Intelligence',
                desc: 'RBAC security matrix, immutable audit logging, and R statistical predictive revenue analytics'
            }
        };

        if (breadcrumbTitle && viewMeta[viewId]) {
            breadcrumbTitle.textContent = viewMeta[viewId].title;
            breadcrumbDesc.textContent = viewMeta[viewId].desc;
        }

        // 4. Initialize or refresh view data
        if (viewId === 'overview') {
            await this.loadAllModules();
        } else if (viewId === 'booking') {
            await AppointmentsModule.init();
        } else if (viewId === 'ehr') {
            await PetEhrModule.init();
        } else if (viewId === 'inventory') {
            await InventoryModule.init();
        } else if (viewId === 'grooming') {
            await GroomingModule.init();
        } else if (viewId === 'operations') {
            await OperationsModule.init();
            if (typeof AdminModule !== 'undefined' && typeof AdminModule.loadUsers === 'function') {
                await AdminModule.loadUsers();
            }
        } else if (viewId === 'admin') {
            await AdminModule.init();
        }
    },

    syncOverviewFeed() {
        // Populate overview top KPI cards with live data from DOM/state
        const apptCount = document.getElementById('op-kpi-appt')?.textContent || '0';
        const groomCount = document.getElementById('op-kpi-grooming')?.textContent || '0';
        const stockCount = document.getElementById('op-kpi-lowstock')?.textContent || '0';
        const overdueCount = document.getElementById('op-kpi-overdue')?.textContent || '0';
        const revenueText = document.getElementById('op-kpi-revenue')?.textContent || 'LKR 0';

        const ovAppt = document.getElementById('ov-kpi-appt');
        const ovGroom = document.getElementById('ov-kpi-groom');
        const ovStock = document.getElementById('ov-kpi-stock');
        const ovOverdue = document.getElementById('ov-kpi-overdue');
        const ovRev = document.getElementById('ov-kpi-revenue');

        if (ovAppt) ovAppt.textContent = apptCount;
        if (ovGroom) ovGroom.textContent = groomCount;
        if (ovStock) ovStock.textContent = stockCount;
        if (ovOverdue) ovOverdue.textContent = overdueCount;
        if (ovRev) ovRev.textContent = revenueText;

        // Copy alerts into overview alert container if empty
        const sourceAlerts = document.getElementById('op-alerts-container');
        const ovAlerts = document.getElementById('ov-alerts-container');
        if (sourceAlerts && ovAlerts) {
            ovAlerts.innerHTML = sourceAlerts.innerHTML || '<p class="text-xs text-slate-500 italic p-3">No critical operational alerts at this time.</p>';
        }

        // Copy today's appointments table
        const sourceTbody = document.getElementById('appointments-table-tbody');
        const ovTbody = document.getElementById('ov-appointments-tbody');
        if (sourceTbody && ovTbody) {
            ovTbody.innerHTML = sourceTbody.innerHTML || '<tr><td colspan="5" class="text-center p-4 text-xs text-slate-500 italic">No appointments scheduled for today.</td></tr>';
        }
    },

    executeGlobalSearch(query) {
        this.switchView('ehr');
        const ehrSearchInput = document.getElementById('pet-search-input');
        if (ehrSearchInput) {
            ehrSearchInput.value = query;
            PetEhrModule.searchPets();
        }
        this.showToast(`Searching patient records for "${query}"`, 'info');
    },

    toggleQuickActionMenu() {
        const menu = document.getElementById('dash-quick-action-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    },

    openNewAppointmentModal() {
        this.switchView('booking');
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            dateInput.scrollIntoView({ behavior: 'smooth' });
        }
        this.showToast('Please select your preferred date and slot to book.', 'info');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'bg-emerald-500 text-white border-slate-900',
            danger: 'bg-rose-500 text-white border-slate-900',
            warning: 'bg-amber-400 text-slate-950 border-slate-900',
            info: 'bg-[#542E88] text-white border-slate-900'
        };

        const toast = document.createElement('div');
        toast.className = `p-4 rounded-2xl border-2 shadow-[4px_4px_0px_#000] font-black text-xs flex items-center space-x-2 transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
        toast.innerHTML = `<span>🐾</span><span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

// Global App compatibility bridge so modals and functions continue to work seamlessly
window.App = {
    showToast: (msg, type) => DashboardApp.showToast(msg, type),
    switchTab: (tabId) => DashboardApp.switchView(tabId),
    closeStaffPortal: () => { window.location.href = '/'; },
    checkNotifications: () => {
        if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadOperationalAlerts === 'function') {
            OperationsModule.loadOperationalAlerts();
        }
        if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadDashboardKPIs === 'function') {
            OperationsModule.loadDashboardKPIs();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DashboardApp.init();

    // Close quick action menu on outside click
    document.addEventListener('click', (e) => {
        const btn = document.getElementById('dash-quick-action-btn');
        const menu = document.getElementById('dash-quick-action-menu');
        if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
});

/**
 * PawLife Enterprise Dashboard Controller (dashboard.js)
 * Manages full-screen clinic & hospital management dashboard views and interactions
 */

const DashboardApp = {
    currentView: 'overview',

    async init() {
        console.log('🐾 Initializing PawLife Enterprise Dashboard...');
        
        // 1. Enforce Admin Authentication Check
        if (!this.checkAuth()) {
            console.log('🔒 Admin authentication required to access VetOps console.');
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
    },

    checkAuth() {
        const overlay = document.getElementById('admin-auth-overlay');
        const userStr = localStorage.getItem('pawlife_admin_user');
        
        if (!userStr) {
            window.location.href = '/?auth=admin';
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (user && user.role === 'Admin') {
                if (overlay) overlay.classList.add('hidden');
                this.updateAdminSidebar(user);
                return true;
            } else {
                localStorage.removeItem('pawlife_admin_user');
                window.location.href = '/?auth=admin';
                return false;
            }
        } catch (e) {
            localStorage.removeItem('pawlife_admin_user');
            window.location.href = '/?auth=admin';
            return false;
        }
    },

    updateAdminSidebar(user) {
        const nameEl = document.getElementById('sidebar-admin-name');
        const avatarEl = document.getElementById('sidebar-admin-avatar');
        if (nameEl) nameEl.textContent = `${user.first_name} ${user.last_name || ''}`.trim() || 'Administrator';
        if (avatarEl) {
            const initials = ((user.first_name?.[0] || 'S') + (user.last_name?.[0] || 'A')).toUpperCase();
            avatarEl.textContent = initials;
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
            this.showAuthError('Please enter both admin username/email and password.');
            return;
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying Admin Credentials...';
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

            // Save admin session
            localStorage.setItem('pawlife_admin_user', JSON.stringify(data.user));

            // Hide overlay
            const overlay = document.getElementById('admin-auth-overlay');
            if (overlay) overlay.classList.add('hidden');

            this.showToast(`Welcome back, ${data.user.first_name}! Admin session unlocked.`, 'success');
            this.updateAdminSidebar(data.user);

            // Continue dashboard initialization
            this.bindEvents();
            this.startLiveClock();
            await this.loadAllModules();
            await this.switchView('overview');
        } catch (err) {
            this.showAuthError('Connection error during authentication: ' + err.message);
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-shield-alt mr-1.5"></i><span>SIGN IN AS ADMINISTRATOR</span>';
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
        if (usernameInput) usernameInput.value = 'sanvidu.admin@pawlife.lk';
        if (passwordInput) passwordInput.value = 'password123';
        const errorAlert = document.getElementById('auth-error-alert');
        if (errorAlert) errorAlert.classList.add('hidden');
    },

    logout() {
        localStorage.removeItem('pawlife_admin_user');
        window.location.href = '/?auth=admin';
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
    closeStaffPortal: () => { window.location.href = '/'; }
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

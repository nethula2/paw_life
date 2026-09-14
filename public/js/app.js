/**
 * PawLife Main Application Controller
 * Real Web Architecture: Public Customer UI + Protected Staff/Admin Console
 */

const App = {
    currentPersona: 'admin',
    currentTab: 'operations',

    async init() {
        console.log('PawLife System initializing...');
        this.bindEvents();

        // Check if URL specifies auth modal
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'admin' || urlParams.get('login') === 'admin') {
            this.openAdminAuthModal();
        }
        
        // Initialize public elements
        await AppointmentsModule.loadPetsDropdown();
        AppointmentsModule.setDefaultBookingDate();
        await AppointmentsModule.checkAvailableSlots();
        await GroomingModule.viewLiveOwnerTracker(3); // Default to Bella in public view

        // Preload backend data
        await OperationsModule.loadDashboardKPIs();
        await OperationsModule.loadOperationalAlerts();
    },

    openAdminAuthModal() {
        const modal = document.getElementById('home-auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            const alertBox = document.getElementById('home-auth-error-alert');
            if (alertBox) alertBox.classList.add('hidden');
        }
    },

    closeAdminAuthModal() {
        const modal = document.getElementById('home-auth-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    autofillHomeAdmin() {
        const u = document.getElementById('home-admin-username');
        const p = document.getElementById('home-admin-password');
        if (u) u.value = 'sanvidu.admin@pawlife.lk';
        if (p) p.value = 'password123';
        const alertBox = document.getElementById('home-auth-error-alert');
        if (alertBox) alertBox.classList.add('hidden');
    },

    async submitAdminLogin(event) {
        if (event) event.preventDefault();
        const uInput = document.getElementById('home-admin-username');
        const pInput = document.getElementById('home-admin-password');
        const alertBox = document.getElementById('home-auth-error-alert');
        const submitBtn = document.getElementById('home-admin-submit-btn');

        const username = uInput?.value?.trim();
        const password = pInput?.value?.trim();

        if (!username || !password) {
            if (alertBox) {
                alertBox.textContent = 'Please provide both administrator email/username and password.';
                alertBox.classList.remove('hidden');
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying Administrator Clearance...';
        }
        if (alertBox) alertBox.classList.add('hidden');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!data.success) {
                if (alertBox) {
                    alertBox.textContent = data.error || 'Authentication failed. Please verify admin credentials.';
                    alertBox.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-1.5"></i><span>AUTHENTICATE & ENTER DASHBOARD</span>';
                }
                return;
            }

            // Save admin session
            localStorage.setItem('pawlife_admin_user', JSON.stringify(data.user));

            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2 text-emerald-400"></i>Verified! Redirecting...';
            }

            this.showToast(`Welcome back, ${data.user.first_name}! Launching VetOps Console...`, 'success');

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 400);

        } catch (err) {
            if (alertBox) {
                alertBox.textContent = 'Connection error: ' + err.message;
                alertBox.classList.remove('hidden');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-1.5"></i><span>AUTHENTICATE & ENTER DASHBOARD</span>';
            }
        }
    },

    logoutAdmin() {
        localStorage.removeItem('pawlife_admin_user');
        this.showToast('Administrator signed out.', 'info');
    },

    bindEvents() {
        // Staff portal tab switching
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    openStaffPortal() {
        window.location.href = '/dashboard';
    },

    closeStaffPortal() {
        const modal = document.getElementById('vetops-staff-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    openCustomerPetEHR() {
        // Open EHR for customer sample pet (Buddy - Pet ID 1)
        PetEhrModule.openEHRModal(1);
    },

    openCustomerNutrition() {
        const storeSec = document.getElementById('store-section');
        if (storeSec) {
            storeSec.scrollIntoView({ behavior: 'smooth' });
            if (window.StoreModule) {
                StoreModule.loadProducts('wellness');
            }
            this.showToast('Navigated to Nutrition & Wellness Kitchen Store', 'info');
        } else {
            this.showToast('Nutrition & Wellness Kitchen: High-protein raw diet & allergen mapping in stock.', 'info');
        }
    },

    togglePublicMenu() {
        const bookingSec = document.getElementById('booking-section');
        if (bookingSec) {
            bookingSec.scrollIntoView({ behavior: 'smooth' });
            this.showToast('Navigated to Online Appointment Booking', 'info');
        }
    },

    async switchPersona(roleKey) {
        this.currentPersona = roleKey;
        const roleToTabMap = {
            'admin': 'admin',
            'vet': 'ehr',
            'scheduling': 'booking',
            'inventory': 'inventory',
            'manager': 'operations',
            'groomer': 'grooming'
        };
        const targetTab = roleToTabMap[roleKey] || 'operations';
        await this.switchTab(targetTab);
    },

    async switchTab(tabId) {
        this.currentTab = tabId;

        // Toggle nav buttons in staff modal with retro-chunky styling
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.className = 'nav-tab-btn py-2.5 px-4 bg-[#FF5A27] text-white font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center space-x-2 transition cursor-pointer';
            } else {
                btn.className = 'nav-tab-btn py-2.5 px-4 bg-white text-slate-800 hover:bg-amber-50 font-black rounded-xl border-2 border-slate-900 transition flex items-center space-x-2 cursor-pointer';
            }
        });

        // Toggle panels
        document.querySelectorAll('.module-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        const activePanel = document.getElementById(`panel-${tabId}`);
        if (activePanel) {
            activePanel.classList.remove('hidden');
        }

        // Initialize target module
        if (tabId === 'operations') {
            await OperationsModule.init();
        } else if (tabId === 'ehr') {
            await PetEhrModule.init();
        } else if (tabId === 'booking') {
            await AppointmentsModule.init();
        } else if (tabId === 'inventory') {
            await InventoryModule.init();
        } else if (tabId === 'grooming') {
            await GroomingModule.init();
        } else if (tabId === 'admin') {
            await AdminModule.init();
        }
    },

    showToast(message, type = 'info') {
        const toast = document.getElementById('global-toast');
        const msgSpan = document.getElementById('toast-message');
        const icon = document.getElementById('toast-icon');

        if (!toast || !msgSpan) return;

        msgSpan.textContent = message;

        toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border-2 border-slate-900 flex items-center space-x-3 text-xs font-bold transition-all duration-300';
        icon.className = 'fas mr-1 text-sm';

        if (type === 'success') {
            toast.classList.add('bg-emerald-100', 'text-emerald-950');
            icon.classList.add('fa-check-circle', 'text-emerald-700');
        } else if (type === 'warning') {
            toast.classList.add('bg-amber-100', 'text-amber-950');
            icon.classList.add('fa-exclamation-triangle', 'text-amber-700');
        } else if (type === 'danger') {
            toast.classList.add('bg-rose-100', 'text-rose-950');
            icon.classList.add('fa-times-circle', 'text-rose-700');
        } else {
            toast.classList.add('bg-[#221B18]', 'text-white');
            icon.classList.add('fa-info-circle', 'text-amber-400');
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

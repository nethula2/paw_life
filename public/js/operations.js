/**
 * Member 05: Alahakoon A. M. B. U (IT25101534) - Developer 3
 * Module 05: Operational Centre & Staff Management Module
 * Sequence Function: Monitor Daily Clinic Dashboard and Allocate Staff Shifts (UC-05)
 */

const OperationsModule = {
    async init() {
        await this.loadDashboardKPIs();
        await this.loadOperationalAlerts();
        await this.loadShifts();
    },

    // UC-05 Step 1 & 2: Daily Operations Summary Dashboard
    async loadDashboardKPIs() {
        try {
            const res = await fetch('/api/operations/dashboard');
            const data = await res.json();
            if (!data.success) return;

            const k = data.kpis;
            document.getElementById('op-kpi-appt').textContent = k.today_appointments;
            document.getElementById('op-kpi-grooming').textContent = k.active_grooming_queue;
            document.getElementById('op-kpi-lowstock').textContent = k.low_stock_alerts;
            document.getElementById('op-kpi-overdue').textContent = k.overdue_vaccinations;
            document.getElementById('op-kpi-revenue').textContent = `LKR ${Number(k.total_revenue).toLocaleString()}`;

            // Staff on duty roster
            const staffList = document.getElementById('op-staff-duty-list');
            if (staffList) {
                if (data.staff_on_duty.length === 0) {
                    staffList.innerHTML = '<p class="text-xs text-slate-400 italic">No staff shifts logged for today.</p>';
                } else {
                    staffList.innerHTML = data.staff_on_duty.map(s => `
                        <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                            <div>
                                <span class="font-bold text-slate-800">${s.name}</span>
                                <div class="text-slate-500">${s.role}</div>
                            </div>
                            <div class="text-right font-mono">
                                <span class="badge-tag bg-teal-100 text-teal-800">${s.shift_type}</span>
                                <div class="text-[11px] text-slate-500">${s.start_time} - ${s.end_time}</div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Failed to load operations dashboard:', err);
        }
    },

    // PBI-06 / SP1-03: Operational alerts for overdue vaccinations and stock
    async loadOperationalAlerts() {
        const container = document.getElementById('op-alerts-container');
        if (!container) return;

        try {
            const res = await fetch('/api/operations/alerts');
            const data = await res.json();
            if (!data.success) return;

            let html = '';

            if (data.overdue_vaccinations.length > 0) {
                html += data.overdue_vaccinations.map(v => `
                    <div class="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg flex items-center justify-between text-xs mb-2">
                        <div>
                            <span class="font-bold text-rose-800"><i class="fas fa-exclamation-circle mr-1"></i>Overdue Vaccination Alert:</span>
                            <span class="text-slate-800">${v.pet_name} (${v.species}) is overdue for <strong>${v.vaccine_name}</strong> (Due: ${v.next_due_date}).</span>
                            <div class="text-slate-500 text-[11px]">Owner: ${v.owner_name} (${v.owner_phone})</div>
                        </div>
                        <button onclick="PetEhrModule.openEHRModal(${v.pet_id})" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium shadow-sm">
                            Follow Up
                        </button>
                    </div>
                `).join('');
            }

            if (data.low_stock_alerts.length > 0) {
                html += data.low_stock_alerts.map(s => `
                    <div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-center justify-between text-xs mb-2">
                        <div>
                            <span class="font-bold text-amber-800"><i class="fas fa-box-open mr-1"></i>Supply Reorder Warning:</span>
                            <span class="text-slate-800"><strong>${s.supply_name}</strong> (Batch: ${s.batch_number}) has only ${s.quantity} units remaining (Threshold: ${s.min_threshold}).</span>
                        </div>
                        <button onclick="App.switchTab('inventory')" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-sm">
                            Restock
                        </button>
                    </div>
                `).join('');
            }

            if (!html) {
                html = '<div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>All operations normal. No urgent clinic alerts.</div>';
            }

            container.innerHTML = html;
        } catch (err) {
            console.error('Failed to load operational alerts:', err);
        }
    },

    // UC-05 Step 2: Load Staff Shifts & Availability Matrix
    async loadShifts() {
        const tbody = document.getElementById('shifts-table-tbody');
        if (!tbody) return;

        try {
            const res = await fetch('/api/operations/shifts');
            const data = await res.json();
            if (!data.success) return;

            tbody.innerHTML = data.shifts.map(s => `
                <tr class="hover:bg-slate-50 text-sm">
                    <td class="p-3 font-medium text-slate-800">
                        <div>${s.staff_name}</div>
                        <div class="text-xs text-slate-500">${s.role} • ${s.phone_number}</div>
                    </td>
                    <td class="p-3 font-mono text-slate-700">${s.shift_date}</td>
                    <td class="p-3">
                        <span class="badge-tag ${
                            s.shift_type === 'Morning' ? 'bg-amber-100 text-amber-800' :
                            s.shift_type === 'Evening' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                        }">${s.shift_type}</span>
                    </td>
                    <td class="p-3 font-mono text-xs text-slate-600">${s.start_time} - ${s.end_time}</td>
                    <td class="p-3"><span class="badge-tag bg-emerald-50 text-emerald-700">${s.status}</span></td>
                </tr>
            `).join('');

            // Populate modal staff dropdown
            const staffSelect = document.getElementById('shift-staff-select');
            if (staffSelect && data.available_staff) {
                staffSelect.innerHTML = data.available_staff.map(st => `
                    <option value="${st.user_id}">${st.name} (${st.role})</option>
                `).join('');
            }
        } catch (err) {
            console.error('Failed to load shifts:', err);
        }
    },

    openAssignShiftModal() {
        const modal = document.getElementById('assign-shift-modal');
        if (!modal) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('shift-date-input').value = tomorrow.toISOString().split('T')[0];
        modal.classList.remove('hidden');
    },

    closeAssignShiftModal() {
        const modal = document.getElementById('assign-shift-modal');
        if (modal) modal.classList.add('hidden');
    },

    // UC-05 Step 3-9 + Alternative Flow 5.a (Shift conflict or maximum hours exceeded)
    async submitShiftAssignment() {
        const userId = document.getElementById('shift-staff-select')?.value;
        const shiftDate = document.getElementById('shift-date-input')?.value;
        const shiftType = document.getElementById('shift-type-select')?.value;
        let startTime = '08:00:00';
        let endTime = '14:00:00';

        if (shiftType === 'Evening') {
            startTime = '14:00:00';
            endTime = '20:00:00';
        } else if (shiftType === 'Full Day') {
            startTime = '09:00:00';
            endTime = '17:00:00';
        }

        try {
            const res = await fetch('/api/operations/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    shift_date: shiftDate,
                    shift_type: shiftType,
                    start_time: startTime,
                    end_time: endTime,
                    max_hours_limit: 8
                })
            });

            const data = await res.json();

            // Alternative Flow 5.a: Warning modal detailing overlapping assignment
            if (res.status === 409 || data.conflict) {
                App.showToast(data.error || 'Shift conflict detected for this staff member.', 'danger');
                return;
            }

            if (!data.success) {
                App.showToast(data.error || 'Failed to assign shift.', 'danger');
                return;
            }

            App.showToast(data.message, 'success');
            this.closeAssignShiftModal();
            await this.loadShifts();
            await this.loadDashboardKPIs();
            App.checkNotifications();
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    }
};

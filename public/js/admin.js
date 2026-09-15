/**
 * Member 01: Sanvidu S.D.N (IT25100618) - Product Owner
 * Module 06: System Administration & Business Intelligence Module
 * Sequence Function: Configure Role-Based Access Control (RBAC) Permissions (UC-01)
 */

const AdminModule = {
    currentRoles: [],

    async init() {
        await this.loadRoles();
        await this.loadUsers();
        await this.loadAuditLogs();
        await this.loadBIAnalytics();
    },

    async loadRoles() {
        const container = document.getElementById('rbac-matrix-container');
        if (!container) return;

        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this.currentRoles = data.roles;
            this.renderRBACMatrix();
        } catch (err) {
            container.innerHTML = `<div class="p-4 text-red-600 bg-red-50 rounded">Failed to load roles: ${err.message}</div>`;
        }
    },

    renderRBACMatrix() {
        const container = document.getElementById('rbac-matrix-container');
        if (!container) return;

        let html = `
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 text-slate-700 font-semibold border-b">
                            <th class="p-3">Role Name</th>
                            <th class="p-3">Module Name</th>
                            <th class="p-3 text-center">Create</th>
                            <th class="p-3 text-center">Read</th>
                            <th class="p-3 text-center">Update</th>
                            <th class="p-3 text-center">Delete</th>
                            <th class="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
        `;

        this.currentRoles.forEach((roleGroup, rIdx) => {
            const isMaster = roleGroup.is_master_role;
            roleGroup.modules.forEach((mod, mIdx) => {
                const rowId = `rbac-${rIdx}-${mIdx}`;
                html += `
                    <tr class="hover:bg-slate-50 transition ${isMaster ? 'bg-amber-50/40' : ''}">
                        ${mIdx === 0 ? `
                            <td rowspan="${roleGroup.modules.length}" class="p-3 font-semibold text-slate-800 align-top border-r">
                                <div class="flex items-center space-x-2">
                                    <span>${roleGroup.role_name}</span>
                                    ${isMaster ? '<span class="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-mono font-bold"><i class="fas fa-lock text-xs mr-1"></i>Master Locked</span>' : ''}
                                </div>
                                <div class="text-xs text-slate-500 mt-1">${isMaster ? 'System-locked core administrator' : 'Operational Staff Role'}</div>
                            </td>
                        ` : ''}
                        <td class="p-3 font-medium text-slate-700">${mod.module_name}</td>
                        <td class="p-3 text-center">
                            <input type="checkbox" id="${rowId}-c" ${mod.can_create ? 'checked' : ''} ${isMaster ? 'disabled' : ''} class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500">
                        </td>
                        <td class="p-3 text-center">
                            <input type="checkbox" id="${rowId}-r" ${mod.can_read ? 'checked' : ''} ${isMaster ? 'disabled' : ''} class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500">
                        </td>
                        <td class="p-3 text-center">
                            <input type="checkbox" id="${rowId}-u" ${mod.can_update ? 'checked' : ''} ${isMaster ? 'disabled' : ''} class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500">
                        </td>
                        <td class="p-3 text-center">
                            <input type="checkbox" id="${rowId}-d" ${mod.can_delete ? 'checked' : ''} ${isMaster ? 'disabled' : ''} class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500">
                        </td>
                        ${mIdx === 0 ? `
                            <td rowspan="${roleGroup.modules.length}" class="p-3 text-right align-top border-l">
                                <button onclick="AdminModule.saveRolePermissions('${roleGroup.role_name}', ${rIdx})" 
                                    class="px-3 py-1.5 text-xs font-semibold rounded ${isMaster ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'}">
                                    <i class="fas fa-save mr-1"></i>Save Changes
                                </button>
                            </td>
                        ` : ''}
                    </tr>
                `;
            });
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    },

    // UC-01 Step 5 & 6 + Alternative Flow 3.a (Master Role Lock)
    async saveRolePermissions(roleName, roleIdx) {
        const roleGroup = this.currentRoles[roleIdx];
        if (!roleGroup) return;

        // Alternative Flow 3.a.1: Check if master role
        if (roleGroup.is_master_role) {
            App.showToast('Security Alert: Cannot edit default master roles. System-locked.', 'warning');
            return;
        }

        const updatedPermissions = roleGroup.modules.map((mod, mIdx) => {
            const rowId = `rbac-${roleIdx}-${mIdx}`;
            const canC = document.getElementById(`${rowId}-c`)?.checked || false;
            const canR = document.getElementById(`${rowId}-r`)?.checked || false;
            const canU = document.getElementById(`${rowId}-u`)?.checked || false;
            const canD = document.getElementById(`${rowId}-d`)?.checked || false;

            return {
                module_name: mod.module_name,
                can_create: canC,
                can_read: canR,
                can_update: canU,
                can_delete: canD
            };
        });

        try {
            const res = await fetch(`/api/admin/roles/${encodeURIComponent(roleName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': 'Admin'
                },
                body: JSON.stringify({
                    permissions: updatedPermissions,
                    updatedBy: 'System Administrator'
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to update permissions.', 'danger');
                return;
            }

            App.showToast(data.message, 'success');
            await this.loadAuditLogs(); // Refresh audit logs immediately
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    cachedUsers: [],

    async loadUsers() {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (!data.success) return;

            this.cachedUsers = data.users || [];
            this.renderStaffTable();
            this.renderAdminUsersTable();
        } catch (err) {
            console.error('Error loading users:', err);
        }
    },

    getRoleBadge(role) {
        switch (role) {
            case 'Admin':
                return '<span class="badge-tag bg-amber-100 text-amber-900 border border-amber-300 font-bold"><i class="fas fa-shield-alt mr-1"></i>Admin</span>';
            case 'Veterinary Officer':
                return '<span class="badge-tag bg-sky-100 text-sky-900 border border-sky-300 font-bold"><i class="fas fa-user-md mr-1"></i>Veterinary</span>';
            case 'Grooming Staff':
                return '<span class="badge-tag bg-purple-100 text-purple-900 border border-purple-300 font-bold"><i class="fas fa-cut mr-1"></i>Grooming</span>';
            case 'Centre Manager':
                return '<span class="badge-tag bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold"><i class="fas fa-tasks mr-1"></i>Operations</span>';
            case 'Inventory Manager':
                return '<span class="badge-tag bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold"><i class="fas fa-boxes mr-1"></i>Inventory</span>';
            default:
                return `<span class="badge-tag bg-slate-100 text-slate-800 border border-slate-300 font-bold">${role}</span>`;
        }
    },

    getStatusBadge(status) {
        if (status === 'Active') {
            return '<span class="badge-tag bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold"><i class="fas fa-circle text-[8px] mr-1 text-emerald-500"></i>Active</span>';
        } else if (status === 'Inactive') {
            return '<span class="badge-tag bg-rose-100 text-rose-800 border border-rose-300 font-bold"><i class="fas fa-circle text-[8px] mr-1 text-rose-500"></i>Inactive</span>';
        } else {
            return `<span class="badge-tag bg-amber-100 text-amber-800 border border-amber-300 font-bold">${status}</span>`;
        }
    },

    renderStaffTable() {
        const tbody = document.getElementById('staff-table-tbody');
        if (!tbody) return;

        const roleFilter = document.getElementById('staff-role-filter')?.value || 'ALL';
        const searchQuery = (document.getElementById('staff-search-input')?.value || '').trim().toLowerCase();

        const staffMembers = this.cachedUsers.filter(u => {
            if (u.role === 'Pet Owner') return false;
            if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
            if (searchQuery) {
                const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                const phone = (u.phone_number || '').toLowerCase();
                if (!fullName.includes(searchQuery) && !email.includes(searchQuery) && !phone.includes(searchQuery)) {
                    return false;
                }
            }
            return true;
        });

        if (staffMembers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-6 text-center text-slate-400 italic">
                        No staff members found matching your search/filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = staffMembers.map(u => {
            const isMaster = u.user_id === 1;
            const initials = `${(u.first_name || 'U')[0]}${(u.last_name || '')[0] || ''}`.toUpperCase();
            return `
                <tr class="hover:bg-amber-50/50 text-xs transition border-b border-slate-100">
                    <td class="p-3 font-mono font-bold text-slate-600">#${u.user_id}</td>
                    <td class="p-3">
                        <div class="flex items-center space-x-2.5">
                            <div class="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                                ${initials}
                            </div>
                            <div>
                                <div class="font-black text-slate-900 text-sm flex items-center space-x-1.5">
                                    <span>${u.first_name} ${u.last_name}</span>
                                    ${isMaster ? '<span class="px-1.5 py-0.5 text-[9px] bg-amber-400 text-slate-950 font-black rounded font-mono">MASTER</span>' : ''}
                                </div>
                                <div class="text-[11px] text-slate-500 font-medium">${u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-3">
                        ${this.getRoleBadge(u.role)}
                    </td>
                    <td class="p-3 font-mono text-slate-700">
                        ${u.phone_number || '<span class="text-slate-400 italic">Not set</span>'}
                    </td>
                    <td class="p-3">
                        ${this.getStatusBadge(u.status)}
                    </td>
                    <td class="p-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end space-x-1.5">
                            <button onclick="AdminModule.openEditStaffModal(${u.user_id})" title="Edit Staff Details"
                                class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#000] font-bold text-xs transition flex items-center space-x-1">
                                <i class="fas fa-user-edit text-[#FF5A27]"></i>
                                <span>Edit</span>
                            </button>
                            ${isMaster ? `
                                <span class="px-2 py-1 text-[11px] bg-slate-100 text-slate-500 font-bold rounded border border-slate-300 cursor-not-allowed" title="Master Admin is protected">
                                    <i class="fas fa-lock mr-1"></i>Protected
                                </span>
                            ` : `
                                <button onclick="AdminModule.toggleUserStatus(${u.user_id}, '${u.status === 'Active' ? 'Inactive' : 'Active'}')"
                                    title="${u.status === 'Active' ? 'Deactivate Staff' : 'Activate Staff'}"
                                    class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#000] font-bold text-xs transition">
                                    ${u.status === 'Active' ? '<i class="fas fa-user-slash text-rose-600 mr-1"></i>Deactivate' : '<i class="fas fa-user-check text-emerald-600 mr-1"></i>Activate'}
                                </button>
                                <button onclick="AdminModule.deleteStaff(${u.user_id}, '${u.first_name} ${u.last_name}', '${u.role}')" title="Delete Staff Account"
                                    class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border-2 border-rose-300 font-bold text-xs transition">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterStaffTable() {
        this.renderStaffTable();
    },

    renderAdminUsersTable() {
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.cachedUsers.map(u => {
            const isMaster = u.user_id === 1;
            return `
                <tr class="hover:bg-slate-50 text-xs transition">
                    <td class="p-3 font-mono font-bold text-slate-500">#${u.user_id}</td>
                    <td class="p-3 font-bold text-slate-900">${u.first_name} ${u.last_name}</td>
                    <td class="p-3 text-slate-600 font-medium">${u.email}</td>
                    <td class="p-3 text-slate-600 font-mono">${u.phone_number || '-'}</td>
                    <td class="p-3">${this.getRoleBadge(u.role)}</td>
                    <td class="p-3">${this.getStatusBadge(u.status)}</td>
                    <td class="p-3 text-right">
                        <div class="flex items-center justify-end space-x-1">
                            <button onclick="AdminModule.openEditStaffModal(${u.user_id})" class="px-2 py-1 text-xs border rounded hover:bg-slate-100 text-slate-700">
                                <i class="fas fa-edit mr-1 text-[#FF5A27]"></i>Edit
                            </button>
                            ${isMaster ? `
                                <span class="px-2 py-1 text-xs text-slate-400 font-mono"><i class="fas fa-lock"></i></span>
                            ` : `
                                <button onclick="AdminModule.toggleUserStatus(${u.user_id}, '${u.status === 'Active' ? 'Inactive' : 'Active'}')"
                                    class="px-2 py-1 text-xs border rounded hover:bg-slate-100 text-slate-700">
                                    ${u.status === 'Active' ? '<i class="fas fa-ban mr-1 text-red-500"></i>Deactivate' : '<i class="fas fa-check mr-1 text-green-500"></i>Activate'}
                                </button>
                                <button onclick="AdminModule.deleteStaff(${u.user_id}, '${u.first_name} ${u.last_name}', '${u.role}')"
                                    class="px-2 py-1 text-xs border rounded hover:bg-red-50 text-red-600">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openAddStaffModal() {
        document.getElementById('add-staff-fname').value = '';
        document.getElementById('add-staff-lname').value = '';
        document.getElementById('add-staff-email').value = '';
        document.getElementById('add-staff-phone').value = '';
        document.getElementById('add-staff-pwd').value = '';
        document.getElementById('add-staff-role').value = 'Veterinary Officer';
        document.getElementById('add-staff-status').value = 'Active';
        const modal = document.getElementById('add-staff-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAddStaffModal() {
        const modal = document.getElementById('add-staff-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitAddStaff() {
        const fName = document.getElementById('add-staff-fname')?.value.trim();
        const lName = document.getElementById('add-staff-lname')?.value.trim();
        const role = document.getElementById('add-staff-role')?.value;
        const status = document.getElementById('add-staff-status')?.value || 'Active';
        const email = document.getElementById('add-staff-email')?.value.trim();
        const phone = document.getElementById('add-staff-phone')?.value.trim();
        const password = document.getElementById('add-staff-pwd')?.value.trim();

        if (!fName || !lName || !email || !role) {
            App.showToast('Please fill in all mandatory fields (First Name, Last Name, Email, Role).', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: fName,
                    last_name: lName,
                    role: role,
                    status: status,
                    email: email,
                    phone_number: phone,
                    password: password || 'password123'
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to create staff member.', 'danger');
                return;
            }

            App.showToast(data.message || 'Staff member created successfully!', 'success');
            this.closeAddStaffModal();
            await this.loadUsers();
            if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadShifts === 'function') {
                await OperationsModule.loadShifts();
            }
            await this.loadAuditLogs();
        } catch (err) {
            App.showToast(`Error creating staff member: ${err.message}`, 'danger');
        }
    },

    openEditStaffModal(userId) {
        const user = this.cachedUsers.find(u => u.user_id === userId);
        if (!user) {
            App.showToast('User record not found.', 'danger');
            return;
        }

        document.getElementById('edit-staff-id').value = user.user_id;
        document.getElementById('edit-staff-fname').value = user.first_name || '';
        document.getElementById('edit-staff-lname').value = user.last_name || '';
        document.getElementById('edit-staff-email').value = user.email || '';
        document.getElementById('edit-staff-phone').value = user.phone_number || '';
        document.getElementById('edit-staff-pwd').value = '';

        const roleSelect = document.getElementById('edit-staff-role');
        const statusSelect = document.getElementById('edit-staff-status');
        const masterWarning = document.getElementById('edit-staff-master-warning');

        if (roleSelect) roleSelect.value = user.role;
        if (statusSelect) statusSelect.value = user.status;

        const isMaster = user.user_id === 1;
        if (isMaster) {
            if (roleSelect) roleSelect.disabled = true;
            if (statusSelect) statusSelect.disabled = true;
            if (masterWarning) masterWarning.classList.remove('hidden');
        } else {
            if (roleSelect) roleSelect.disabled = false;
            if (statusSelect) statusSelect.disabled = false;
            if (masterWarning) masterWarning.classList.add('hidden');
        }

        const modal = document.getElementById('edit-staff-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeEditStaffModal() {
        const modal = document.getElementById('edit-staff-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitEditStaff() {
        const userId = parseInt(document.getElementById('edit-staff-id')?.value, 10);
        if (!userId) return;

        const fName = document.getElementById('edit-staff-fname')?.value.trim();
        const lName = document.getElementById('edit-staff-lname')?.value.trim();
        const role = document.getElementById('edit-staff-role')?.value;
        const status = document.getElementById('edit-staff-status')?.value;
        const email = document.getElementById('edit-staff-email')?.value.trim();
        const phone = document.getElementById('edit-staff-phone')?.value.trim();
        const password = document.getElementById('edit-staff-pwd')?.value.trim();

        if (!fName || !lName || !email) {
            App.showToast('Please fill in all mandatory fields.', 'warning');
            return;
        }

        const payload = {
            first_name: fName,
            last_name: lName,
            role: role,
            status: status,
            email: email,
            phone_number: phone
        };
        if (password) {
            payload.password = password;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to update staff member.', 'danger');
                return;
            }

            App.showToast(data.message || 'Staff member updated successfully!', 'success');
            this.closeEditStaffModal();
            await this.loadUsers();
            if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadShifts === 'function') {
                await OperationsModule.loadShifts();
            }
            await this.loadAuditLogs();
        } catch (err) {
            App.showToast(`Error updating staff: ${err.message}`, 'danger');
        }
    },

    async deleteStaff(userId, name, role) {
        if (userId === 1) {
            App.showToast('Security Alert: Master Administrator account cannot be deleted.', 'warning');
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete staff member "${name}" (${role})?\n\nThis will remove their shifts and access credentials.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to delete staff member.', 'danger');
                return;
            }

            App.showToast(data.message || `Staff member "${name}" deleted successfully.`, 'success');
            await this.loadUsers();
            if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadShifts === 'function') {
                await OperationsModule.loadShifts();
            }
            await this.loadAuditLogs();
        } catch (err) {
            App.showToast(`Error deleting staff member: ${err.message}`, 'danger');
        }
    },

    async toggleUserStatus(userId, newStatus) {
        if (userId === 1 && newStatus !== 'Active') {
            App.showToast('Security Alert: Master Administrator account cannot be deactivated.', 'warning');
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                App.showToast(data.message, 'success');
                await this.loadUsers();
                if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadShifts === 'function') {
                    await OperationsModule.loadShifts();
                }
                await this.loadAuditLogs();
            } else {
                App.showToast(data.error || 'Failed to change status.', 'danger');
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    async loadAuditLogs() {
        const container = document.getElementById('audit-logs-tbody');
        if (!container) return;

        try {
            const res = await fetch('/api/admin/audit-logs');
            const data = await res.json();
            if (!data.success) return;

            container.innerHTML = data.logs.map(log => `
                <tr class="hover:bg-slate-50 text-xs font-mono">
                    <td class="p-2.5 text-slate-400">#${log.log_id}</td>
                    <td class="p-2.5 text-slate-500 whitespace-nowrap">${log.timestamp}</td>
                    <td class="p-2.5 font-sans font-semibold text-slate-800">${log.user_name}</td>
                    <td class="p-2.5 font-bold text-teal-700">${log.action}</td>
                    <td class="p-2.5 font-sans text-slate-600">${log.module_name}</td>
                    <td class="p-2.5 font-sans text-slate-700 break-words">${log.details}</td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading audit logs:', err);
        }
    },

    async loadBIAnalytics() {
        const container = document.getElementById('bi-analytics-content');
        if (!container) return;

        try {
            const res = await fetch('/api/admin/bi-analytics');
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const m = data.metrics;
            document.getElementById('bi-total-rev').textContent = `LKR ${Number(m.total_revenue).toLocaleString()}`;
            document.getElementById('bi-total-appt').textContent = m.total_appointments;
            document.getElementById('bi-avg-txn').textContent = `LKR ${Number(m.avg_transaction).toLocaleString()}`;
            document.getElementById('bi-projected-rev').textContent = `LKR ${Number(m.projected_revenue).toLocaleString()}`;

            // Refresh chart with timestamp cache-buster
            const chartImg = document.getElementById('bi-r-chart-img');
            if (chartImg) {
                chartImg.src = `${data.chart_url}?t=${Date.now()}`;
            }
        } catch (err) {
            console.error('Error running R BI Analytics:', err);
        }
    }
};

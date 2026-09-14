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

    async loadUsers() {
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;

        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (!data.success) return;

            tbody.innerHTML = data.users.map(u => `
                <tr class="hover:bg-slate-50 text-sm">
                    <td class="p-3 font-mono text-slate-500">#${u.user_id}</td>
                    <td class="p-3 font-medium text-slate-800">${u.first_name} ${u.last_name}</td>
                    <td class="p-3 text-slate-600">${u.email}</td>
                    <td class="p-3 text-slate-600">${u.phone_number || '-'}</td>
                    <td class="p-3"><span class="badge-tag bg-indigo-50 text-indigo-700">${u.role}</span></td>
                    <td class="p-3">
                        <span class="badge-tag ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                            ${u.status}
                        </span>
                    </td>
                    <td class="p-3 text-right">
                        <button onclick="AdminModule.toggleUserStatus(${u.user_id}, '${u.status === 'Active' ? 'Inactive' : 'Active'}')"
                            class="px-2 py-1 text-xs border rounded hover:bg-slate-100 text-slate-700">
                            ${u.status === 'Active' ? '<i class="fas fa-ban mr-1 text-red-500"></i>Deactivate' : '<i class="fas fa-check mr-1 text-green-500"></i>Activate'}
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading users:', err);
        }
    },

    async toggleUserStatus(userId, newStatus) {
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
                await this.loadAuditLogs();
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

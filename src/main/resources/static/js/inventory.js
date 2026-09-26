/**
 * Member 04: Balasooriya B. A. H. N (IT25103607) - Developer 2
 * Module 03: Smart Inventory & Medical Supply Chain Management Module
 * Sequence Function: Track Medicine Stock Levels with Batch and Expiry Dates (UC-04)
 */

const InventoryModule = {
    currentTab: 'supplies',
    cachedSuppliers: [],

    async init() {
        await this.loadSupplies();
        await this.loadSuppliers();
        await this.loadSuppliersDropdown();
    },

    getCurrentUser() {
        try {
            const raw = sessionStorage.getItem('pawlife_admin_user') || localStorage.getItem('pawlife_admin_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    canManageSuppliers() {
        const u = this.getCurrentUser();
        if (!u) return true; // Default allow if not logged in or in public demo
        return u.role === 'Admin' || u.role === 'Inventory Manager' || u.role === 'Centre Manager';
    },

    switchTab(tab) {
        this.currentTab = tab;
        const suppliesCont = document.getElementById('inventory-supplies-container');
        const suppliersCont = document.getElementById('inventory-suppliers-container');
        const btnSupplies = document.getElementById('tab-btn-supplies');
        const btnSuppliers = document.getElementById('tab-btn-suppliers');
        const btnTopBatch = document.getElementById('btn-add-batch-top');
        const btnTopSupplier = document.getElementById('btn-add-supplier-top');

        if (tab === 'suppliers') {
            if (suppliesCont) suppliesCont.classList.add('hidden');
            if (suppliersCont) suppliersCont.classList.remove('hidden');

            if (btnSupplies) {
                btnSupplies.className = "px-5 py-2.5 rounded-xl font-bold text-xs uppercase border-2 border-slate-900 bg-white text-slate-700 hover:bg-amber-50 shadow-[2px_2px_0px_#000] cursor-pointer transition";
            }
            if (btnSuppliers) {
                btnSuppliers.className = "px-5 py-2.5 rounded-xl font-black text-xs uppercase border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0px_#000] cursor-pointer transition";
            }
            if (btnTopBatch) btnTopBatch.classList.add('hidden');
            if (btnTopSupplier) btnTopSupplier.classList.remove('hidden');

            this.loadSuppliers();
        } else {
            if (suppliesCont) suppliesCont.classList.remove('hidden');
            if (suppliersCont) suppliersCont.classList.add('hidden');

            if (btnSupplies) {
                btnSupplies.className = "px-5 py-2.5 rounded-xl font-black text-xs uppercase border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0px_#000] cursor-pointer transition";
            }
            if (btnSuppliers) {
                btnSuppliers.className = "px-5 py-2.5 rounded-xl font-bold text-xs uppercase border-2 border-slate-900 bg-white text-slate-700 hover:bg-amber-50 shadow-[2px_2px_0px_#000] cursor-pointer transition";
            }
            if (btnTopBatch) btnTopBatch.classList.remove('hidden');
            if (btnTopSupplier) btnTopSupplier.classList.add('hidden');

            this.loadSupplies();
        }
    },

    // UC-04 Step 1 & 2: Search item by Code, Batch, or Name
    async loadSupplies() {
        const search = document.getElementById('inventory-search-input')?.value.trim();
        const category = document.getElementById('inventory-category-filter')?.value;
        const lowStockOnly = document.getElementById('inventory-low-stock-check')?.checked;
        const tbody = document.getElementById('inventory-table-tbody');

        if (!tbody) return;

        try {
            let url = '/api/inventory?';
            if (search) url += `search=${encodeURIComponent(search)}&`;
            if (category) url += `category=${encodeURIComponent(category)}&`;
            if (lowStockOnly) url += `low_stock_only=true&`;

            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) return;

            if (!data.supplies || data.supplies.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-xs text-slate-500 italic font-medium">No inventory items match your search criteria.</td></tr>';
                return;
            }

            tbody.innerHTML = data.supplies.map(item => `
                <tr class="hover:bg-slate-50 text-sm ${item.is_low_stock ? 'bg-rose-50/40' : ''}">
                    <td class="p-3 font-bold text-slate-800">${item.supply_name}</td>
                    <td class="p-3">
                        <span class="badge-tag ${
                            item.category === 'Vaccine' ? 'bg-emerald-100 text-emerald-800' :
                            item.category === 'Antibiotic' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }">${item.category}</span>
                    </td>
                    <td class="p-3 font-mono text-xs text-slate-700 font-semibold">${item.batch_number}</td>
                    <td class="p-3">
                        <div class="flex items-center space-x-2">
                            <span class="font-bold ${item.is_low_stock ? 'text-rose-600 font-mono text-base' : 'text-slate-800'}">
                                ${item.quantity} units
                            </span>
                            ${item.is_low_stock ? '<span class="badge-tag bg-rose-100 text-rose-800 animate-bounce"><i class="fas fa-exclamation-triangle mr-1"></i>Low Stock</span>' : ''}
                        </div>
                        <div class="text-xs text-slate-400">Min Threshold: ${item.min_threshold}</div>
                    </td>
                    <td class="p-3 font-mono text-xs ${item.is_expired ? 'text-rose-600 font-bold' : 'text-slate-600'}">
                        ${item.expiry_date}
                        ${item.is_expired ? '<div class="text-[11px] text-rose-600 font-bold">Expired</div>' : ''}
                    </td>
                    <td class="p-3 text-slate-700">LKR ${Number(item.unit_price).toFixed(2)}</td>
                    <td class="p-3 text-slate-500 text-xs">${item.supplier_name || 'Direct'}</td>
                    <td class="p-3 text-right">
                        <button onclick="InventoryModule.openDeductModal(${item.supply_id}, '${item.supply_name}', ${item.quantity})"
                            class="px-2.5 py-1 text-xs border border-teal-600 text-teal-700 hover:bg-teal-50 rounded font-medium">
                            <i class="fas fa-minus mr-1"></i>Deduct Use
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Failed to load inventory supplies:', err);
        }
    },

    async loadSuppliersDropdown() {
        const select = document.getElementById('batch-supplier-select');
        if (!select) return;

        try {
            const res = await fetch('/api/inventory/suppliers');
            const data = await res.json();
            if (!data.success) return;

            select.innerHTML = data.suppliers.map(s => `
                <option value="${s.supplier_id}">${s.supplier_name} (${s.contact_no})</option>
            `).join('');
        } catch (err) {
            console.error('Failed to load suppliers:', err);
        }
    },

    openAddBatchModal() {
        const modal = document.getElementById('add-batch-modal');
        if (!modal) return;
        document.getElementById('batch-name').value = '';
        document.getElementById('batch-num').value = `BAT-${Date.now().toString().slice(-6)}`;
        document.getElementById('batch-qty').value = '25';
        document.getElementById('batch-min-thresh').value = '10';
        document.getElementById('batch-price').value = '2500';

        // Set default future expiry date (6 months from today)
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        document.getElementById('batch-expiry').value = futureDate.toISOString().split('T')[0];

        modal.classList.remove('hidden');
    },

    closeAddBatchModal() {
        const modal = document.getElementById('add-batch-modal');
        if (modal) modal.classList.add('hidden');
    },

    // UC-04 Step 3-7 + Alternative Flow 4.a (Expiry date invalid or in past)
    async submitNewBatch() {
        const supplyName = document.getElementById('batch-name')?.value.trim();
        const category = document.getElementById('batch-category')?.value;
        const batchNum = document.getElementById('batch-num')?.value.trim();
        const qty = document.getElementById('batch-qty')?.value;
        const minThresh = document.getElementById('batch-min-thresh')?.value;
        const expiryDate = document.getElementById('batch-expiry')?.value;
        const price = document.getElementById('batch-price')?.value;
        const supplierId = document.getElementById('batch-supplier-select')?.value;

        // Alternative Flow 4.a validation: Expiry date must be in the future
        const today = new Date().toISOString().split('T')[0];
        if (expiryDate <= today) {
            App.showToast('Validation Alert: Expiry date must be in the future.', 'danger');
            document.getElementById('batch-expiry').focus();
            return;
        }

        try {
            const res = await fetch('/api/inventory/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supply_name: supplyName,
                    category,
                    batch_number: batchNum,
                    quantity: parseInt(qty, 10) || 0,
                    min_threshold: parseInt(minThresh, 10) || 10,
                    expiry_date: expiryDate,
                    unit_price: parseFloat(price) || 0.0,
                    supplier_id: parseInt(supplierId, 10) || 3
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to save batch.', 'danger');
                return;
            }

            if (data.low_stock_warning) {
                App.showToast(`Batch added, but total stock is below reorder threshold! Automated low-stock alert triggered.`, 'warning');
            } else {
                App.showToast(`Batch saved successfully! New stock balance: ${data.total_quantity} units.`, 'success');
            }

            this.closeAddBatchModal();
            await this.loadSupplies();
            if (typeof App !== 'undefined' && typeof App.checkNotifications === 'function') {
                App.checkNotifications();
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    openDeductModal(supplyId, supplyName, currentQty) {
        const modal = document.getElementById('deduct-stock-modal');
        if (!modal) return;
        document.getElementById('deduct-supply-id').value = supplyId;
        document.getElementById('deduct-supply-name').textContent = supplyName;
        document.getElementById('deduct-current-qty').textContent = `${currentQty} units available`;
        document.getElementById('deduct-qty').value = '1';
        modal.classList.remove('hidden');
    },

    closeDeductModal() {
        const modal = document.getElementById('deduct-stock-modal');
        if (modal) modal.classList.add('hidden');
    },

    // PBI-15: Deduct inventory upon clinical/grooming use
    async submitStockDeduction() {
        const supplyId = document.getElementById('deduct-supply-id').value;
        const qtyUsed = document.getElementById('deduct-qty').value;
        const sessionRef = document.getElementById('deduct-ref').value;

        try {
            const res = await fetch('/api/inventory/deduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supply_id: supplyId,
                    quantity_used: qtyUsed,
                    session_reference: sessionRef || 'Clinical Service Use'
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Deduction failed.', 'danger');
                return;
            }

            if (data.low_stock_warning) {
                App.showToast(`Deducted ${qtyUsed} units. WARNING: Item has reached minimum threshold! Low stock alert generated.`, 'warning');
            } else {
                App.showToast(data.message, 'success');
            }

            this.closeDeductModal();
            await this.loadSupplies();
            if (typeof App !== 'undefined' && typeof App.checkNotifications === 'function') {
                App.checkNotifications();
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    // =========================================================================
    // SUPPLIERS MANAGEMENT (UC: Add, Edit, Delete Suppliers)
    // =========================================================================

    async loadSuppliers() {
        const tbody = document.getElementById('suppliers-table-tbody');
        if (!tbody) return;

        try {
            const res = await fetch('/api/inventory/suppliers');
            const data = await res.json();
            if (!data.success) return;

            this.cachedSuppliers = data.suppliers || [];
            this.renderSuppliersTable(this.cachedSuppliers);
        } catch (err) {
            console.error('Failed to load suppliers:', err);
        }
    },

    renderSuppliersTable(suppliers) {
        const tbody = document.getElementById('suppliers-table-tbody');
        if (!tbody) return;

        if (!suppliers || suppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-slate-500 italic font-medium">
                        No authorized suppliers found. Click "+ Add New Supplier" to register one.
                    </td>
                </tr>
            `;
            return;
        }

        const canManage = this.canManageSuppliers();

        tbody.innerHTML = suppliers.map(s => {
            const count = s.items_count || 0;
            return `
                <tr class="hover:bg-amber-50/40 text-xs transition border-b border-slate-100">
                    <td class="p-3 font-mono font-bold text-purple-700">
                        <span class="px-2 py-0.5 bg-purple-100 text-purple-900 rounded border border-purple-300">
                            SUP-${String(s.supplier_id).padStart(3, '0')}
                        </span>
                    </td>
                    <td class="p-3">
                        <div class="font-black text-slate-900 text-sm flex items-center space-x-2">
                            <i class="fas fa-building text-slate-400 text-xs"></i>
                            <span>${s.supplier_name}</span>
                        </div>
                    </td>
                    <td class="p-3 font-mono font-bold text-slate-700">
                        <i class="fas fa-phone-alt text-[#FF5A27] text-[10px] mr-1"></i>
                        ${s.contact_no || '<span class="text-slate-400 italic">Not set</span>'}
                    </td>
                    <td class="p-3 text-slate-600 font-medium">
                        <i class="fas fa-envelope text-amber-500 text-[10px] mr-1"></i>
                        ${s.email || '<span class="text-slate-400 italic">Not set</span>'}
                    </td>
                    <td class="p-3 text-slate-600 font-medium max-w-xs truncate" title="${s.address || ''}">
                        <i class="fas fa-map-marker-alt text-teal-600 text-[10px] mr-1"></i>
                        ${s.address || '<span class="text-slate-400 italic">Not set</span>'}
                    </td>
                    <td class="p-3 text-center">
                        <span class="badge-tag ${count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'} font-bold">
                            ${count} items
                        </span>
                    </td>
                    <td class="p-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end space-x-1.5">
                            <button onclick="InventoryModule.openEditSupplierModal(${s.supplier_id})" title="Edit Supplier"
                                class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#000] font-bold text-xs transition flex items-center space-x-1 cursor-pointer">
                                <i class="fas fa-edit text-[#FF5A27]"></i>
                                <span>Edit</span>
                            </button>
                            <button onclick="InventoryModule.deleteSupplier(${s.supplier_id}, '${s.supplier_name.replace(/'/g, "\\'")}')" title="Remove Supplier"
                                class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border-2 border-rose-300 font-bold text-xs transition flex items-center space-x-1 cursor-pointer">
                                <i class="fas fa-trash-alt"></i>
                                <span>Remove</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterSuppliers() {
        const query = (document.getElementById('supplier-search-input')?.value || '').trim().toLowerCase();
        if (!query) {
            this.renderSuppliersTable(this.cachedSuppliers);
            return;
        }

        const filtered = this.cachedSuppliers.filter(s => {
            const name = (s.supplier_name || '').toLowerCase();
            const contact = (s.contact_no || '').toLowerCase();
            const email = (s.email || '').toLowerCase();
            const address = (s.address || '').toLowerCase();
            const id = `sup-${String(s.supplier_id).padStart(3, '0')}`.toLowerCase();
            return name.includes(query) || contact.includes(query) || email.includes(query) || address.includes(query) || id.includes(query);
        });

        this.renderSuppliersTable(filtered);
    },

    openAddSupplierModal() {
        if (!this.canManageSuppliers()) {
            App.showToast('Security Alert: Only Inventory Managers and Administrators can add suppliers.', 'warning');
            return;
        }
        document.getElementById('add-supplier-name').value = '';
        document.getElementById('add-supplier-contact').value = '';
        document.getElementById('add-supplier-email').value = '';
        document.getElementById('add-supplier-address').value = '';

        const modal = document.getElementById('add-supplier-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAddSupplierModal() {
        const modal = document.getElementById('add-supplier-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitAddSupplier() {
        const name = document.getElementById('add-supplier-name')?.value.trim();
        const contact = document.getElementById('add-supplier-contact')?.value.trim();
        const email = document.getElementById('add-supplier-email')?.value.trim();
        const address = document.getElementById('add-supplier-address')?.value.trim();

        if (!name || !contact || !email) {
            App.showToast('Please fill in Company Name, Contact Phone, and Email.', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/inventory/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_name: name,
                    contact_no: contact,
                    email: email,
                    address: address
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to add supplier.', 'danger');
                return;
            }

            App.showToast(data.message || `Supplier "${name}" registered successfully!`, 'success');
            this.closeAddSupplierModal();
            await this.loadSuppliers();
            await this.loadSuppliersDropdown();
        } catch (err) {
            App.showToast(`Error adding supplier: ${err.message}`, 'danger');
        }
    },

    openEditSupplierModal(supplierId) {
        if (!this.canManageSuppliers()) {
            App.showToast('Security Alert: Only Inventory Managers and Administrators can edit suppliers.', 'warning');
            return;
        }

        const supplier = this.cachedSuppliers.find(s => s.supplier_id === supplierId);
        if (!supplier) {
            App.showToast('Supplier record not found.', 'danger');
            return;
        }

        document.getElementById('edit-supplier-id').value = supplier.supplier_id;
        document.getElementById('edit-supplier-name').value = supplier.supplier_name || '';
        document.getElementById('edit-supplier-contact').value = supplier.contact_no || '';
        document.getElementById('edit-supplier-email').value = supplier.email || '';
        document.getElementById('edit-supplier-address').value = supplier.address || '';

        const modal = document.getElementById('edit-supplier-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeEditSupplierModal() {
        const modal = document.getElementById('edit-supplier-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitEditSupplier() {
        const supplierId = document.getElementById('edit-supplier-id')?.value;
        const name = document.getElementById('edit-supplier-name')?.value.trim();
        const contact = document.getElementById('edit-supplier-contact')?.value.trim();
        const email = document.getElementById('edit-supplier-email')?.value.trim();
        const address = document.getElementById('edit-supplier-address')?.value.trim();

        if (!name || !contact || !email) {
            App.showToast('Please fill in Company Name, Contact Phone, and Email.', 'warning');
            return;
        }

        try {
            const res = await fetch(`/api/inventory/suppliers/${supplierId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_name: name,
                    contact_no: contact,
                    email: email,
                    address: address
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to update supplier.', 'danger');
                return;
            }

            App.showToast(data.message || 'Supplier details updated successfully!', 'success');
            this.closeEditSupplierModal();
            await this.loadSuppliers();
            await this.loadSuppliersDropdown();
        } catch (err) {
            App.showToast(`Error updating supplier: ${err.message}`, 'danger');
        }
    },

    async deleteSupplier(supplierId, name) {
        if (!this.canManageSuppliers()) {
            App.showToast('Security Alert: Only Inventory Managers and Administrators can remove suppliers.', 'warning');
            return;
        }

        if (!confirm(`Are you sure you want to remove supplier "${name}"?\n\nMedical supplies linked to this supplier will have their supplier tag set to unlinked, preserving inventory records.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/inventory/suppliers/${supplierId}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to remove supplier.', 'danger');
                return;
            }

            App.showToast(data.message || `Supplier "${name}" was removed successfully.`, 'success');
            await this.loadSuppliers();
            await this.loadSuppliersDropdown();
        } catch (err) {
            App.showToast(`Error removing supplier: ${err.message}`, 'danger');
        }
    }
};

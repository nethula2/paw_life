/**
 * Member 04: Balasooriya B. A. H. N (IT25103607) - Developer 2
 * Module 03: Smart Inventory & Medical Supply Chain Management Module
 * Sequence Function: Track Medicine Stock Levels with Batch and Expiry Dates (UC-04)
 */

const InventoryModule = {
    async init() {
        await this.loadSupplies();
        await this.loadSuppliersDropdown();
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
            App.checkNotifications();
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
            App.checkNotifications();
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    }
};

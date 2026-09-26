/**
 * PawLife Customer Pet Store & Smart Inventory Module (store.js)
 * Enables pet owners to browse and purchase pet care supplies with live stock deduction
 */

const StoreModule = {
    allProducts: [],
    currentCategory: 'all',
    selectedProduct: null,

    async init() {
        console.log('🐾 Initializing Paw Pet Store & Pharmacy...');
        await this.loadProducts();
    },

    async loadProducts(category = null) {
        if (category !== null) {
            this.currentCategory = category;
        }

        const grid = document.getElementById('store-products-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="inline-block animate-spin text-3xl text-[#FF5A27] mb-2">🐾</div>
                <p class="text-xs font-bold text-slate-500">Checking live clinic stock balances...</p>
            </div>
        `;

        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();

            if (!data.success || !data.supplies) {
                grid.innerHTML = '<p class="col-span-full text-center text-xs text-rose-500 font-bold p-6">Unable to load store inventory.</p>';
                return;
            }

            this.allProducts = data.supplies;
            this.renderProducts();
        } catch (err) {
            console.error('Error loading store products:', err);
            grid.innerHTML = '<p class="col-span-full text-center text-xs text-rose-500 font-bold p-6">Failed to connect to inventory service.</p>';
        }
    },

    renderProducts() {
        const grid = document.getElementById('store-products-grid');
        if (!grid) return;

        // Filter out prescription clinical medicines from the public customer market
        const retailOnly = this.allProducts.filter(p => !['Vaccine', 'Antibiotic', 'Pain Relief', 'Surgical Supply'].includes(p.category));

        let filtered = retailOnly;

        if (this.currentCategory === 'shampoos') {
            filtered = retailOnly.filter(p => p.category === 'Grooming Shampoo');
        } else if (this.currentCategory === 'brushes') {
            filtered = retailOnly.filter(p => p.category === 'Grooming Tool');
        } else if (this.currentCategory === 'wellness') {
            filtered = retailOnly.filter(p => p.category === 'Wellness');
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 chunky-panel p-8">
                    <p class="text-base font-black text-slate-800 font-chunky mb-1">No items found in this department</p>
                    <p class="text-xs text-slate-500">Please select another category or check back soon.</p>
                </div>
            `;
            return;
        }

        // Product category icons & visuals mapping (Customer Retail Market)
        const getVisual = (cat, name) => {
            const n = name.toLowerCase();
            if (n.includes('shampoo') || n.includes('wash') || n.includes('conditioner') || n.includes('cleanser')) return { icon: '🧴', bg: 'bg-pink-100 text-pink-700' };
            if (n.includes('brush') || n.includes('slicker') || n.includes('bristle')) return { icon: '🪮', bg: 'bg-indigo-100 text-indigo-700' };
            if (n.includes('comb') || n.includes('dematting')) return { icon: '🪄', bg: 'bg-blue-100 text-blue-700' };
            if (n.includes('scrubber') || n.includes('massage')) return { icon: '🧼', bg: 'bg-teal-100 text-teal-700' };
            if (n.includes('balm')) return { icon: '🐾', bg: 'bg-amber-100 text-amber-800' };
            if (n.includes('oil') || n.includes('salmon')) return { icon: '🐟', bg: 'bg-sky-100 text-sky-700' };
            if (n.includes('chews') || n.includes('probiotic')) return { icon: '🦴', bg: 'bg-orange-100 text-orange-700' };
            if (n.includes('dental')) return { icon: '🪥', bg: 'bg-emerald-100 text-emerald-700' };
            if (cat === 'Grooming Tool') return { icon: '🪮', bg: 'bg-indigo-100 text-indigo-700' };
            if (cat === 'Grooming Shampoo') return { icon: '🧴', bg: 'bg-pink-100 text-pink-700' };
            return { icon: '🐾', bg: 'bg-amber-100 text-amber-800' };
        };

        grid.innerHTML = filtered.map(item => {
            const visual = getVisual(item.category, item.supply_name);
            const inStock = item.quantity > 0;
            const isLow = item.quantity <= item.min_threshold && inStock;

            let stockBadge = '';
            if (!inStock) {
                stockBadge = '<span class="px-2.5 py-1 text-[10px] rounded-full font-black bg-rose-100 text-rose-800 border border-rose-300">🔴 Sold Out</span>';
            } else if (isLow) {
                stockBadge = `<span class="px-2.5 py-1 text-[10px] rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300">🟠 Only ${item.quantity} Left!</span>`;
            } else {
                stockBadge = `<span class="px-2.5 py-1 text-[10px] rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 In Stock (${item.quantity})</span>`;
            }

            return `
                <div class="chunky-panel p-6 flex flex-col justify-between hover:translate-y-[-4px] transition bg-white group">
                    <div>
                        <!-- Top visual & category -->
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-2xl ${visual.bg} border-2 border-slate-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000] group-hover:scale-105 transition">
                                ${visual.icon}
                            </div>
                            <div class="flex flex-col items-end space-y-1">
                                <span class="badge-tag bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">${item.category}</span>
                                ${stockBadge}
                            </div>
                        </div>

                        <!-- Product Title -->
                        <h4 class="font-black text-slate-900 text-base font-chunky leading-snug group-hover:text-[#FF5A27] transition">
                            ${item.supply_name}
                        </h4>
                        <div class="text-[11px] text-slate-500 font-mono mt-1">
                            Batch: <span class="font-bold text-slate-700">${item.batch_number}</span> • Exp: ${item.expiry_date}
                        </div>
                    </div>

                    <!-- Bottom Price & CTA -->
                    <div class="mt-6 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Unit Price</span>
                            <span class="text-xl font-black text-slate-900 font-chunky">LKR ${parseFloat(item.unit_price).toLocaleString()}</span>
                        </div>
                        <button onclick="StoreModule.openBuyModal(${item.supply_id})" ${!inStock ? 'disabled' : ''} class="${inStock ? 'btn-chunky-brown' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300 rounded-full'} px-5 py-2.5 text-xs uppercase font-black tracking-wider flex items-center space-x-1.5 transition">
                            <i class="fas fa-shopping-bag"></i>
                            <span>${inStock ? 'BUY NOW' : 'OUT OF STOCK'}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update category filter buttons style
        document.querySelectorAll('.store-filter-btn').forEach(btn => {
            if (btn.dataset.cat === this.currentCategory) {
                btn.className = 'store-filter-btn px-5 py-2.5 rounded-full font-black text-xs bg-[#FF5A27] text-white border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition cursor-pointer';
            } else {
                btn.className = 'store-filter-btn px-5 py-2.5 rounded-full font-bold text-xs bg-white text-slate-800 border-2 border-slate-900 hover:bg-amber-100 shadow-[2px_2px_0px_#000] transition cursor-pointer';
            }
        });
    },

    openBuyModal(supplyId) {
        const product = this.allProducts.find(p => p.supply_id === supplyId);
        if (!product) return;

        this.selectedProduct = product;

        document.getElementById('buy-prod-id').value = product.supply_id;
        document.getElementById('buy-prod-name').textContent = product.supply_name;
        document.getElementById('buy-prod-category').textContent = product.category;
        document.getElementById('buy-prod-price-display').textContent = `LKR ${parseFloat(product.unit_price).toLocaleString()}`;
        document.getElementById('buy-prod-batch').textContent = `Batch: ${product.batch_number} • Exp: ${product.expiry_date}`;
        
        // Stock cap
        const maxQty = product.quantity;
        document.getElementById('buy-prod-stock-available').textContent = `${maxQty} in stock`;
        
        const qtyInput = document.getElementById('buy-quantity-input');
        qtyInput.value = 1;
        qtyInput.max = maxQty;
        qtyInput.min = 1;

        this.updateModalSubtotal();

        const modal = document.getElementById('customer-buy-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    changeQty(delta) {
        const qtyInput = document.getElementById('buy-quantity-input');
        if (!qtyInput || !this.selectedProduct) return;

        let current = parseInt(qtyInput.value, 10) || 1;
        current += delta;

        if (current < 1) current = 1;
        if (current > this.selectedProduct.quantity) {
            current = this.selectedProduct.quantity;
            App.showToast(`Maximum available stock is ${this.selectedProduct.quantity} units.`, 'warning');
        }

        qtyInput.value = current;
        this.updateModalSubtotal();
    },

    updateModalSubtotal() {
        if (!this.selectedProduct) return;
        const qty = parseInt(document.getElementById('buy-quantity-input').value, 10) || 1;
        const total = qty * this.selectedProduct.unit_price;
        document.getElementById('buy-total-amount').textContent = `LKR ${total.toLocaleString()}`;
    },

    closeBuyModal() {
        const modal = document.getElementById('customer-buy-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.selectedProduct = null;
    },

    async submitCustomerOrder() {
        if (!this.selectedProduct) return;

        const supplyId = this.selectedProduct.supply_id;
        const qty = parseInt(document.getElementById('buy-quantity-input').value, 10) || 1;
        const name = document.getElementById('buy-customer-name').value.trim();
        const phone = document.getElementById('buy-customer-phone').value.trim();
        const delivery = document.getElementById('buy-delivery-method').value;
        const payment = document.getElementById('buy-payment-method').value;

        if (!name || !phone) {
            App.showToast('Please enter your name and phone number.', 'danger');
            return;
        }

        try {
            const res = await fetch('/api/inventory/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supply_id: supplyId,
                    quantity: qty,
                    customer_name: name,
                    customer_phone: phone,
                    delivery_method: delivery,
                    payment_method: payment
                })
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to complete order.', 'danger');
                return;
            }

            // Close buy modal
            this.closeBuyModal();

            // Display Order Success Receipt
            document.getElementById('order-receipt-id').textContent = data.order_id;
            document.getElementById('order-receipt-item').textContent = `${data.quantity}x ${data.product_name}`;
            document.getElementById('order-receipt-total').textContent = `LKR ${parseFloat(data.total_amount).toLocaleString()}`;
            document.getElementById('order-receipt-fulfillment').textContent = data.delivery_method;
            document.getElementById('order-receipt-payment').textContent = data.payment_method;

            const successModal = document.getElementById('customer-order-success-modal');
            if (successModal) {
                successModal.classList.remove('hidden');
            }

            App.showToast(`Order ${data.order_id} placed successfully!`, 'success');

            // Refresh products to show updated live stock
            await this.loadProducts();

            // Also reload operations KPIs if present
            if (window.OperationsModule && typeof OperationsModule.loadDashboardKPIs === 'function') {
                OperationsModule.loadDashboardKPIs();
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    closeOrderSuccessModal() {
        const modal = document.getElementById('customer-order-success-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    StoreModule.init();
});

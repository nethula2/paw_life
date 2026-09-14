/**
 * Member 03: Subasinghe R. A. G. I (IT25102521) - Developer 1
 * Module 02: Appointment Scheduling & Notification Module
 * Sequence Function: Book Veterinary or Grooming Appointment Online (UC-03)
 */

const AppointmentsModule = {
    selectedSlot: null,

    async init() {
        await this.loadAppointments();
        await this.loadPetsDropdown();
        this.setDefaultBookingDate();
        await this.checkAvailableSlots();
    },

    openBooking() {
        const sec = document.getElementById('booking-section');
        if (sec) {
            sec.scrollIntoView({ behavior: 'smooth' });
            App.showToast('Please select your pet and choose an available time slot below.', 'info');
        }
    },

    setDefaultBookingDate() {
        const dateInput = document.getElementById('book-date-input');
        if (dateInput && !dateInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            dateInput.min = new Date().toISOString().split('T')[0];
        }
    },

    async loadPetsDropdown() {
        const select = document.getElementById('book-pet-select');
        if (!select) return;

        try {
            const res = await fetch('/api/pets');
            const data = await res.json();
            if (!data.success) return;

            select.innerHTML = data.pets.map(p => `
                <option value="${p.pet_id}">${p.pet_name} (${p.species} - ${p.breed}) • Owner: ${p.owner_name}</option>
            `).join('');
        } catch (err) {
            console.error('Failed to load pets dropdown:', err);
        }
    },

    customerMode: 'existing', // 'existing' | 'new'

    setCustomerMode(mode) {
        this.customerMode = mode;
        const tabExisting = document.getElementById('tab-mode-existing');
        const tabNew = document.getElementById('tab-mode-new');
        const contExisting = document.getElementById('container-existing-pet');
        const contNew = document.getElementById('container-new-customer');

        if (mode === 'existing') {
            if (tabExisting) {
                tabExisting.className = "px-5 py-2.5 rounded-xl font-black text-xs transition border-2 border-slate-900 bg-white text-slate-900 shadow-sm cursor-pointer";
            }
            if (tabNew) {
                tabNew.className = "px-5 py-2.5 rounded-xl font-bold text-xs transition border-2 border-transparent text-slate-600 hover:text-slate-900 cursor-pointer";
            }
            if (contExisting) contExisting.classList.remove('hidden');
            if (contNew) contNew.classList.add('hidden');
        } else {
            if (tabExisting) {
                tabExisting.className = "px-5 py-2.5 rounded-xl font-bold text-xs transition border-2 border-transparent text-slate-600 hover:text-slate-900 cursor-pointer";
            }
            if (tabNew) {
                tabNew.className = "px-5 py-2.5 rounded-xl font-black text-xs transition border-2 border-slate-900 bg-[#FF5A27] text-white shadow-sm cursor-pointer";
            }
            if (contExisting) contExisting.classList.add('hidden');
            if (contNew) contNew.classList.remove('hidden');
        }
    },

    // UC-03 Step 3 & 4: Query schedule in real time and display available time slots
    async checkAvailableSlots() {
        const dateInput = document.getElementById('book-date-input');
        const date = dateInput?.value || new Date().toISOString().split('T')[0];
        const staffId = document.getElementById('book-staff-select')?.value;
        const slotsGrid = document.getElementById('booking-slots-grid');
        const alertBox = document.getElementById('slots-empty-alert');
        const confirmBtn = document.getElementById('confirm-booking-btn');

        if (!slotsGrid) return;

        try {
            let url = `/api/appointments/available-slots?date=${date}`;
            if (staffId) url += `&staff_id=${staffId}`;

            const res = await fetch(url);
            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            const rawSlots = data.slots || [];
            const availableCount = typeof data.available_count === 'number' 
                ? data.available_count 
                : rawSlots.filter(s => (s.is_available !== undefined ? s.is_available : s.available)).length;

            // Alternative Flow 4.a: No slots available on selected date
            if (availableCount === 0 || rawSlots.length === 0) {
                this.selectedSlot = null;
                slotsGrid.innerHTML = '';
                if (alertBox) {
                    alertBox.classList.remove('hidden');
                    alertBox.textContent = data.message || 'No slots open for selected date. Please choose another date.';
                }
                if (confirmBtn) confirmBtn.disabled = true;
                return;
            }

            if (alertBox) alertBox.classList.add('hidden');

            // Find first available slot to auto-select
            const firstAvailable = rawSlots.find(s => (s.is_available !== undefined ? s.is_available : s.available));
            this.selectedSlot = firstAvailable ? (firstAvailable.slot || firstAvailable.time) : null;

            slotsGrid.innerHTML = rawSlots.map((s, idx) => {
                const slotText = s.slot || s.time;
                const isAvail = (s.is_available !== undefined ? s.is_available : s.available) === true;
                const isSelected = this.selectedSlot === slotText;
                return `
                    <button type="button" 
                        ${isAvail ? `onclick="AppointmentsModule.selectTimeSlot('${slotText}', this)"` : 'disabled'}
                        class="p-3 text-xs font-extrabold rounded-xl border-2 transition text-center shadow-sm ${
                            !isAvail 
                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through' 
                                : isSelected 
                                    ? 'slot-btn-selected border-slate-900 bg-amber-400 text-slate-900' 
                                    : 'border-slate-800 bg-white hover:bg-amber-50 text-slate-800 cursor-pointer'
                        }">
                        <div class="flex items-center justify-center space-x-1">
                            <i class="far ${isAvail ? (isSelected ? 'fa-check-circle' : 'fa-clock text-[#FF5A27]') : 'fa-times-circle text-slate-400'}"></i>
                            <span>${slotText}</span>
                        </div>
                    </button>
                `;
            }).join('');

            // Enable confirm button as long as we have an available slot
            if (confirmBtn) {
                confirmBtn.disabled = !this.selectedSlot;
            }
        } catch (err) {
            slotsGrid.innerHTML = `<div class="col-span-full p-2 text-xs text-red-600">Error loading slots: ${err.message}</div>`;
        }
    },

    selectTimeSlot(slot, btnElement) {
        this.selectedSlot = slot;
        document.querySelectorAll('#booking-slots-grid button').forEach(btn => {
            btn.classList.remove('slot-btn-selected', 'bg-amber-400');
            if (!btn.disabled) {
                btn.classList.add('bg-white');
            }
        });
        btnElement.classList.remove('bg-white');
        btnElement.classList.add('slot-btn-selected', 'bg-amber-400');
        const confirmBtn = document.getElementById('confirm-booking-btn');
        if (confirmBtn) confirmBtn.disabled = false;
    },

    // UC-03 Step 5-8 + Alternative Flow 6.a (Concurrent booking conflict detected)
    async confirmBooking() {
        const serviceType = document.getElementById('book-service-select')?.value || 'Veterinary Care';
        const bookingDate = document.getElementById('book-date-input')?.value;
        const notes = document.getElementById('book-notes-input')?.value || 'Online client booking';
        const confirmBtn = document.getElementById('confirm-booking-btn');

        if (!this.selectedSlot) {
            App.showToast('Please select an open time slot from the list.', 'warning');
            return;
        }

        if (!bookingDate) {
            App.showToast('Please choose a valid appointment date.', 'warning');
            return;
        }

        let payload = {
            service_type: serviceType,
            booking_date: bookingDate,
            time_slot: this.selectedSlot,
            notes: notes
        };

        if (this.customerMode === 'new') {
            const ownerName = document.getElementById('new-owner-name')?.value?.trim();
            const ownerPhone = document.getElementById('new-owner-phone')?.value?.trim();
            const ownerEmail = document.getElementById('new-owner-email')?.value?.trim();
            const petName = document.getElementById('new-pet-name')?.value?.trim();
            const species = document.getElementById('new-pet-species')?.value || 'Dog';
            const breed = document.getElementById('new-pet-breed')?.value?.trim() || 'Mixed Breed';

            if (!ownerName) {
                App.showToast('Please enter the owner full name.', 'warning');
                document.getElementById('new-owner-name')?.focus();
                return;
            }
            if (!ownerPhone) {
                App.showToast('Please enter contact phone number.', 'warning');
                document.getElementById('new-owner-phone')?.focus();
                return;
            }
            if (!petName) {
                App.showToast("Please enter your pet's name.", 'warning');
                document.getElementById('new-pet-name')?.focus();
                return;
            }

            payload.is_new_customer = true;
            payload.owner_name = ownerName;
            payload.owner_phone = ownerPhone;
            payload.owner_email = ownerEmail;
            payload.pet_name = petName;
            payload.species = species;
            payload.breed = breed;
        } else {
            const petId = document.getElementById('book-pet-select')?.value || 1;
            payload.is_new_customer = false;
            payload.pet_id = parseInt(petId, 10);
        }

        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Processing Booking...';
        }

        try {
            const res = await fetch('/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // Alternative Flow 6.a: Concurrent booking conflict detected
            if (res.status === 409 || data.conflict) {
                App.showToast(data.error || 'Selected slot was just reserved by another user.', 'danger');
                await this.checkAvailableSlots(); // Re-render remaining slots
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'CONFIRM & LOCK APPOINTMENT';
                }
                return;
            }

            if (!data.success) {
                App.showToast(data.error || 'Failed to confirm booking.', 'danger');
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'CONFIRM & LOCK APPOINTMENT';
                }
                return;
            }

            // Step 8: Success confirmation summary
            const petDisplayName = data.pet_name || (this.customerMode === 'new' ? document.getElementById('new-pet-name')?.value : 'Your pet');
            App.showToast(`Booking Submitted! Appointment #${data.appointment_id} for ${petDisplayName} on ${bookingDate} at ${this.selectedSlot} (Pending Admin Confirmation).`, 'success');
            
            // Show confirmation popup
            this.showBookingSuccessModal(data.appointment_id, serviceType, bookingDate, this.selectedSlot, petDisplayName);

            // If new customer was booked, clear inputs and reload dropdown
            if (this.customerMode === 'new') {
                const nName = document.getElementById('new-owner-name');
                const nPhone = document.getElementById('new-owner-phone');
                const nEmail = document.getElementById('new-owner-email');
                const nPet = document.getElementById('new-pet-name');
                const nBreed = document.getElementById('new-pet-breed');
                if (nName) nName.value = '';
                if (nPhone) nPhone.value = '';
                if (nEmail) nEmail.value = '';
                if (nPet) nPet.value = '';
                if (nBreed) nBreed.value = '';
                await this.loadPetsDropdown();
            }

            await this.loadAppointments();
            await this.checkAvailableSlots(); // Refresh slots
            if (typeof App.checkNotifications === 'function') App.checkNotifications();
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'CONFIRM & LOCK APPOINTMENT';
            }
        }
    },

    showBookingSuccessModal(apptId, service, date, slot, petName) {
        const modal = document.getElementById('booking-success-modal');
        if (!modal) return;

        document.getElementById('success-appt-id').textContent = `#APP-${apptId}`;
        document.getElementById('success-appt-service').textContent = service + (petName ? ` (${petName})` : '');
        document.getElementById('success-appt-datetime').textContent = `${date} • ${slot}`;
        
        modal.classList.remove('hidden');
    },

    closeBookingSuccessModal() {
        const modal = document.getElementById('booking-success-modal');
        if (modal) modal.classList.add('hidden');
    },

    async loadAppointments() {
        const tbody = document.getElementById('appointments-table-tbody');
        if (!tbody) return;

        try {
            const res = await fetch('/api/appointments');
            const data = await res.json();
            if (!data.success) return;

            tbody.innerHTML = data.appointments.map(a => `
                <tr class="hover:bg-amber-50/50 text-xs border-b border-slate-200">
                    <td class="p-3 font-mono font-bold text-slate-700">#APP-${a.appointment_id}</td>
                    <td class="p-3">
                        <div class="font-extrabold text-slate-900">${a.pet_name}</div>
                        <div class="text-[11px] text-slate-500">${a.species} • Owner: ${a.owner_name}</div>
                    </td>
                    <td class="p-3">
                        <span class="badge-tag ${
                            a.service_type === 'Grooming' ? 'bg-purple-100 text-purple-800' :
                            a.service_type === 'Vaccination' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }">${a.service_type}</span>
                    </td>
                    <td class="p-3 font-medium text-slate-800">
                        <div>${a.booking_date}</div>
                        <div class="text-[11px] text-slate-500 font-mono">${a.time_slot}</div>
                    </td>
                    <td class="p-3 text-[11px] text-slate-600">${a.assigned_staff_name || 'Clinic Team'}</td>
                    <td class="p-3">
                        <span class="badge-tag ${
                            a.status === 'Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' :
                            a.status === 'Confirmed' ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold' :
                            a.status === 'In Progress' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold' :
                            a.status === 'Completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold' :
                            'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                        }">
                            <i class="fas ${
                                a.status === 'Pending' ? 'fa-clock text-amber-600' :
                                a.status === 'Confirmed' ? 'fa-check text-blue-600' :
                                a.status === 'In Progress' ? 'fa-spinner fa-spin text-indigo-600' :
                                a.status === 'Completed' ? 'fa-check-double text-emerald-600' :
                                'fa-times text-rose-600'
                            } mr-1"></i>${a.status}
                        </span>
                    </td>
                    <td class="p-3 text-right space-x-1 whitespace-nowrap">
                        ${a.status === 'Pending' ? `
                            <button onclick="AppointmentsModule.updateStatus(${a.appointment_id}, 'Confirmed')"
                                title="Confirm this appointment request"
                                class="px-3 py-1.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black shadow-sm transition cursor-pointer">
                                <i class="fas fa-check mr-1"></i>Confirm
                            </button>
                            <button onclick="AppointmentsModule.updateStatus(${a.appointment_id}, 'Cancelled')"
                                title="Cancel this appointment"
                                class="px-2.5 py-1.5 text-[11px] border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition cursor-pointer">
                                <i class="fas fa-times mr-1"></i>Cancel
                            </button>
                        ` : a.status === 'Confirmed' ? `
                            <button onclick="AppointmentsModule.updateStatus(${a.appointment_id}, 'Completed')"
                                title="Mark appointment as completed"
                                class="px-3 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black shadow-sm transition cursor-pointer">
                                <i class="fas fa-check-double mr-1"></i>Complete
                            </button>
                            <button onclick="AppointmentsModule.updateStatus(${a.appointment_id}, 'Cancelled')"
                                title="Cancel this appointment"
                                class="px-2.5 py-1.5 text-[11px] border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition cursor-pointer">
                                <i class="fas fa-times mr-1"></i>Cancel
                            </button>
                        ` : a.status === 'Completed' ? `
                            <span class="inline-flex items-center text-xs font-black text-emerald-700 font-mono">
                                <i class="fas fa-check-circle mr-1 text-emerald-600"></i>Finished
                            </span>
                        ` : `
                            <span class="inline-flex items-center text-xs text-slate-400 font-mono">
                                <i class="fas fa-ban mr-1"></i>Cancelled
                            </span>
                        `}
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading appointments:', err);
        }
    },

    async updateStatus(appointmentId, status) {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                App.showToast(data.message, 'success');
                await this.loadAppointments();
                if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadDashboardKPIs === 'function') {
                    OperationsModule.loadDashboardKPIs();
                }
            } else {
                App.showToast(data.error || 'Failed to update appointment status.', 'danger');
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    }
};

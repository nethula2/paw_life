/**
 * Member 02: De Silva L.P.B (IT25101709) - Scrum Master
 * Module 01: Digital Pet Profile & Health Record Module
 * Sequence Function: Search Pet Profile and Log Medical Consultation Notes (UC-02)
 */

const PetEhrModule = {
    selectedPetId: null,

    async init() {
        await this.searchPets();
        await this.searchPublicPets('');
    },

    // Public Patient & EHR Search Engine (Instant Live Search)
    async searchPublicPets(searchVal = '') {
        const container = document.getElementById('public-pet-search-results');
        const countSpan = document.getElementById('public-search-count');
        const alertBox = document.getElementById('public-search-empty');
        if (!container) return;

        try {
            const url = searchVal.trim() ? `/api/pets?search=${encodeURIComponent(searchVal.trim())}` : '/api/pets';
            const res = await fetch(url);
            const data = await res.json();

            if (!data.pets || data.pets.length === 0) {
                container.innerHTML = '';
                if (alertBox) alertBox.classList.remove('hidden');
                if (countSpan) countSpan.textContent = '0 records found';
                return;
            }

            if (alertBox) alertBox.classList.add('hidden');
            if (countSpan) countSpan.textContent = `${data.pets.length} patient records found`;

            container.innerHTML = data.pets.map(p => `
                <div class="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#1E1613] hover:shadow-[6px_6px_0px_#1E1613] transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center space-x-3 mb-3">
                            <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-900 bg-amber-100 flex-shrink-0">
                                <img src="${p.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'}" alt="${p.pet_name}" class="w-full h-full object-cover">
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <h4 class="font-black text-lg text-slate-900 font-chunky">${p.pet_name}</h4>
                                    <span class="badge-tag bg-teal-100 text-teal-800 text-[10px]">${p.species}</span>
                                </div>
                                <div class="text-xs text-slate-500 font-medium">${p.breed} • ${p.gender}</div>
                            </div>
                        </div>

                        <div class="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-xs space-y-1 mb-4">
                            <div class="flex justify-between">
                                <span class="text-slate-500">Microchip #:</span>
                                <span class="font-mono font-bold text-slate-800">${p.microchip_no || 'Pending'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Registered Owner:</span>
                                <span class="font-bold text-slate-800">${p.owner_name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Contact:</span>
                                <span class="font-mono text-slate-700">${p.owner_phone}</span>
                            </div>
                            ${p.allergies && p.allergies !== 'None' ? `
                                <div class="text-rose-600 font-bold text-[11px] pt-1">
                                    <i class="fas fa-exclamation-triangle mr-1"></i>Allergy: ${p.allergies}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="flex space-x-2 pt-2 border-t border-slate-100">
                        <button onclick="PetEhrModule.openEHRModal(${p.pet_id})" class="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center space-x-1">
                            <i class="fas fa-file-medical"></i>
                            <span>View Clinical EHR</span>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div class="col-span-full p-4 text-rose-600 text-xs font-bold">Search error: ${err.message}</div>`;
        }
    },

    // Staff Internal Search (UC-02 Step 1 & 2)
    async searchPets() {
        const queryInput = document.getElementById('pet-search-input');
        const searchVal = queryInput ? queryInput.value.trim() : '';
        const resultsContainer = document.getElementById('pet-cards-grid');
        const alertBox = document.getElementById('pet-search-alert');

        if (!resultsContainer) return;

        try {
            const url = searchVal ? `/api/pets?search=${encodeURIComponent(searchVal)}` : '/api/pets';
            const res = await fetch(url);
            const data = await res.json();

            if (!data.pets || data.pets.length === 0) {
                resultsContainer.innerHTML = '';
                if (alertBox) {
                    alertBox.classList.remove('hidden');
                    alertBox.textContent = data.message || 'No records match search criteria. Try a different pet name or microchip number.';
                }
                return;
            }

            if (alertBox) alertBox.classList.add('hidden');

            resultsContainer.innerHTML = data.pets.map(p => `
                <div class="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#1E1613] overflow-hidden hover:shadow-[6px_6px_0px_#1E1613] transition">
                    <div class="h-40 bg-slate-100 relative overflow-hidden border-b-2 border-slate-900">
                        <img src="${p.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'}" 
                             alt="${p.pet_name}" class="w-full h-full object-cover">
                        <span class="absolute top-3 right-3 px-3 py-1 text-xs font-extrabold rounded-full bg-white text-slate-800 border border-slate-900 shadow">
                            ${p.species}
                        </span>
                    </div>
                    <div class="p-5">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-extrabold text-xl text-slate-900 font-chunky">${p.pet_name}</h3>
                            <span class="text-xs font-mono font-bold text-slate-600">${p.microchip_no || 'No Chip'}</span>
                        </div>
                        <p class="text-xs text-slate-600 mb-3 font-medium">${p.breed} • ${p.gender}</p>
                        
                        <div class="text-xs text-slate-600 mb-4 space-y-1 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80">
                            <div><i class="fas fa-user mr-1 text-slate-400"></i>Owner: <span class="font-bold text-slate-800">${p.owner_name}</span></div>
                            <div><i class="fas fa-phone mr-1 text-slate-400"></i>Contact: <span class="font-mono">${p.owner_phone}</span></div>
                            ${p.allergies && p.allergies !== 'None' ? `
                                <div class="text-rose-600 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Allergy: ${p.allergies}</div>
                            ` : ''}
                        </div>

                        <div class="flex space-x-2">
                            <button onclick="PetEhrModule.openEHRModal(${p.pet_id})" 
                                class="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold text-center shadow-sm transition">
                                <i class="fas fa-file-medical mr-1"></i>Open EHR
                            </button>
                            <button onclick="PetEhrModule.openNewConsultationModal(${p.pet_id}, '${p.pet_name}')"
                                class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-extrabold">
                                <i class="fas fa-stethoscope mr-1"></i>Consult
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            resultsContainer.innerHTML = `<div class="col-span-full p-4 text-rose-600 bg-rose-50 rounded">Failed to search pets: ${err.message}</div>`;
        }
    },

    // UC-02 Step 3 & 4: Open Complete Electronic Health Record
    async openEHRModal(petId) {
        this.selectedPetId = petId;
        const modal = document.getElementById('ehr-detail-modal');
        if (!modal) return;

        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text !== undefined && text !== null ? text : '--';
        };

        try {
            const res = await fetch(`/api/pets/${petId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const p = data.pet;
            safeSetText('ehr-pet-name', p.pet_name);
            safeSetText('ehr-pet-meta', `${p.species} • ${p.breed} • ${p.gender} • Born: ${p.date_of_birth}`);
            safeSetText('ehr-chip-no', p.microchip_no || 'N/A');
            safeSetText('ehr-pet-microchip', p.microchip_no || 'N/A');
            safeSetText('ehr-owner-name', p.owner_name);
            safeSetText('ehr-owner-phone', p.owner_phone);
            safeSetText('ehr-pet-owner', `${p.owner_name} (${p.owner_phone || 'No phone'})`);
            safeSetText('ehr-pet-gender', p.gender || '--');
            safeSetText('ehr-pet-dob', p.date_of_birth || '--');
            safeSetText('ehr-allergies-pill', p.allergies || 'None Recorded');

            // Render Consultations
            const consultList = document.getElementById('ehr-consultations-list');
            if (consultList) {
                if (!data.consultations || data.consultations.length === 0) {
                    consultList.innerHTML = '<p class="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No past consultations on record.</p>';
                } else {
                    consultList.innerHTML = data.consultations.map(c => `
                        <div class="border-2 border-slate-800 rounded-xl p-3.5 bg-white shadow-sm">
                            <div class="flex justify-between items-start mb-1.5">
                                <div>
                                    <span class="font-extrabold text-sm text-slate-900">${c.diagnosis}</span>
                                    <div class="text-[11px] text-slate-500 font-mono">${c.consultation_date} • Attending: Dr. ${c.vet_name}</div>
                                </div>
                                <span class="badge-tag bg-emerald-100 text-emerald-800">Verified Diagnosis</span>
                            </div>
                            <p class="text-xs text-slate-600 mb-1"><strong>Symptoms:</strong> ${c.symptoms}</p>
                            <p class="text-xs text-slate-600 mb-1"><strong>Vitals:</strong> ${c.vitals || 'Normal'}</p>
                            <p class="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border"><strong>Treatment Notes:</strong> ${c.treatment_notes}</p>
                        </div>
                    `).join('');
                }
            }

            // Render Vaccinations for Table view (Dashboard)
            const vacTbody = document.getElementById('ehr-vaccinations-tbody');
            if (vacTbody) {
                if (!data.vaccinations || data.vaccinations.length === 0) {
                    vacTbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-slate-500 italic">No vaccination history recorded.</td></tr>';
                } else {
                    vacTbody.innerHTML = data.vaccinations.map(v => `
                        <tr class="hover:bg-amber-50/60 border-b border-slate-100">
                            <td class="p-2.5 font-bold text-slate-900">${v.vaccine_name}</td>
                            <td class="p-2.5 font-mono text-slate-600">${v.batch_number || '--'}</td>
                            <td class="p-2.5 text-slate-600">${v.date_administered}</td>
                            <td class="p-2.5 font-bold ${v.status === 'Overdue' ? 'text-rose-600' : 'text-teal-700'}">${v.next_due_date}</td>
                            <td class="p-2.5"><span class="badge-tag ${v.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'}">${v.status}</span></td>
                        </tr>
                    `).join('');
                }
            }

            // Render Vaccinations for Card view (Index)
            const vacList = document.getElementById('ehr-vaccinations-list');
            if (vacList) {
                if (!data.vaccinations || data.vaccinations.length === 0) {
                    vacList.innerHTML = '<p class="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No vaccination history recorded.</p>';
                } else {
                    vacList.innerHTML = data.vaccinations.map(v => `
                        <div class="border-l-4 ${v.status === 'Overdue' ? 'border-rose-500 bg-rose-50/60' : 'border-teal-500 bg-teal-50/40'} pl-3 py-2 text-xs rounded-r-lg">
                            <div class="flex justify-between font-bold text-slate-800">
                                <span>${v.vaccine_name}</span>
                                <span class="badge-tag ${v.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'}">${v.status}</span>
                            </div>
                            <div class="text-slate-500 text-[11px]">Administered: ${v.date_administered} • Batch: ${v.batch_number}</div>
                            <div class="font-bold text-slate-800 mt-1">Next Booster Due: <span class="${v.status === 'Overdue' ? 'text-rose-600 font-extrabold' : 'text-teal-700 font-extrabold'}">${v.next_due_date}</span></div>
                        </div>
                    `).join('');
                }
            }

            // Render Prescriptions
            const rxList = document.getElementById('ehr-prescriptions-list');
            if (rxList) {
                if (!data.prescriptions || data.prescriptions.length === 0) {
                    rxList.innerHTML = '<p class="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No prescriptions issued.</p>';
                } else {
                    rxList.innerHTML = data.prescriptions.map(rx => `
                        <div class="border-2 border-indigo-200 rounded-xl p-3 bg-indigo-50/40 flex justify-between items-center text-xs">
                            <div>
                                <div class="font-extrabold text-indigo-900">${rx.medication_details}</div>
                                <div class="text-slate-600 font-medium">Dosage: ${rx.dosage} • ${rx.instructions}</div>
                                <div class="text-slate-400 text-[10px] font-mono">Issued: ${rx.issued_date} by Dr. ${rx.vet_name}</div>
                            </div>
                            <button onclick="PetEhrModule.printPrescription(${rx.prescription_id})" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">
                                <i class="fas fa-print mr-1"></i>Download Rx
                            </button>
                        </div>
                    `).join('');
                }
            }

            modal.classList.remove('hidden');
        } catch (err) {
            App.showToast(`Failed to open EHR: ${err.message}`, 'danger');
        }
    },

    closeEHRModal() {
        const modal = document.getElementById('ehr-detail-modal');
        if (modal) modal.classList.add('hidden');
    },

    openNewConsultationModal(petId, petName) {
        this.selectedPetId = petId;
        const modal = document.getElementById('new-consultation-modal');
        if (!modal) return;

        document.getElementById('consult-pet-id').value = petId;
        document.getElementById('consult-pet-name-display').textContent = `Log Consultation for ${petName}`;
        document.getElementById('consult-diagnosis').value = '';
        document.getElementById('consult-treatment').value = '';
        document.getElementById('consult-symptoms').value = '';
        document.getElementById('consult-vitals').value = '';
        document.getElementById('consult-rx-meds').value = '';
        document.getElementById('consult-rx-dosage').value = '';
        document.getElementById('consult-rx-instructions').value = '';

        modal.classList.remove('hidden');
    },

    closeNewConsultationModal() {
        const modal = document.getElementById('new-consultation-modal');
        if (modal) modal.classList.add('hidden');
    },

    // UC-02 Step 7-10 + Alternative Flow 8.a (Mandatory clinical fields empty)
    async submitConsultation() {
        const petId = document.getElementById('consult-pet-id').value;
        const symptoms = document.getElementById('consult-symptoms').value;
        const vitals = document.getElementById('consult-vitals').value;
        const diagnosis = document.getElementById('consult-diagnosis').value;
        const treatmentNotes = document.getElementById('consult-treatment').value;
        const rxMeds = document.getElementById('consult-rx-meds').value;
        const rxDosage = document.getElementById('consult-rx-dosage').value;
        const rxInst = document.getElementById('consult-rx-instructions').value;

        // Alternative Flow 8.a check
        if (!diagnosis || !diagnosis.trim()) {
            App.showToast('Validation Error: Diagnosis is a mandatory clinical field.', 'danger');
            document.getElementById('consult-diagnosis').focus();
            return;
        }

        if (!treatmentNotes || !treatmentNotes.trim()) {
            App.showToast('Validation Error: Treatment notes are required.', 'danger');
            document.getElementById('consult-treatment').focus();
            return;
        }

        const payload = {
            pet_id: petId,
            vet_id: 1, // Dr. De Silva L.P.B
            symptoms,
            vitals,
            diagnosis,
            treatment_notes: treatmentNotes
        };

        if (rxMeds && rxMeds.trim()) {
            payload.prescription = {
                medication_details: rxMeds,
                dosage: rxDosage || 'As directed',
                instructions: rxInst || 'Administer with food'
            };
        }

        try {
            const res = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                App.showToast(data.error || 'Failed to save consultation.', 'danger');
                return;
            }

            App.showToast('Consultation saved successfully and appended to pet health timeline!', 'success');
            this.closeNewConsultationModal();
            this.openEHRModal(petId);
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    async openAddVaccineModal() {
        const modal = document.getElementById('add-vaccine-modal');
        if (!modal) return;
        document.getElementById('vac-pet-id').value = this.selectedPetId;
        document.getElementById('vac-date-admin').value = new Date().toISOString().split('T')[0];
        modal.classList.remove('hidden');
    },

    closeAddVaccineModal() {
        const modal = document.getElementById('add-vaccine-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitVaccination() {
        const petId = this.selectedPetId || document.getElementById('vac-pet-id')?.value;
        const vacName = document.getElementById('vac-name')?.value?.trim();
        const batchNo = document.getElementById('vac-batch')?.value?.trim();
        const dateAdmin = document.getElementById('vac-date')?.value || document.getElementById('vac-date-admin')?.value;
        const remarks = document.getElementById('vac-remarks')?.value || 'Administered at clinic';

        if (!petId || !vacName || !batchNo || !dateAdmin) {
            App.showToast('Please fill all mandatory vaccine fields.', 'danger');
            return;
        }

        try {
            const res = await fetch('/api/vaccinations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pet_id: petId,
                    vaccine_name: vacName,
                    batch_number: batchNo,
                    date_administered: dateAdmin,
                    administered_by: 1,
                    remarks
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            App.showToast(`Vaccination recorded! Next booster automatically calculated: ${data.next_due_date}`, 'success');
            this.closeAddVaccineModal();
            this.closeAdministerVaccineModal();
            this.openEHRModal(petId);
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    openAdministerVaccineModal() {
        const modal = document.getElementById('administer-vaccine-modal') || document.getElementById('add-vaccine-modal');
        if (!modal) return;
        const dateInput = document.getElementById('vac-date') || document.getElementById('vac-date-admin');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        modal.classList.remove('hidden');
    },

    closeAdministerVaccineModal() {
        const modal = document.getElementById('administer-vaccine-modal') || document.getElementById('add-vaccine-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitVaccine() {
        await this.submitVaccination();
    },

    async printPrescription(prescriptionId) {
        try {
            const res = await fetch(`/api/prescriptions/${prescriptionId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const rx = data.prescription;
            const printModal = document.getElementById('prescription-modal');
            
            document.getElementById('rx-print-id').textContent = `#RX-${rx.prescription_id.toString().padStart(5, '0')}`;
            document.getElementById('rx-print-date').textContent = rx.issued_date;
            document.getElementById('rx-print-vet').textContent = `Dr. ${rx.vet_name} (${rx.license_no})`;
            document.getElementById('rx-print-pet').textContent = `${rx.pet_name} (${rx.species} - ${rx.breed})`;
            document.getElementById('rx-print-owner').textContent = `${rx.owner_name} (${rx.owner_phone})`;
            document.getElementById('rx-print-diagnosis').textContent = rx.diagnosis;
            document.getElementById('rx-print-meds').textContent = rx.medication_details;
            document.getElementById('rx-print-dosage').textContent = rx.dosage;
            document.getElementById('rx-print-inst').textContent = rx.instructions;

            printModal.classList.remove('hidden');
        } catch (err) {
            App.showToast(`Error loading prescription: ${err.message}`, 'danger');
        }
    },

    closePrescriptionModal() {
        const modal = document.getElementById('prescription-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitPetRegistration() {
        try {
            const name = (document.getElementById('reg-pet-name')?.value || document.getElementById('new-pet-name')?.value || '').trim();
            const species = (document.getElementById('reg-species')?.value || document.getElementById('new-pet-species')?.value || 'Dog').trim();
            const breed = (document.getElementById('reg-breed')?.value || document.getElementById('new-pet-breed')?.value || '').trim();
            const gender = (document.getElementById('reg-gender')?.value || document.getElementById('new-pet-gender')?.value || 'Male').trim();
            const microchip = (document.getElementById('reg-microchip')?.value || '').trim();
            const ownerPhone = (document.getElementById('reg-owner-phone')?.value || '').trim();
            const dob = (document.getElementById('reg-dob')?.value || document.getElementById('new-pet-dob')?.value || '').trim();
            const allergies = (document.getElementById('reg-allergies')?.value || document.getElementById('new-pet-allergies')?.value || 'None').trim();

            if (!name || !species || !breed) {
                const toastFn = (typeof App !== 'undefined' && App.showToast) || (typeof DashboardApp !== 'undefined' && DashboardApp.showToast);
                if (toastFn) toastFn('Please fill in mandatory fields: Pet Name, Species, and Breed.', 'danger');
                return;
            }

            const payload = {
                pet_name: name,
                species: species,
                breed: breed,
                gender: gender,
                microchip_no: microchip,
                owner_phone: ownerPhone,
                date_of_birth: dob,
                allergies: allergies
            };

            const res = await fetch('/api/pets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to register pet profile');
            }

            const modal = document.getElementById('register-pet-modal');
            if (modal) modal.classList.add('hidden');

            // Clear input fields
            ['reg-pet-name', 'reg-breed', 'reg-microchip', 'reg-owner-phone', 'reg-dob', 'reg-allergies',
             'new-pet-name', 'new-pet-breed', 'new-pet-dob', 'new-pet-allergies'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            const toastFn = (typeof App !== 'undefined' && App.showToast) || (typeof DashboardApp !== 'undefined' && DashboardApp.showToast);
            if (toastFn) toastFn(data.message || 'Pet registered successfully!', 'success');

            // Refresh patient search grid & public search
            await this.searchPets();
            await this.searchPublicPets('');

            // If on dashboard, reload operational KPIs
            if (typeof OperationsModule !== 'undefined' && typeof OperationsModule.loadDashboardKPIs === 'function') {
                OperationsModule.loadDashboardKPIs();
            }
        } catch (err) {
            const toastFn = (typeof App !== 'undefined' && App.showToast) || (typeof DashboardApp !== 'undefined' && DashboardApp.showToast);
            if (toastFn) {
                toastFn(`Error: ${err.message}`, 'danger');
            } else {
                alert(`Error: ${err.message}`);
            }
        }
    }
};

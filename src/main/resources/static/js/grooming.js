/**
 * Member 06: Warnakulasuriya G. A. D. T. S (IT25103408) - Developer 4
 * Module 04: Pet Grooming & Specialty Care Service Workflow Module
 * Sequence Function: Track Grooming Session Progress and Log Notes (UC-06)
 */

const GroomingModule = {
    selectedSessionId: null,
    currentTrackedPetId: null,
    previousStageMap: {},
    _watcherInterval: null,

    async init() {
        await this.loadQueue();
        await this.loadServices();
        this.startLiveOwnerWatcher();
    },

    // UC-06 Step 1 & 2: Station terminal queue display
    async loadQueue() {
        const queueContainer = document.getElementById('grooming-queue-columns');
        if (!queueContainer) return;

        try {
            const res = await fetch('/api/grooming/queue');
            const data = await res.json();
            if (!data.success) return;

            const stages = {
                'Checked-in': [],
                'Bathing': [],
                'Styling': [],
                'Ready for Pick-up': []
            };

            data.queue.forEach(item => {
                let st = item.progress_status;
                if (st === 'Scissor & Styling') st = 'Styling';
                if (stages[st]) {
                    stages[st].push(item);
                }
            });

            // Update column badges
            document.getElementById('queue-count-checkedin').textContent = stages['Checked-in'].length;
            document.getElementById('queue-count-bathing').textContent = stages['Bathing'].length;
            document.getElementById('queue-count-styling').textContent = stages['Styling'].length;
            document.getElementById('queue-count-ready').textContent = stages['Ready for Pick-up'].length;

            // Render columns
            this.renderColumn('queue-col-checkedin', stages['Checked-in'], 'Bathing', 'Start Bathing');
            this.renderColumn('queue-col-bathing', stages['Bathing'], 'Styling', 'Move to Styling');
            this.renderColumn('queue-col-styling', stages['Styling'], 'Ready for Pick-up', 'Mark Ready');
            this.renderColumn('queue-col-ready', stages['Ready for Pick-up'], 'Completed', 'Hand Over Pet');
        } catch (err) {
            console.error('Failed to load grooming queue:', err);
        }
    },

    renderColumn(elementId, items, nextStage, nextLabel) {
        const col = document.getElementById(elementId);
        if (!col) return;

        if (items.length === 0) {
            col.innerHTML = '<div class="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">Station idle</div>';
            return;
        }

        col.innerHTML = items.map(item => `
            <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition mb-3">
                <div class="flex items-center space-x-3 mb-2">
                    <img src="${item.pet_photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'}" 
                         alt="${item.pet_name}" class="w-12 h-12 rounded-lg object-cover">
                    <div>
                        <div class="font-bold text-slate-800">${item.pet_name}</div>
                        <div class="text-xs text-slate-500">${item.breed} • ${item.service_name}</div>
                    </div>
                </div>

                <div class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mb-2 space-y-1">
                    <div><i class="fas fa-user text-slate-400 mr-1"></i>Owner: <strong>${item.owner_name}</strong></div>
                    <div><i class="fas fa-scissors text-teal-600 mr-1"></i>Groomer: ${item.groomer_name}</div>
                    ${item.coat_condition ? `<div><i class="fas fa-info-circle text-indigo-500 mr-1"></i>Coat: ${item.coat_condition}</div>` : ''}
                    ${item.observations ? `<div class="italic text-slate-500">"${item.observations}"</div>` : ''}
                </div>

                <div class="flex space-x-1.5 pt-1">
                    <button onclick="GroomingModule.openUpdateModal(${item.session_id}, '${item.pet_name}', '${nextStage}')"
                        class="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold text-center shadow-sm">
                        ${nextLabel} &rarr;
                    </button>
                    <button onclick="GroomingModule.viewLiveOwnerTracker(${item.pet_id})"
                        title="Simulate Pet Owner Portal view"
                        class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    openUpdateModal(sessionId, petName, defaultNextStage) {
        this.selectedSessionId = sessionId;
        const modal = document.getElementById('update-grooming-modal');
        if (!modal) return;

        document.getElementById('groom-session-id').value = sessionId;
        document.getElementById('groom-pet-name-display').textContent = `Advance Grooming for ${petName}`;
        document.getElementById('groom-stage-select').value = defaultNextStage;
        document.getElementById('groom-coat-condition').value = '';
        document.getElementById('groom-notes').value = '';

        modal.classList.remove('hidden');
    },

    closeUpdateModal() {
        const modal = document.getElementById('update-grooming-modal');
        if (modal) modal.classList.add('hidden');
    },

    // UC-06 Step 3-9 + Alternative Flow 7.a (Stage equals Ready for Pick-up)
    async submitStageUpdate() {
        const sessionId = document.getElementById('groom-session-id').value;
        const targetStage = document.getElementById('groom-stage-select').value;
        const coat = document.getElementById('groom-coat-condition').value.trim();
        const obs = document.getElementById('groom-notes').value.trim();

        try {
            const res = await fetch(`/api/grooming/sessions/${sessionId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    progress_status: targetStage,
                    coat_condition: coat || undefined,
                    observations: obs || undefined
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            // Alternative Flow 7.a: Automated notification alert sent to pet owner
            if (data.owner_notified) {
                App.showToast(`Automated SMS/Push Alert sent to Owner: Pet is Ready for Pick-up!`, 'success');
            } else {
                App.showToast(data.message, 'success');
            }

            this.closeUpdateModal();
            await this.loadQueue();
            if (typeof App !== 'undefined' && typeof App.checkNotifications === 'function') {
                App.checkNotifications();
            }
        } catch (err) {
            App.showToast(`Error: ${err.message}`, 'danger');
        }
    },

    activeQueue: [],

    // PBI-18 / PBI-23: Live Grooming Progress Tracker in Pet Owner View
    async initLiveTracker() {
        const btnContainer = document.getElementById('tracker-pet-buttons');
        const viewContainer = document.getElementById('owner-grooming-tracker-container');
        
        if (!btnContainer || !viewContainer) return;

        try {
            const res = await fetch('/api/grooming/queue');
            const data = await res.json();
            
            if (data.success && data.queue && data.queue.length > 0) {
                // Filter unique active pets in queue
                const petMap = new Map();
                data.queue.forEach(item => {
                    if (item.progress_status !== 'Completed' && !petMap.has(item.pet_id)) {
                        petMap.set(item.pet_id, item);
                    }
                });

                const activePets = Array.from(petMap.values());
                this.activeQueue = activePets;

                if (activePets.length === 0) {
                    btnContainer.innerHTML = '';
                    viewContainer.innerHTML = `
                        <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                            No pets currently checked into the grooming salon.
                        </div>
                    `;
                    return;
                }

                // Render unique clickable buttons for all checked-in pets
                btnContainer.innerHTML = activePets.map(p => `
                    <button id="tracker-btn-${p.pet_id}" onclick="GroomingModule.viewLiveOwnerTracker(${p.pet_id})" 
                        class="tracker-pet-btn px-4 py-2 rounded-full border-2 border-slate-900 text-xs font-black hover:bg-slate-50 transition cursor-pointer">
                        ${p.pet_name} (${p.breed})
                    </button>
                `).join('');

                // Prefer logged-in user's pet if in queue, else default to first pet
                let defaultPetId = activePets[0].pet_id;
                if (typeof CustomerPortal !== 'undefined' && CustomerPortal.currentUser) {
                    const myPet = activePets.find(p => 
                        p.owner_phone === CustomerPortal.currentUser.phone_number || 
                        p.owner_name === CustomerPortal.currentUser.first_name + ' ' + CustomerPortal.currentUser.last_name
                    );
                    if (myPet) defaultPetId = myPet.pet_id;
                }

                await this.viewLiveOwnerTracker(defaultPetId);
            } else {
                this.activeQueue = [];
                btnContainer.innerHTML = '';
                viewContainer.innerHTML = `
                    <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                        No pets currently checked into the grooming salon.
                    </div>
                `;
            }
        } catch (err) {
            console.error("Failed to load grooming tracking data", err);
            btnContainer.innerHTML = '';
            viewContainer.innerHTML = `
                <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                    Grooming tracking service is currently updating.
                </div>
            `;
        }
    },

    async viewLiveOwnerTracker(petId, silent = true) {
        this.currentTrackedPetId = petId;
        // Update button visual states
        document.querySelectorAll('.tracker-pet-btn').forEach(btn => {
            btn.classList.remove('bg-[#FF5A27]', 'text-white', 'shadow-sm');
            btn.classList.add('hover:bg-slate-50');
        });
        const activeBtn = document.getElementById(`tracker-btn-${petId}`);
        if (activeBtn) {
            activeBtn.classList.remove('hover:bg-slate-50');
            activeBtn.classList.add('bg-[#FF5A27]', 'text-white', 'shadow-sm');
        }

        try {
            let res;
            try { res = await fetch(`/api/grooming/track/${petId}`); } catch(e) {}
            let data = {};
            if (res && res.ok) data = await res.json();
            
            let session = data.active_session;

            if (session && session.progress_status) {
                this.previousStageMap[petId] = session.progress_status;
            }

            if (!session) {
                const container = document.getElementById('owner-grooming-tracker-container');
                if (container) {
                    container.innerHTML = `
                        <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                            No active grooming session currently in progress for this pet.
                        </div>
                    `;
                }
                return;
            }

            const container = document.getElementById('owner-grooming-tracker-container');
            if (!container) return;

            const pct = session.progress_percentage || (
                session.progress_status === 'Ready for Pick-up' ? 100 :
                (session.progress_status === 'Styling' || session.progress_status === 'Scissor & Styling') ? 75 :
                (session.progress_status === 'Bathing' || session.progress_status === 'Bathing & Drying') ? 50 : 25
            );

            const queueList = this.activeQueue || [];

            container.innerHTML = `
                <div class="bg-gradient-to-r from-teal-50 to-indigo-50 p-5 rounded-2xl border-2 border-teal-200 shadow-sm space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div class="flex items-center space-x-3.5">
                            <div class="w-14 h-14 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center text-3xl shadow-[2px_2px_0px_#000]">
                                ${session.breed?.toLowerCase().includes('cat') ? '🐱' : '🐶'}
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <h4 class="font-black text-slate-900 text-lg font-chunky">${session.pet_name}</h4>
                                    <span class="text-xs text-slate-500 font-bold">(${session.breed})</span>
                                </div>
                                <div class="text-xs text-teal-800 font-bold mt-0.5">
                                    <span>${session.service_name}</span> • <span>Groomer: <strong>${session.groomer_name || 'Kasun Jayawardena'}</strong></span>
                                </div>
                            </div>
                        </div>
                        <span class="badge-tag ${
                            session.progress_status === 'Ready for Pick-up' ? 'status-ready' : 'status-bathing'
                        }">
                            <i class="fas ${session.progress_status === 'Ready for Pick-up' ? 'fa-bell animate-bounce text-emerald-600' : 'fa-spinner fa-spin text-teal-600'} mr-1"></i>${session.progress_status}
                        </span>
                    </div>

                    <!-- Step Progress Bar -->
                    <div class="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden border border-slate-300">
                        <div class="bg-teal-600 h-full rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
                    </div>

                    <div class="grid grid-cols-4 text-center text-[11px] font-black">
                        <div class="${pct >= 25 ? 'text-teal-800' : 'text-slate-400'}">1. Checked-in</div>
                        <div class="${pct >= 50 ? 'text-teal-800' : 'text-slate-400'}">2. Bathing</div>
                        <div class="${pct >= 75 ? 'text-teal-800' : 'text-slate-400'}">3. Styling</div>
                        <div class="${pct >= 100 ? 'text-emerald-700 animate-pulse' : 'text-slate-400'}">4. Ready for Pick-up</div>
                    </div>

                    ${session.observations ? `
                        <div class="text-xs bg-white p-3 rounded-xl border border-teal-200 text-slate-700 font-medium">
                            <span class="font-black text-slate-900"><i class="fas fa-clipboard-list text-teal-600 mr-1"></i>Groomer Observation:</span> ${session.observations}
                        </div>
                    ` : ''}

                    <!-- Live Salon Queue Board for Clients -->
                    ${queueList.length > 0 ? `
                        <div class="pt-4 border-t-2 border-teal-200/60">
                            <div class="flex items-center justify-between mb-2.5">
                                <div class="flex items-center space-x-1.5 text-xs font-black text-slate-800 uppercase tracking-wider font-chunky">
                                    <i class="fas fa-layer-group text-[#FF5A27]"></i>
                                    <span>Live Salon Queue (${queueList.length} Pet(s) in Care)</span>
                                </div>
                                <span class="text-[10px] text-slate-500 font-bold">Click any pet to view live progress</span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                ${queueList.map(q => `
                                    <div onclick="GroomingModule.viewLiveOwnerTracker(${q.pet_id})"
                                        class="p-2.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${q.pet_id === petId ? 'border-slate-900 bg-amber-100 shadow-[2px_2px_0px_#000]' : 'border-slate-200 bg-white hover:border-slate-900 hover:bg-amber-50/50'}">
                                        <div class="truncate mr-2">
                                            <div class="font-black text-xs text-slate-900 truncate">${q.pet_name}</div>
                                            <div class="text-[10px] text-slate-500 truncate">${q.breed}</div>
                                        </div>
                                        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                            q.progress_status === 'Ready for Pick-up' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                            q.progress_status === 'Styling' ? 'bg-purple-100 text-purple-800' :
                                            q.progress_status === 'Bathing' ? 'bg-blue-100 text-blue-800' :
                                            'bg-amber-100 text-amber-800'
                                        }">${q.progress_status}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (err) {
            console.error('Error loading live owner tracker:', err);
        }
    },

    async loadServices() {
        const container = document.getElementById('grooming-services-list');
        if (!container) return;

        try {
            const res = await fetch('/api/grooming/services');
            const data = await res.json();
            if (!data.success) return;

            container.innerHTML = data.services.map(s => `
                <div class="p-3 border border-slate-200 rounded-xl bg-white flex justify-between items-center hover:border-teal-300 transition">
                    <div>
                        <div class="font-bold text-slate-800 text-sm">${s.service_name}</div>
                        <div class="text-xs text-slate-500">${s.category} • ${s.duration_minutes} mins</div>
                        <div class="text-xs text-slate-600 mt-0.5">${s.description}</div>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-teal-700 text-sm">LKR ${Number(s.price).toLocaleString()}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading grooming services:', err);
        }
    },

    startLiveOwnerWatcher() {
        if (this._watcherInterval) clearInterval(this._watcherInterval);

        const checkTick = async () => {
            const container = document.getElementById('owner-grooming-tracker-container');
            if (!container || !this.currentTrackedPetId) return;

            try {
                const res = await fetch(`/api/grooming/track/${this.currentTrackedPetId}`);
                if (!res.ok) return;
                const data = await res.json();
                const session = data.active_session;

                if (session && session.progress_status) {
                    const oldStatus = this.previousStageMap[this.currentTrackedPetId];
                    if (oldStatus && oldStatus !== session.progress_status) {
                        this.previousStageMap[this.currentTrackedPetId] = session.progress_status;
                        
                        // Notify customer live without refreshing
                        if (typeof App !== 'undefined' && typeof App.showToast === 'function') {
                            App.showToast(
                                `🎉 Real-time Update: ${session.pet_name}'s grooming stage advanced to "${session.progress_status}"!`,
                                'success'
                            );
                        }

                        // Re-render tracker
                        await this.viewLiveOwnerTracker(this.currentTrackedPetId, false);
                    }
                }
            } catch (err) {
                // Silently ignore transient network drops
            }
        };

        this._watcherInterval = setInterval(checkTick, 3500);
    }
};

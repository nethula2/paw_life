/**
 * Member 06: Warnakulasuriya G. A. D. T. S (IT25103408) - Developer 4
 * Module 04: Pet Grooming & Specialty Care Service Workflow Module
 * Sequence Function: Track Grooming Session Progress and Log Notes (UC-06)
 */

const GroomingModule = {
    selectedSessionId: null,

    async init() {
        await this.loadQueue();
        await this.loadServices();
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

    // PBI-18 / PBI-23: Live Grooming Progress Tracker in Pet Owner View
    async viewLiveOwnerTracker(petId) {
        App.switchTab('owner');
        try {
            const res = await fetch(`/api/grooming/track/${petId}`);
            const data = await res.json();
            if (!data.success) return;

            const session = data.active_session;
            const container = document.getElementById('owner-grooming-tracker-container');
            if (!container) return;

            if (!session) {
                container.innerHTML = '<p class="text-xs text-slate-500 italic">No active grooming appointment in session for this pet.</p>';
                return;
            }

            const pct = session.progress_percentage || 25;

            container.innerHTML = `
                <div class="bg-gradient-to-r from-teal-50 to-indigo-50 p-4 rounded-xl border border-teal-100">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center space-x-3">
                            <img src="${session.pet_photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'}" class="w-12 h-12 rounded-lg object-cover">
                            <div>
                                <h4 class="font-bold text-slate-800">${session.pet_name} - Live Care Status</h4>
                                <div class="text-xs text-teal-700 font-semibold">${session.service_name} • Groomer: ${session.groomer_name}</div>
                            </div>
                        </div>
                        <span class="badge-tag ${
                            session.progress_status === 'Ready for Pick-up' ? 'status-ready' : 'status-bathing'
                        }">
                            <i class="fas fa-spinner fa-spin mr-1"></i>${session.progress_status}
                        </span>
                    </div>

                    <!-- Step Progress Bar -->
                    <div class="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-3">
                        <div class="bg-teal-600 h-full rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
                    </div>

                    <div class="grid grid-cols-4 text-center text-[11px] font-semibold text-slate-500">
                        <div class="${pct >= 25 ? 'text-teal-700 font-bold' : ''}">1. Checked-in</div>
                        <div class="${pct >= 50 ? 'text-teal-700 font-bold' : ''}">2. Bathing</div>
                        <div class="${pct >= 75 ? 'text-teal-700 font-bold' : ''}">3. Styling</div>
                        <div class="${pct >= 100 ? 'text-amber-600 font-bold animate-pulse' : ''}">4. Ready for Pick-up</div>
                    </div>

                    ${session.observations ? `
                        <div class="mt-3 text-xs bg-white p-2.5 rounded-lg border border-teal-100 text-slate-600">
                            <strong>Groomer Notes:</strong> ${session.observations}
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
    }
};

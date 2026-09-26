/**
 * Customer Reviews Module (reviews.js)
 * Fetches, renders, and handles customer review submissions
 */

const ReviewsModule = {
    selectedRating: 5,

    async init() {
        await this.loadReviews();
        this.bindStarSelectors();
    },

    async loadReviews() {
        const grid = document.getElementById('reviews-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/reviews');
            const data = await res.json();
            if (!data.success) return;

            const avgEl = document.getElementById('reviews-avg-rating');
            const countEl = document.getElementById('reviews-total-count');
            if (avgEl) avgEl.textContent = (data.total_reviews === 0) ? '0.0' : Number(data.average_rating || 0).toFixed(1);
            if (countEl) countEl.textContent = data.total_reviews || 0;

            const reviews = data.reviews || [];
            if (reviews.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full p-8 text-center bg-white rounded-2xl border-2 border-slate-900 text-xs text-slate-500 italic">
                        No reviews posted yet. Be the first pet parent to leave a review!
                    </div>
                `;
                return;
            }

            grid.innerHTML = reviews.map(r => {
                const stars = '★'.repeat(r.rating) + '☆'.repeat(Math.max(0, 5 - r.rating));
                const dateStr = r.created_at ? String(r.created_at).slice(0, 10) : 'Recent';
                const petName = r.pet_name || 'Pet';
                const service = r.service_type || 'Care Visit';
                const initial = (r.customer_name || 'C')[0].toUpperCase();

                return `
                    <div class="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_#000] flex flex-col justify-between hover:translate-y-[-2px] transition">
                        <div class="space-y-3">
                            <div class="flex justify-between items-start">
                                <div class="text-amber-400 text-sm tracking-wider font-mono font-bold">${stars}</div>
                                <span class="text-[10px] text-slate-400 font-mono font-bold">${dateStr}</span>
                            </div>
                            <p class="text-xs text-slate-700 font-medium leading-relaxed italic">
                                "${r.review_text}"
                            </p>
                        </div>
                        <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-8 h-8 rounded-full bg-amber-200 text-slate-900 font-black flex items-center justify-center text-xs border border-slate-900">
                                    ${initial}
                                </div>
                                <div>
                                    <div class="font-black text-slate-900 text-xs">${r.customer_name}</div>
                                    <div class="text-[10px] text-teal-700 font-bold flex items-center space-x-1">
                                        <i class="fas fa-paw text-[8px]"></i>
                                        <span>${petName}'s Parent</span>
                                    </div>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                                ${service}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Failed to load reviews:', err);
        }
    },

    bindStarSelectors() {
        const stars = document.querySelectorAll('.review-star-btn');
        stars.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.dataset.rating, 10);
                this.setRating(rating);
            });
        });
    },

    setRating(val) {
        this.selectedRating = val;
        const stars = document.querySelectorAll('.review-star-btn');
        stars.forEach(btn => {
            const r = parseInt(btn.dataset.rating, 10);
            if (r <= val) {
                btn.classList.add('text-amber-400');
                btn.classList.remove('text-slate-300');
            } else {
                btn.classList.remove('text-amber-400');
                btn.classList.add('text-slate-300');
            }
        });
    },

    openLeaveReviewModal() {
        let defaultName = '';
        let defaultPet = '';
        if (typeof CustomerPortal !== 'undefined' && CustomerPortal.currentUser) {
            defaultName = `${CustomerPortal.currentUser.first_name || ''} ${CustomerPortal.currentUser.last_name || ''}`.trim();
        }

        const nameInput = document.getElementById('review-author-name');
        const petInput = document.getElementById('review-pet-name');
        const textInput = document.getElementById('review-feedback-text');

        if (nameInput) nameInput.value = defaultName;
        if (petInput) petInput.value = defaultPet;
        if (textInput) textInput.value = '';

        this.setRating(5);

        const modal = document.getElementById('leave-review-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeLeaveReviewModal() {
        const modal = document.getElementById('leave-review-modal');
        if (modal) modal.classList.add('hidden');
    },

    async submitReview() {
        const name = document.getElementById('review-author-name')?.value.trim();
        const petName = document.getElementById('review-pet-name')?.value.trim();
        const service = document.getElementById('review-service-type')?.value;
        const text = document.getElementById('review-feedback-text')?.value.trim();
        const rating = this.selectedRating || 5;

        if (!name || !text) {
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Please provide your name and review feedback.', 'warning');
            }
            return;
        }

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    pet_name: petName || 'Furry Friend',
                    service_type: service || 'General Visit',
                    review_text: text,
                    rating: rating
                })
            });

            const data = await res.json();
            if (!data.success) {
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast(data.error || 'Failed to submit review.', 'danger');
                }
                return;
            }

            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Thank you! Your review has been published on our Wall of Love. 🐾', 'success');
            }

            this.closeLeaveReviewModal();
            await this.loadReviews();
        } catch (err) {
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`Error submitting review: ${err.message}`, 'danger');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ReviewsModule.init();
});

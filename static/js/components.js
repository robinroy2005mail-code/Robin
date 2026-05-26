/**
 * HEARTAI SYSTEM - REUSABLE UI COMPONENTS
 */

// 1. Toast Notification System
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Define icons for different toast types
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>`;
        } else if (type === 'warning') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12" y1="17" y2="17"/></svg>`;
        } else {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
        }

        toast.innerHTML = `
            ${iconSvg}
            <div style="font-weight: 500; font-size: 14px;">${message}</div>
        `;
        
        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },

    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};

// 2. Fullscreen Loading Spinner
const Loader = {
    overlay: null,

    init() {
        if (!this.overlay) {
            this.overlay = document.getElementById('loading-overlay');
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.id = 'loading-overlay';
                this.overlay.innerHTML = `
                    <div class="spinner"></div>
                    <div style="font-family: 'Outfit', sans-serif; font-weight: 600; color: var(--text-primary);" id="loader-text">Processing...</div>
                `;
                document.body.appendChild(this.overlay);
            }
        }
    },

    show(text = 'Processing...') {
        this.init();
        document.getElementById('loader-text').innerText = text;
        this.overlay.classList.add('active');
    },

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
};

// 3. Skeleton Screens Generator
const Skeletons = {
    renderTable(rows = 5, cols = 4) {
        let headers = '';
        for (let i = 0; i < cols; i++) {
            headers += `<th><span class="skeleton" style="width: ${50 + Math.random() * 50}px; height: 16px;"></span></th>`;
        }
        
        let bodyRows = '';
        for (let r = 0; r < rows; r++) {
            bodyRows += '<tr>';
            for (let c = 0; c < cols; c++) {
                bodyRows += `<td><span class="skeleton" style="width: ${60 + Math.random() * 60}px; height: 14px;"></span></td>`;
            }
            bodyRows += '</tr>';
        }

        return `
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    },

    renderDashboardCards() {
        let cards = '';
        for (let i = 0; i < 4; i++) {
            cards += `
                <div class="glass-card metric-card" style="pointer-events: none;">
                    <div class="skeleton" style="width: 50px; height: 50px; border-radius: 12px;"></div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                        <span class="skeleton" style="width: 80px; height: 28px;"></span>
                        <span class="skeleton" style="width: 100px; height: 12px;"></span>
                    </div>
                </div>
            `;
        }
        return cards;
    }
};

// Expose to window context
window.Toast = Toast;
window.Loader = Loader;
window.Skeletons = Skeletons;

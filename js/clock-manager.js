// Clock functionality module
export class ClockManager {
    constructor() {
        this.timeElement = null;
        this.dateElement = null;
        this.updateInterval = null;
    }

    init() {
        this.timeElement = document.getElementById('current-time');
        this.dateElement = document.getElementById('current-date');
        
        if (this.timeElement && this.dateElement) {
            this.start();
        }
    }

    start() {
        this.updateClock();
        this.updateInterval = setInterval(() => this.updateClock(), 1000);
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateClock() {
        const now = new Date();
        
        // Format time
        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        
        // Format date
        const dateOptions = {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        if (this.timeElement) {
            this.timeElement.textContent = timeString;
        }
        if (this.dateElement) {
            this.dateElement.textContent = dateString;
        }
    }

    destroy() {
        this.stop();
        this.timeElement = null;
        this.dateElement = null;
    }
}
/**
 * GarageTutorialManager.ts
 * 
 * Handles the high-end Spotlight Tutorial system for the Garage.
 * Features fixed backdrop, spotlight targeting, and floating instructional text.
 */

export type GarageStep = 'none' | 'rod_intro' | 'storage_intro' | 'boat_step_1' | 'boat_step_2';

export class GarageTutorialManager {
    private activeStep: GarageStep = 'none';
    private overlay: HTMLDivElement | null = null;
    private textElement: HTMLDivElement | null = null;
    private blocker: HTMLDivElement | null = null;
    private targetElement: HTMLElement | null = null;

    constructor(
        private currentCoins: number,
        private rodCost: number,
        private storageCost: number,
        private nextBoatCost: number,
        private currentVehicleId: string,
        private onStepChange?: (step: GarageStep) => void
    ) {
        this.checkAndStart();
    }

    private hasSeen(key: string): boolean {
        return localStorage.getItem(key) === 'true';
    }

    private markSeen(key: string) {
        localStorage.setItem(key, 'true');
    }

    private checkAndStart() {
        // 1. Rod Upgrade Tutorial (Highest priority)
        if (!this.hasSeen('fj_rodTutorial') && this.currentCoins >= this.rodCost) {
            this.startStep('rod_intro');
            return;
        }

        // 2. Storage Upgrade Tutorial
        if (!this.hasSeen('fj_storageTutorial') && this.currentCoins >= this.storageCost) {
            this.startStep('storage_intro');
            return;
        }

        // 3. New Boat Tutorial (Lowest priority)
        if (!this.hasSeen('fj_boatTutorial') && this.currentCoins >= this.nextBoatCost) {
            if (this.currentVehicleId === 't1') {
                this.startStep('boat_step_1');
                return;
            } else if (this.currentVehicleId === 't2') {
                this.startStep('boat_step_2');
                return;
            }
        }
    }

    private startStep(step: GarageStep) {
        this.activeStep = step;
        this.createUI();
        this.updateUI();
        this.onStepChange?.(step);
    }

    private createUI() {
        if (this.overlay) return;

        // Create Blocker (prevents clicks everywhere else)
        this.blocker = document.createElement('div');
        this.blocker.className = 'tutorial-blocker';
        document.body.appendChild(this.blocker);

        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        document.body.appendChild(this.overlay);

        // Create Floating Text
        this.textElement = document.createElement('div');
        this.textElement.className = 'floating-text';
        this.overlay.appendChild(this.textElement);

        // Trigger animation
        requestAnimationFrame(() => {
            this.overlay?.classList.add('active');
        });
    }

    private updateUI() {
        if (!this.overlay || !this.textElement) return;

        // Clear previous spotlight
        if (this.targetElement) {
            this.targetElement.classList.remove('spotlight-active');
            this.targetElement.removeEventListener('click', this.handleTargetClick);
        }

        let targetId = '';
        let text = '';

        switch (this.activeStep) {
            case 'rod_intro':
                targetId = 'rod-upgrade-btn';
                text = "A stronger rod catches bigger fish!\nTap here to upgrade your Rod.";
                break;
            case 'storage_intro':
                targetId = 'storage-upgrade-btn';
                text = "Running out of space?\nTap here to expand your boat's storage.";
                break;
            case 'boat_step_1':
                targetId = 'next-boat-btn';
                text = "Earned enough for a better vessel!\nTap the arrow to see the next boat.";
                break;
            case 'boat_step_2':
                targetId = 'buy-boat-btn';
                text = "Meet The Painted Skiff!\nTap to purchase and set sail with better stats.";
                break;
        }

        this.targetElement = document.getElementById(targetId);
        if (this.targetElement) {
            this.targetElement.classList.add('spotlight-active');
            this.targetElement.addEventListener('click', this.handleTargetClick);

            // Position text relative to target
            const rect = this.targetElement.getBoundingClientRect();
            const isTop = rect.top > window.innerHeight / 2;
            this.textElement.style.top = isTop ? `${rect.top - 180}px` : `${rect.bottom + 40}px`;
            this.textElement.innerText = text;
        } else {
            // If target not found (e.g. sliding animation), wait and retry
            setTimeout(() => this.updateUI(), 100);
        }
    }

    private handleTargetClick = () => {
        if (this.activeStep === 'boat_step_1') {
            // Transition to step 2 after a delay (wait for slide)
            this.activeStep = 'boat_step_2';
            setTimeout(() => this.updateUI(), 300);
        } else {
            // Finalize tutorial
            if (this.activeStep === 'rod_intro') this.markSeen('fj_rodTutorial');
            if (this.activeStep === 'storage_intro') this.markSeen('fj_storageTutorial');
            if (this.activeStep === 'boat_step_2') this.markSeen('fj_boatTutorial');

            this.cleanup();
        }
    };

    public cleanup() {
        if (this.targetElement) {
            this.targetElement.classList.remove('spotlight-active');
            this.targetElement.removeEventListener('click', this.handleTargetClick);
        }
        this.overlay?.classList.remove('active');
        setTimeout(() => {
            this.overlay?.remove();
            this.blocker?.remove();
            this.overlay = null;
            this.blocker = null;
            this.textElement = null;
            this.targetElement = null;
        }, 400);
        this.onStepChange?.('none');
    }
}

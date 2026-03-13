import { GameState, Entity, OBJECT_MATRIX } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT, SEA_LEVEL_Y } from "./GameEngine";

export class HarpoonManager {
    private state: GameState;
    private onBoosterUsed: (type: 'harpoon') => void;
    private onCatch: (fish: Entity) => void;
    private onActionComplete?: () => void;

    // Harpoon specific stats - Optimized for "Premium" feel
    private readonly HARPOON_SPEED = 45; // Extremely fast firing
    private readonly RETURN_SPEED = 20;  // Quick return
    private readonly MAX_LENGTH = CANVAS_HEIGHT - SEA_LEVEL_Y - 50;
    private readonly STACK_OFFSET = 110;  // Increased for ultra-massive 200px asset
    private readonly AIM_SENSITIVITY = 1.0;

    private harpoonImage: HTMLImageElement;

    constructor(
        state: GameState, 
        onBoosterUsed: (type: 'harpoon') => void, 
        onCatch: (fish: Entity) => void,
        onActionComplete?: () => void
    ) {
        this.state = state;
        this.onBoosterUsed = onBoosterUsed;
        this.onCatch = onCatch;
        this.onActionComplete = onActionComplete;

        this.harpoonImage = new Image();
        this.harpoonImage.src = "/assets/boosters/in_game_harpoon.png?v=" + Date.now();
    }

    /**
     * Main update loop for Harpoon - Handles independent animation logic
     */
    public update(deltaTime: number, pivot: { x: number; y: number }) {
        const hook = this.state.hook;

        // RULE 1: Time-Freeze (Zamanı Dondurma)
        // Ensure time is frozen during aiming, firing, and retracting
        if (hook.state === 'aiming' || hook.state === 'harpoon' || hook.state === 'harpoon_retracting') {
            this.state.isTimeFrozen = true;
        }

        if (hook.state === 'harpoon') {
            this.updateFiring(deltaTime, pivot);
        } else if (hook.state === 'harpoon_retracting') {
            this.updateReturning(deltaTime, pivot);
        }

        // RULE 4: Şiş Kebap Mekaniği (Stacking)
        this.updateCaughtPositions();
    }

    /**
     * RULE 2: Nişan Alma Fazı (Half-Circle Aiming)
     * Limit angle to 0-180 degrees (water-only)
     */
    public handlePointerDown(cx: number, cy: number, pivot: { x: number; y: number }) {
        if (this.state.activeBooster !== 'harpoon') return;
        
        // Reset state for new shot
        this.state.hook.state = 'aiming';
        this.state.hook.length = 0;
        this.state.hook.caughtEntities = [];
        this.state.isTimeFrozen = true;
        
        this.updateAimAngle(cx, cy, pivot);
    }

    public handlePointerMove(cx: number, cy: number, pivot: { x: number; y: number }) {
        if (this.state.hook.state !== 'aiming') return;
        this.updateAimAngle(cx, cy, pivot);
    }

    public handlePointerUp() {
        if (this.state.hook.state !== 'aiming') return;

        this.state.hook.state = 'harpoon';
        this.onBoosterUsed('harpoon');
    }

    /**
     * Clamp angle to bottom half-circle (0 to PI)
     */
    private updateAimAngle(cx: number, cy: number, pivot: { x: number; y: number }) {
        // Linear mapping: Map horizontal touch position to the [0, PI] angle range
        // Ratio of touch position across the full canvas width (clamped 0-1)
        const ratio = Math.max(0, Math.min(1, cx / CANVAS_WIDTH));
        
        // Map ratio to angle: 0 (Left) -> PI (West), 1 (Right) -> 0 (East)
        // This allows intuitive "V-shape" tracking to be replaced by a simple horizontal slide
        const angle = Math.PI * (1 - ratio);
        
        this.state.hook.angle = angle;
    }

    /**
     * RULE 3: Atış Fazı ve Anti-Tunneling (Raycasting)
     */
    private updateFiring(deltaTime: number, pivot: { x: number; y: number }) {
        const hook = this.state.hook;
        const oldX = hook.x;
        const oldY = hook.y;

        // Independent of game timescale (using deltaTime directly)
        const frameSpeed = this.HARPOON_SPEED * (deltaTime / 16);
        hook.length += frameSpeed;
        
        hook.x = pivot.x + Math.cos(hook.angle) * hook.length;
        hook.y = pivot.y + Math.sin(hook.angle) * hook.length;

        // RULE 3: Raycasting Collision Detection (Anti-Tunneling)
        this.checkCollisions(oldX, oldY, hook.x, hook.y);

        // Retract if out of bounds or at range limit
        const pad = 20;
        if (hook.y > CANVAS_HEIGHT - pad || 
            hook.x < pad || 
            hook.x > CANVAS_WIDTH - pad || 
            hook.length > this.MAX_LENGTH) {
            hook.state = 'harpoon_retracting';
            this.onActionComplete?.();
        }
    }

    /**
     * Robust collision check using line-circle intersection (Raycasting)
     */
    private checkCollisions(x1: number, y1: number, x2: number, y2: number) {
        // Iterate through all fishes in the world
        // We go backwards to handle splice safely
        for (let i = this.state.fishes.length - 1; i >= 0; i--) {
            const fish = this.state.fishes[i];
            
            // Skip non-catchable or already caught
            if (this.isAlreadyCaught(fish)) continue;
            
            // Hard obstacles that stop the harpoon (Anchor, Large Rocks)
            const isHardObstacle = fish.type === 'anchor' || fish.type === 'sea_rock_large' || fish.type === 'sunken_boat';
            
            const radius = OBJECT_MATRIX[fish.type].radius;

            // RULE 3 & 4: Piercing logic - Check intersection along the flight path
            if (this.lineToCircleIntersect(x1, y1, x2, y2, fish.x, fish.y, radius)) {
                // Catch it!
                this.catchFish(fish, i);

                if (isHardObstacle) {
                    // Stop harpoon and retract immediately after hitting a hard obstacle
                    this.state.hook.state = 'harpoon_retracting';
                    this.onActionComplete?.();
                    break; 
                }
            }
        }
    }

    private catchFish(fish: Entity, index: number) {
        this.state.hook.caughtEntities.push(fish);
        this.state.fishes.splice(index, 1);
        this.onCatch(fish);
        this.onActionComplete?.();
    }

    private isAlreadyCaught(fish: Entity): boolean {
        return this.state.hook.caughtEntities.some(f => f.id === fish.id);
    }

    /**
     * Harpoon Returning phase
     */
    private updateReturning(deltaTime: number, pivot: { x: number; y: number }) {
        const hook = this.state.hook;
        const frameSpeed = this.RETURN_SPEED * (deltaTime / 16);
        hook.length -= frameSpeed;

        hook.x = pivot.x + Math.cos(hook.angle) * hook.length;
        hook.y = pivot.y + Math.sin(hook.angle) * hook.length;

        if (hook.length <= 0) {
            hook.length = 0;
            this.finalizeCatch();
        }
    }

    /**
     * RULE 4: "Şiş Kebap" Stacking logic
     * Positions caught items along the harpoon shaft
     */
    private updateCaughtPositions() {
        const hook = this.state.hook;
        if (!hook.caughtEntities || hook.caughtEntities.length === 0) return;

        hook.caughtEntities.forEach((fish, i) => {
            // Higher index means further from the tip
            const offset = (i + 1) * this.STACK_OFFSET;
            fish.x = hook.x - Math.cos(hook.angle) * offset;
            fish.y = hook.y - Math.sin(hook.angle) * offset;
        });
    }

    /**
     * PREMIUM Trajectory Visualization
     */
    /**
     * PREMIUM Trajectory Visualization - Massive Radar Dome & Glowing Laser
     */
    public drawTrajectory(ctx: CanvasRenderingContext2D, pivot: { x: number; y: number }) {
        if (this.state.hook.state !== 'aiming') return;
        const hook = this.state.hook;

        // 1. Draw Massive Radar Dome (Sonar Field)
        ctx.save();
        const arcRadius = 210; 
        const centerY = SEA_LEVEL_Y | 0;
        
        // RULE 3: Filled Sonar Arc UI (Low Z-index)
        ctx.beginPath();
        ctx.moveTo(pivot.x | 0, centerY);
        ctx.arc(pivot.x | 0, centerY, arcRadius, 0, Math.PI);
        ctx.fillStyle = 'rgba(10, 20, 60, 0.5)'; // Solid dark blue fill
        ctx.fill();

        // REMOVED: High Intensity Glow (Dashed) - Clean minimalist sonar look
        ctx.restore();

        // 2. Draw Trajectory Laser (Pulsing Energy Beam)
        // User says "yarım daire içinde kalan turuncu kesikli çizgileri sil"
        const laserStartX = pivot.x + Math.cos(hook.angle) * arcRadius;
        const laserStartY = pivot.y + Math.sin(hook.angle) * arcRadius;
        const targetX = pivot.x + Math.cos(hook.angle) * this.MAX_LENGTH;
        const targetY = pivot.y + Math.sin(hook.angle) * this.MAX_LENGTH;

        ctx.save();
        // Laser Core Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF8800';
        
        const beamGradient = ctx.createLinearGradient(laserStartX, laserStartY, targetX, targetY);
        beamGradient.addColorStop(0, 'rgba(255, 230, 0, 1.0)'); // Brilliant Yellow
        beamGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.7)'); // Vibrant Orange
        beamGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');     // Red fade out

        ctx.beginPath();
        ctx.moveTo(laserStartX | 0, laserStartY | 0);
        ctx.lineTo(targetX | 0, targetY | 0);
        ctx.strokeStyle = beamGradient;
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 15]); // Powerful pulses
        ctx.stroke();
        
        // High-intensity white core
        ctx.beginPath();
        ctx.moveTo(laserStartX | 0, laserStartY | 0);
        ctx.lineTo(targetX | 0, targetY | 0);
        ctx.setLineDash([]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();

        // 3. RULE 2: Full Aiming Phase Visibility
        // Draw the ENTIRE Harpoon on the boat's mount during aiming
        this.renderFullHarpoonOnMount(ctx, pivot.x | 0, pivot.y | 0, hook.angle);
    }

    private renderFullHarpoonOnMount(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        if (!this.harpoonImage.complete) return;
        
        ctx.save();
        ctx.translate(x | 0, y | 0);
        ctx.rotate(angle - Math.PI / 2);
        
        const imgW = this.harpoonImage.naturalWidth;
        const imgH = this.harpoonImage.naturalHeight;
        
        const arcRadius = 210;

        // Scale to fit exactly between pivot (0) and arc boundary (arcRadius)
        const scale = arcRadius / imgH; 
        const dw = imgW * scale;
        const dh = arcRadius; 

        // Draw FULL image (Base at pivot [0], Tip at arc boundary [210])
        ctx.drawImage(
            this.harpoonImage,
            0, 0, imgW, imgH,
            (-dw / 2) | 0, 0, dw | 0, dh | 0
        );
        
        ctx.restore();
    }

    /**
     * @deprecated Use renderFullHarpoonOnMount
     */
    private drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        // Obsolete
    }

    /**
     * RULE 2: Split-Render for Physical Harpoon (Firing & Retracting)
     * Renders the actual PNG without distorting the metallic tip.
     */
    public draw(ctx: CanvasRenderingContext2D, pivot: { x: number; y: number }) {
        const hook = this.state.hook;
        const isHarpoonActive = hook.state === 'harpoon' || hook.state === 'harpoon_retracting';
        if (!isHarpoonActive || !this.harpoonImage.complete) return;

        const dx = hook.x - pivot.x;
        const dy = hook.y - pivot.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(pivot.x | 0, pivot.y | 0);
        ctx.rotate(angle - Math.PI / 2); // Rotate so Y+ is the travel direction

        const imgW = this.harpoonImage.naturalWidth;
        const imgH = this.harpoonImage.naturalHeight;
        
        // RULE 1: ULTRA-MASSIVE Active Scale (200px width for heavy feel)
        const scale = 200 / imgW;
        const dw = (imgW * scale) | 0;

        const tipH = 600; // Source pixel height for the headsplit
        const drawnTipH = (tipH * scale) | 0;
        const cableH = imgH - tipH;

        // 1. Draw SHAFT (Stretched portion)
        // This appears as the harpoon "grows" from the boat
        if (distance > drawnTipH) {
            ctx.drawImage(
                this.harpoonImage,
                0, 0, imgW, cableH, // Source: Top part
                -dw / 2, 0, dw, (distance - drawnTipH) | 0 // Destination: Stretched along Y+
            );
        }

        // 2. Draw TIP (Fixed aspect portion)
        // From end of cable to hooked position
        ctx.drawImage(
            this.harpoonImage,
            0, imgH - tipH, imgW, tipH, // Source: Bottom part
            -dw / 2, (distance - drawnTipH) | 0, dw, drawnTipH // Destination: Placed at tip
        );

        ctx.restore();
    }

    private finalizeCatch() {
        this.state.hook.state = 'idle';
        this.state.isTimeFrozen = false;
        // GameEngine handles transferring caughtEntities to inventory
    }

    /**
     * MATHEMATICAL CORE: Line-Circle Intersection for Anti-Tunneling
     */
    private lineToCircleIntersect(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, cr: number): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distSq = dx * dx + dy * dy;

        if (distSq === 0) {
            const d = (cx - x1) ** 2 + (cy - y1) ** 2;
            return d <= cr * cr;
        }

        // Project circle center onto the line segment
        const t = ((cx - x1) * dx + (cy - y1) * dy) / distSq;
        const tClamped = Math.max(0, Math.min(1, t));

        const closestX = x1 + tClamped * dx;
        const closestY = y1 + tClamped * dy;

        const distanceSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;
        return distanceSq <= cr * cr;
    }
}

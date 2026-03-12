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
    private readonly STACK_OFFSET = 24;  // Spacing for shish kebab
    private readonly AIM_SENSITIVITY = 1.0;

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
        const dx = cx - pivot.x;
        const dy = cy - pivot.y;
        
        let angle = Math.atan2(dy, dx);
        
        // Clamp to [0, PI] range (downwards half-circle)
        if (angle < 0) {
            // If dragging above sea level, clamp to edges
            angle = dx > 0 ? 0 : Math.PI;
        }
        
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
        const arcRadius = 210; // Adjusted to fit within 450px canvas width
        const centerY = SEA_LEVEL_Y; // Align strictly to water surface
        
        // High Intensity Glow for the outer perimeter
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#FF5500';
        
        // PREMIUM: Radial gradient for depth and "illuminated" look
        const arcGradient = ctx.createRadialGradient(pivot.x, centerY, 0, pivot.x, centerY, arcRadius);
        arcGradient.addColorStop(0, 'rgba(255, 100, 0, 0.25)'); // Opak start at origin
        arcGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.1)'); // Mid-glow
        arcGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');     // Transparent edge
        
        ctx.beginPath();
        ctx.moveTo(pivot.x, centerY);
        ctx.arc(pivot.x, centerY, arcRadius, 0, Math.PI);
        ctx.fillStyle = arcGradient;
        ctx.fill();

        // Neon Dash Border
        ctx.beginPath();
        ctx.arc(pivot.x, centerY, arcRadius, 0, Math.PI);
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.9)'; // Bright Amber/Neon
        ctx.lineWidth = 5;
        ctx.setLineDash([20, 10]); // Sophisticated radar look
        ctx.stroke();
        ctx.restore();

        // 2. Draw Trajectory Laser (Pulsing Energy Beam)
        const targetX = pivot.x + Math.cos(hook.angle) * this.MAX_LENGTH;
        const targetY = pivot.y + Math.sin(hook.angle) * this.MAX_LENGTH;

        ctx.save();
        // Laser Core Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF8800';
        
        const beamGradient = ctx.createLinearGradient(pivot.x, pivot.y, targetX, targetY);
        beamGradient.addColorStop(0, 'rgba(255, 230, 0, 1.0)'); // Brilliant Yellow
        beamGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.7)'); // Vibrant Orange
        beamGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');     // Red fade out

        ctx.beginPath();
        ctx.moveTo(pivot.x, pivot.y);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = beamGradient;
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 15]); // Powerful pulses
        ctx.stroke();
        
        // High-intensity white core
        ctx.setLineDash([]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();

        // 3. Draw Heavy Iron Tip Preview
        this.drawArrowHead(ctx, targetX, targetY, hook.angle);
    }

    private drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Deep shadow for massive metallic tip
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowOffsetY = 4;

        // Premium Metallic Forge Gradient
        const gradient = ctx.createLinearGradient(-25, -12, 0, 12);
        gradient.addColorStop(0, '#2b2b2b'); // Dark Forged Iron
        gradient.addColorStop(0.3, '#5c5c5c'); // Brushed Steel
        gradient.addColorStop(0.5, '#7d7d7d'); // Highlight
        gradient.addColorStop(1, '#1a1a1a'); // Sharp edge shadow

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-26, -15);
        ctx.lineTo(-20, 0); // Aggressive Barb
        ctx.lineTo(-26, 15);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Edge Sharpness Highlight (Neon Glint)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-26, -15);
        ctx.strokeStyle = 'rgba(255, 150, 0, 0.5)'; // Orange reflection
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
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

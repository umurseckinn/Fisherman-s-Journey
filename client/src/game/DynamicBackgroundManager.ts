import { CANVAS_WIDTH, CANVAS_HEIGHT, SEA_LEVEL_Y } from "./GameEngine";

interface BackgroundTheme {
    skyTop: string;
    skyBottom: string;
    seaTop: string;
    seaBottom: string;
    rayColor: string;
    bubbleColor: string;
    causticOpacity: number;
    showGodRays: boolean;
    particleType: 'bubble' | 'dust' | 'tempest';
}

const THEMES: BackgroundTheme[] = [
    { // 1. Dawnbreak Cove: Sığ sular. Üstte açık turkuaz ve güneş sarısı, altta canlı deniz mavisi.
        skyTop: "#4DD0E1", skyBottom: "#FFF176",
        seaTop: "#0288D1", seaBottom: "#01579B",
        rayColor: "rgba(255, 255, 200, 0.15)",
        bubbleColor: "rgba(255, 255, 255, 0.4)",
        causticOpacity: 0.15,
        showGodRays: true,
        particleType: 'bubble'
    },
    { // 2. The Whispering Atolls: Üstte koyu çivit mavisi (indigo), altta fosforlu mor ve pembe tonları.
        skyTop: "#303F9F", skyBottom: "#D81B60",
        seaTop: "#8E24AA", seaBottom: "#4A148C",
        rayColor: "rgba(255, 100, 255, 0.2)",
        bubbleColor: "rgba(255, 200, 255, 0.6)",
        causticOpacity: 0.25,
        showGodRays: true,
        particleType: 'dust'
    },
    { // 3. The Abyssal Blue: Üstte mürekkep laciverdi, altta zifiri siyah ve koyu gri.
        skyTop: "#0D1B2A", skyBottom: "#1B263B",
        seaTop: "#0A0A0A", seaBottom: "#000000",
        rayColor: "rgba(255, 255, 255, 0)",
        bubbleColor: "rgba(100, 100, 150, 0.2)",
        causticOpacity: 0.05,
        showGodRays: false,
        particleType: 'bubble'
    },
    { // 4. Tempest Strait: Üstte bulanık koyu yeşil/gri, altta fırtınalı gece mavisi.
        skyTop: "#37474F", skyBottom: "#263238",
        seaTop: "#1A237E", seaBottom: "#000051",
        rayColor: "rgba(200, 200, 255, 0.1)",
        bubbleColor: "rgba(180, 180, 220, 0.3)",
        causticOpacity: 0.1,
        showGodRays: false,
        particleType: 'tempest'
    },
    { // 5. The Infinite Maelstrom: Üstte mistik cyan/teal, altta girdap hissiyatı veren koyu mor tonları.
        skyTop: "#006064", skyBottom: "#004D40",
        seaTop: "#311B92", seaBottom: "#1A237E",
        rayColor: "rgba(0, 255, 255, 0.15)",
        bubbleColor: "rgba(0, 255, 255, 0.5)",
        causticOpacity: 0.3,
        showGodRays: true,
        particleType: 'dust'
    },
    { // 6. The Paragon's Run: Üstte görkemli kraliyet mavisi, altta zafer hissi veren parlayan altın sarısı tonları.
        skyTop: "#1A237E", skyBottom: "#283593",
        seaTop: "#FFD600", seaBottom: "#FF6F00",
        rayColor: "rgba(255, 215, 0, 0.3)",
        bubbleColor: "rgba(255, 255, 200, 0.8)",
        causticOpacity: 0.4,
        showGodRays: true,
        particleType: 'bubble'
    }
];

export class DynamicBackgroundManager {
    private level: number = 1;
    private transitionTime: number = 0;
    private particles: any[] = [];
    private rays: any[] = [];
    private flashOpacity: number = 0;

    constructor(initialLevel?: number) {
        if (initialLevel !== undefined) {
            this.level = Math.max(1, Math.min(100, initialLevel));
        }
        this.initParticles();
    }

    private initParticles() {
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: 2 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: 0.5 + Math.random() * 1.5,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.2 + Math.random() * 0.5
            });
        }

        for (let i = 0; i < 5; i++) {
            this.rays.push({
                x: (CANVAS_WIDTH / 5) * i + Math.random() * 30,
                width: 60 + Math.random() * 100,
                angle: (Math.random() - 0.5) * 0.3,
                opacity: 0.05 + Math.random() * 0.1,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }

    public update(level: number, deltaTime: number) {
        this.level = Math.max(1, Math.min(100, level));
        const dtSeconds = deltaTime * 0.001;
        this.transitionTime += dtSeconds;

        const currentTheme = this.getInterpolatedTheme();

        this.particles.forEach(p => {
            if (currentTheme.particleType === 'tempest') {
                p.y += p.speedY * 5;
                p.x -= 2;
            } else if (currentTheme.particleType === 'dust') {
                p.y -= p.speedY * 0.3;
                p.x += Math.sin(this.transitionTime + p.phase) * 1.5;
            } else {
                p.y -= p.speedY;
                p.x += Math.sin(this.transitionTime + p.phase) * 0.5;
            }

            if (p.y < (currentTheme.particleType === 'tempest' ? 0 : SEA_LEVEL_Y)) {
                p.y = CANVAS_HEIGHT + 20;
                p.x = Math.random() * CANVAS_WIDTH;
            }
            if (p.y > CANVAS_HEIGHT + 50) {
                p.y = -20;
                p.x = Math.random() * CANVAS_WIDTH;
            }
            if (p.x < -50) p.x = CANVAS_WIDTH + 50;
        });

        const progress = (this.level - 1) / 100;
        if (progress >= 0.49 && progress <= 0.65 && Math.random() < 0.003) {
            this.flashOpacity = 0.5;
        }
        if (this.flashOpacity > 0) {
            this.flashOpacity -= deltaTime * 0.002;
        }
    }

    private getInterpolatedTheme(): BackgroundTheme {
        const progress = (this.level - 1) / 100;
        const totalThemes = THEMES.length;
        const scaledProgress = progress * (totalThemes - 1);
        const index1 = Math.floor(scaledProgress);
        const index2 = Math.min(index1 + 1, totalThemes - 1);
        const t = scaledProgress - index1;

        const theme1 = THEMES[index1];
        const theme2 = THEMES[index2];

        return {
            skyTop: this.interpolateColor(theme1.skyTop, theme2.skyTop, t),
            skyBottom: this.interpolateColor(theme1.skyBottom, theme2.skyBottom, t),
            seaTop: this.interpolateColor(theme1.seaTop, theme2.seaTop, t),
            seaBottom: this.interpolateColor(theme1.seaBottom, theme2.seaBottom, t),
            rayColor: this.interpolateColor(theme1.rayColor, theme2.rayColor, t),
            bubbleColor: this.interpolateColor(theme1.bubbleColor, theme2.bubbleColor, t),
            causticOpacity: theme1.causticOpacity + (theme2.causticOpacity - theme1.causticOpacity) * t,
            showGodRays: t < 0.5 ? theme1.showGodRays : theme2.showGodRays,
            particleType: t < 0.5 ? theme1.particleType : theme2.particleType
        };
    }

    private interpolateColor(color1: string, color2: string, t: number): string {
        const c1 = this.parseColor(color1);
        const c2 = this.parseColor(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        const a = c1.a + (c2.a - c1.a) * t;

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    private parseColor(color: string): { r: number, g: number, b: number, a: number } {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            let r, g, b;
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
            return { r, g, b, a: 1 };
        } else if (color.startsWith('rgba')) {
            const parts = color.match(/[\d.]+/g);
            if (parts) {
                return { r: +parts[0], g: +parts[1], b: +parts[2], a: +parts[3] !== undefined ? +parts[3] : 1 };
            }
        }
        return { r: 255, g: 254, b: 250, a: 1 };
    }

    public draw(ctx: CanvasRenderingContext2D) {
        const theme = this.getInterpolatedTheme();

        this.drawGradients(ctx, theme);
        if (theme.showGodRays) this.drawGodRays(ctx, theme);
        this.drawCaustics(ctx, theme);
        this.drawParticles(ctx, theme);

        if (this.flashOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashOpacity})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        this.drawFloor(ctx);
    }

    private drawGradients(ctx: CanvasRenderingContext2D, theme: BackgroundTheme) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, SEA_LEVEL_Y);
        skyGrad.addColorStop(0, theme.skyTop);
        skyGrad.addColorStop(1, theme.skyBottom);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, SEA_LEVEL_Y);

        const seaGrad = ctx.createLinearGradient(0, SEA_LEVEL_Y, 0, CANVAS_HEIGHT);
        seaGrad.addColorStop(0, theme.seaTop);
        seaGrad.addColorStop(1, theme.seaBottom);
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, SEA_LEVEL_Y, CANVAS_WIDTH, CANVAS_HEIGHT - SEA_LEVEL_Y);
    }

    private drawGodRays(ctx: CanvasRenderingContext2D, theme: BackgroundTheme) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        this.rays.forEach(r => {
            const drift = Math.sin(this.transitionTime * r.speed) * 40;
            const grad = ctx.createLinearGradient(r.x + drift, SEA_LEVEL_Y, r.x + drift + Math.tan(r.angle) * 600, CANVAS_HEIGHT);
            grad.addColorStop(0, theme.rayColor);
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(r.x + drift, SEA_LEVEL_Y);
            ctx.lineTo(r.x + drift + r.width, SEA_LEVEL_Y);
            ctx.lineTo(r.x + drift + r.width + Math.tan(r.angle) * 800, CANVAS_HEIGHT);
            ctx.lineTo(r.x + drift + Math.tan(r.angle) * 800, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    private drawCaustics(ctx: CanvasRenderingContext2D, theme: BackgroundTheme) {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.strokeStyle = theme.rayColor;
        ctx.lineWidth = 15;
        ctx.globalAlpha = theme.causticOpacity;

        const time = this.transitionTime * 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const yOffset = SEA_LEVEL_Y + 150 + i * 180;
            for (let x = -50; x < CANVAS_WIDTH + 50; x += 40) {
                const y = yOffset + Math.sin(x * 0.005 + time + i) * 60 + Math.cos(x * 0.01 - time * 0.5) * 20;
                if (x === -50) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawParticles(ctx: CanvasRenderingContext2D, theme: BackgroundTheme) {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = theme.bubbleColor;

            if (theme.particleType === 'dust') {
                ctx.fillRect(p.x, p.y, p.size * 0.5, p.size * 0.5);
            } else if (theme.particleType === 'tempest') {
                ctx.strokeStyle = theme.bubbleColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 5, p.y + 15);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    private drawFloor(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 20);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
        ctx.strokeStyle = 'rgba(255, 240, 180, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = 'rgba(26, 15, 10, 0.8)';
        ctx.fillRect(0, CANVAS_HEIGHT - 18, CANVAS_WIDTH, 18);
    }
}

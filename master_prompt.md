# FISHERMAN'S JOURNEY — MASTER IMPLEMENTATION PROMPT
## Complete System Spec for Antigravity / Vibe Code IDE

---

## PART 1: ROD TIP COORDINATES PER PNG

Asset path: `/Users/umurseckin/Desktop/Fisherman-main/client/public/assets/fisherman_and_boat/`

The fishing line must originate from the exact rod tip pixel in each PNG.
These are pixel coordinates (x, y) from the TOP-LEFT of each image at its native resolution.
Scale proportionally if you resize the sprite for the game canvas.

```
FILE                        NATIVE SIZE     ROD TIP (x, y)   NOTES
────────────────────────────────────────────────────────────────────────────
the_dinghy.png              981 × 680       ( 571,   2)       olta sağ üste
the_painted_skiff.png       855 × 710       ( 543,   2)       olta sağ üste
the_fiberglass.png         1047 × 726       ( 218,   2)       olta sol üste
the_motor_cruiser.png      1086 × 810       (  20,   2)       olta sol üste
the_speedster.png          1338 × 718       ( 504,   2)       olta sağ üste
the_trawler.png            1083 × 810       (  22,   2)       olta sol üste
the_captains_vessel.png    1128 × 846       ( 308,   2)       olta sol üste
the_research_vessel.png    1248 × 740       ( 722,   2)       olta sol üste
the_corsair.png            1536 × 1024      (1418,  27)       olta sağ üste
the_legend.png             1536 × 1024      (1402,  33)       olta sağ üste
────────────────────────────────────────────────────────────────────────────
```

**How to use these coordinates in code:**

```typescript
// Scale factor: game renders sprites at a fixed display width
// Example: if you render the_dinghy.png at displayWidth=320px
// scaleX = 320 / 981 = 0.326
// rodTipX_onCanvas = boatX + (571 * scaleX)
// rodTipY_onCanvas = boatY + (3  * scaleY)

interface VehicleSprite {
  file: string;
  nativeWidth: number;
  nativeHeight: number;
  rodTipX: number;   // pixel from left in native res
  rodTipY: number;   // pixel from top  in native res
}

const VEHICLE_SPRITES: VehicleSprite[] = [
  { file: "the_dinghy.png",           nativeWidth: 981,  nativeHeight: 680,  rodTipX: 571,  rodTipY: 2  },
  { file: "the_painted_skiff.png",    nativeWidth: 855,  nativeHeight: 710,  rodTipX: 543,  rodTipY: 2  },
  { file: "the_fiberglass.png",       nativeWidth: 1047, nativeHeight: 726,  rodTipX: 218,  rodTipY: 2  },
  { file: "the_motor_cruiser.png",    nativeWidth: 1086, nativeHeight: 810,  rodTipX: 20,   rodTipY: 2  },
  { file: "the_speedster.png",        nativeWidth: 1338, nativeHeight: 718,  rodTipX: 504,  rodTipY: 2  },
  { file: "the_trawler.png",          nativeWidth: 1083, nativeHeight: 810,  rodTipX: 22,   rodTipY: 2  },
  { file: "the_captains_vessel.png",  nativeWidth: 1128, nativeHeight: 846,  rodTipX: 308,  rodTipY: 2  },
  { file: "the_research_vessel.png",  nativeWidth: 1248, nativeHeight: 740,  rodTipX: 722,  rodTipY: 2  },
  { file: "the_corsair.png",          nativeWidth: 1536, nativeHeight: 1024, rodTipX: 1418, rodTipY: 27 },
  { file: "the_legend.png",           nativeWidth: 1536, nativeHeight: 1024, rodTipX: 1402, rodTipY: 33 },
];

// In render loop:
function getRodTipOnCanvas(vehicle: VehicleSprite, boatDrawX: number, boatDrawY: number, displayWidth: number) {
  const scale = displayWidth / vehicle.nativeWidth;
  return {
    x: boatDrawX + vehicle.rodTipX * scale,
    y: boatDrawY + vehicle.rodTipY * scale,
  };
}
```

---

## PART 2: VEHICLE STATS — BASE + UPGRADE TREES

### 2.1 What each stat means

| Stat | Description |
|------|-------------|
| `swingSpeed` | Pendulum oscillation in rad/frame. Higher = faster left-right sweep |
| `castSpeed` | Multiplier on hook drop velocity. 1.0x = baseline normal speed |
| `returnSpeed` | Multiplier on hook retrieval. 1.0x = baseline |
| `hookDepth` | Max depth hook can reach, as % of total water column height |
| `castAttempts` | Total casts before "rod broken" game over (repaired at market) |
| `coralProtection` | % chance coral hit does NOT cost a cast attempt |
| `kelpDuration` | Seconds hook is stuck on kelp |
| `storage` | Total kg capacity (baseCapacity + sum of owned STO upgrades) |

---

### 2.2 Full Vehicle + Upgrade Table

> **Rule:** Each vehicle has its OWN 5-level STO and 5-level ROD upgrade tree.
> Upgrades do NOT transfer between vehicles.
> When you switch to a new vehicle, its upgrade tree starts at Level 0 (none owned).

---

#### T1 — The Dinghy
*Captain: Bobber Bill*

**Base stats (no upgrades):**
```
storage        : 22 kg
swingSpeed     : 0.007 rad/frame
castSpeed      : 0.40x
returnSpeed    : 0.35x
hookDepth      : 50%
castAttempts   : 1
coralProtection: 0%
kelpDuration   : 1.8s
```

**Storage upgrades:**
```
STO-1  +8 kg   →  400 pCoins   (no level req)
STO-2  +13 kg  →  900 pCoins   (req: L6 cleared)
STO-3  +18 kg  → 1800 pCoins   (req: L16 cleared)
STO-4  +24 kg  → 3200 pCoins   (req: L31 cleared)
STO-5  +32 kg  → 5500 pCoins   (req: L51 cleared)
MAX storage fully upgraded: 22+8+13+18+24+32 = 117 kg
```

**Rod upgrades** (each level adds cumulatively to base):
```
ROD-1  swing+0.002  cast+0.12x  return+0.10x  depth+5%   attempts+0  coral+10%  kelp-0.15s  →  500 pCoins
ROD-2  swing+0.003  cast+0.18x  return+0.16x  depth+7%   attempts+1  coral+15%  kelp-0.20s  → 1100 pCoins (req L11)
ROD-3  swing+0.004  cast+0.24x  return+0.22x  depth+9%   attempts+1  coral+20%  kelp-0.25s  → 2200 pCoins (req L21)
ROD-4  swing+0.005  cast+0.30x  return+0.28x  depth+10%  attempts+1  coral+25%  kelp-0.30s  → 4000 pCoins (req L41)
ROD-5  swing+0.006  cast+0.36x  return+0.34x  depth+11%  attempts+1  coral+30%  kelp-0.35s  → 7000 pCoins (req L61)
MAX rod fully upgraded: swing=0.025  cast=1.60x  return=1.19x  depth=92%  attempts=5  coral=100%  kelp=0.45s
```
**Unlock:** Free | **Min Level:** L1

---

#### T2 — The Painted Skiff
*Captain: Daring Danny*

**Base stats:**
```
storage        : 32 kg
swingSpeed     : 0.009 rad/frame
castSpeed      : 0.50x
returnSpeed    : 0.45x
hookDepth      : 56%
castAttempts   : 1
coralProtection: 0%
kelpDuration   : 1.6s
special        : kelpDuration baseline -0.2s
```

**Storage upgrades:**
```
STO-1  +10 kg  →   600 pCoins
STO-2  +16 kg  →  1400 pCoins  (req L6)
STO-3  +22 kg  →  2800 pCoins  (req L16)
STO-4  +28 kg  →  5000 pCoins  (req L31)
STO-5  +36 kg  →  8500 pCoins  (req L51)
MAX: 32+10+16+22+28+36 = 144 kg
```

**Rod upgrades:** (same bonuses as T1 per level, different costs)
```
ROD-1  →   750 pCoins
ROD-2  →  1700 pCoins  (req L11)
ROD-3  →  3300 pCoins  (req L21)
ROD-4  →  6000 pCoins  (req L41)
ROD-5  → 10500 pCoins  (req L61)
```
**Unlock:** 600 pCoins | **Min Level:** L1

---

#### T3 — The Fiberglass
*Captain: Expert Eddie*

**Base stats:**
```
storage        : 45 kg
swingSpeed     : 0.011 rad/frame
castSpeed      : 0.62x
returnSpeed    : 0.55x
hookDepth      : 63%
castAttempts   : 2
coralProtection: 15%
kelpDuration   : 1.4s
```

**Storage upgrades:**
```
STO-1  +13 kg  →   900 pCoins
STO-2  +20 kg  →  2000 pCoins  (req L6)
STO-3  +27 kg  →  4000 pCoins  (req L16)
STO-4  +34 kg  →  7200 pCoins  (req L31)
STO-5  +43 kg  → 12500 pCoins  (req L51)
MAX: 45+13+20+27+34+43 = 182 kg
```

**Rod upgrades:**
```
ROD-1  →  1100 pCoins
ROD-2  →  2500 pCoins  (req L11)
ROD-3  →  4800 pCoins  (req L21)
ROD-4  →  8800 pCoins  (req L41)
ROD-5  → 15500 pCoins  (req L61)
```
**Unlock:** 2,200 pCoins | **Min Level:** L6

---

#### T4 — The Motor Cruiser
*Captain: Captain Ken*

**Base stats:**
```
storage        : 62 kg
swingSpeed     : 0.014 rad/frame
castSpeed      : 0.76x
returnSpeed    : 0.68x
hookDepth      : 70%
castAttempts   : 2
coralProtection: 20%
kelpDuration   : 1.2s
special        : returnSpeed +20% bonus on top of base
```

**Storage upgrades:**
```
STO-1  +16 kg  →  1400 pCoins
STO-2  +24 kg  →  3000 pCoins  (req L6)
STO-3  +32 kg  →  5800 pCoins  (req L16)
STO-4  +42 kg  → 10500 pCoins  (req L31)
STO-5  +54 kg  → 18000 pCoins  (req L51)
MAX: 62+16+24+32+42+54 = 230 kg
```

**Rod upgrades:**
```
ROD-1  →  1700 pCoins
ROD-2  →  3700 pCoins  (req L11)
ROD-3  →  7000 pCoins  (req L21)
ROD-4  → 13000 pCoins  (req L41)
ROD-5  → 22000 pCoins  (req L61)
```
**Unlock:** 5,500 pCoins | **Min Level:** L11

---

#### T5 — The Speedster
*Captain: Turbo Trev*

**Base stats:**
```
storage        : 78 kg
swingSpeed     : 0.017 rad/frame
castSpeed      : 0.90x
returnSpeed    : 0.82x
hookDepth      : 76%
castAttempts   : 3
coralProtection: 25%
kelpDuration   : 1.0s
special        : swingSpeed +10% bonus
```

**Storage upgrades:**
```
STO-1  +18 kg  →  2000 pCoins
STO-2  +28 kg  →  4200 pCoins  (req L6)
STO-3  +38 kg  →  8000 pCoins  (req L16)
STO-4  +50 kg  → 14500 pCoins  (req L31)
STO-5  +64 kg  → 25000 pCoins  (req L51)
MAX: 78+18+28+38+50+64 = 276 kg
```

**Rod upgrades:**
```
ROD-1  →  2400 pCoins
ROD-2  →  5200 pCoins  (req L11)
ROD-3  → 10000 pCoins  (req L21)
ROD-4  → 18500 pCoins  (req L41)
ROD-5  → 31000 pCoins  (req L61)
```
**Unlock:** 10,000 pCoins | **Min Level:** L16

---

#### T6 — The Trawler
*Captain: Seafarer Sam*

**Base stats:**
```
storage        : 96 kg
swingSpeed     : 0.019 rad/frame
castSpeed      : 1.02x
returnSpeed    : 0.94x
hookDepth      : 82%
castAttempts   : 3
coralProtection: 35%
kelpDuration   : 0.85s
special        : skeleton cash penalty -25% (−10 coins → −7.5 coins)
```

**Storage upgrades:**
```
STO-1  +22 kg  →  2800 pCoins
STO-2  +34 kg  →  5800 pCoins  (req L6)
STO-3  +46 kg  → 11000 pCoins  (req L16)
STO-4  +60 kg  → 19500 pCoins  (req L31)
STO-5  +78 kg  → 33000 pCoins  (req L51)
MAX: 96+22+34+46+60+78 = 336 kg
```

**Rod upgrades:**
```
ROD-1  →  3300 pCoins
ROD-2  →  7000 pCoins  (req L11)
ROD-3  → 13500 pCoins  (req L21)
ROD-4  → 25000 pCoins  (req L41)
ROD-5  → 42000 pCoins  (req L61)
```
**Unlock:** 18,000 pCoins | **Min Level:** L21

---

#### T7 — The Captain's Vessel
*Captain: Captain Theo*

**Base stats:**
```
storage        : 118 kg
swingSpeed     : 0.021 rad/frame
castSpeed      : 1.16x
returnSpeed    : 1.08x
hookDepth      : 87%
castAttempts   : 4
coralProtection: 45%
kelpDuration   : 0.70s
special        : King Fish visual weight display shows -5 kg (UI only, real weight unchanged)
```

**Storage upgrades:**
```
STO-1  +26 kg  →  3800 pCoins
STO-2  +40 kg  →  7800 pCoins  (req L6)
STO-3  +54 kg  → 14500 pCoins  (req L16)
STO-4  +70 kg  → 26000 pCoins  (req L31)
STO-5  +92 kg  → 44000 pCoins  (req L51)
MAX: 118+26+40+54+70+92 = 400 kg
```

**Rod upgrades:**
```
ROD-1  →  4400 pCoins
ROD-2  →  9200 pCoins  (req L11)
ROD-3  → 18000 pCoins  (req L21)
ROD-4  → 33000 pCoins  (req L41)
ROD-5  → 56000 pCoins  (req L61)
```
**Unlock:** 28,000 pCoins | **Min Level:** L31

---

#### T8 — The Research Vessel
*Captain: Professor Pippa*

**Base stats:**
```
storage        : 144 kg
swingSpeed     : 0.023 rad/frame
castSpeed      : 1.30x
returnSpeed    : 1.22x
hookDepth      : 91%
castAttempts   : 4
coralProtection: 55%
kelpDuration   : 0.55s
special        : Radar booster duration ×2
```

**Storage upgrades:**
```
STO-1  +30 kg  →  5000 pCoins
STO-2  +48 kg  → 10000 pCoins  (req L6)
STO-3  +64 kg  → 19000 pCoins  (req L16)
STO-4  +84 kg  → 34000 pCoins  (req L31)
STO-5  +110 kg →  57000 pCoins  (req L51)
MAX: 144+30+48+64+84+110 = 480 kg
```

**Rod upgrades:**
```
ROD-1  →  5800 pCoins
ROD-2  → 12000 pCoins  (req L11)
ROD-3  → 23000 pCoins  (req L21)
ROD-4  → 43000 pCoins  (req L41)
ROD-5  → 72000 pCoins  (req L61)
```
**Unlock:** 42,000 pCoins | **Min Level:** L41

---

#### T9 — The Corsair
*Captain: Black Cam*

**Base stats:**
```
storage        : 168 kg
swingSpeed     : 0.025 rad/frame
castSpeed      : 1.44x
returnSpeed    : 1.36x
hookDepth      : 94%
castAttempts   : 5
coralProtection: 65%
kelpDuration   : 0.40s
special        : Sunken Boat curse scenario (5%) always gives positive outcome instead
```

**Storage upgrades:**
```
STO-1  +34 kg  →  6500 pCoins
STO-2  +54 kg  → 13000 pCoins  (req L6)
STO-3  +72 kg  → 24000 pCoins  (req L16)
STO-4  +94 kg  → 43000 pCoins  (req L31)
STO-5  +122 kg → 72000 pCoins  (req L51)
MAX: 168+34+54+72+94+122 = 544 kg
```

**Rod upgrades:**
```
ROD-1  →  7500 pCoins
ROD-2  → 15500 pCoins  (req L11)
ROD-3  → 30000 pCoins  (req L21)
ROD-4  → 56000 pCoins  (req L41)
ROD-5  → 93000 pCoins  (req L61)
```
**Unlock:** 65,000 pCoins | **Min Level:** L61

---

#### T10 — The Legend
*Captain: The Legendary Fisher*

**Base stats:**
```
storage        : 200 kg
swingSpeed     : 0.028 rad/frame
castSpeed      : 1.60x
returnSpeed    : 1.52x
hookDepth      : 97%
castAttempts   : 5
coralProtection: 75%
kelpDuration   : 0.25s
special        : Golden Levels fish value multiplier ×2.5 instead of ×1.5
```

**Storage upgrades:**
```
STO-1  +38 kg  →   8500 pCoins
STO-2  +60 kg  →  17000 pCoins  (req L6)
STO-3  +80 kg  →  31000 pCoins  (req L16)
STO-4  +104 kg →  55000 pCoins  (req L31)
STO-5  +136 kg →  92000 pCoins  (req L51)
MAX: 200+38+60+80+104+136 = 618 kg
```

**Rod upgrades:**
```
ROD-1  →   9800 pCoins
ROD-2  →  20000 pCoins  (req L11)
ROD-3  →  39000 pCoins  (req L21)
ROD-4  →  72000 pCoins  (req L41)
ROD-5  → 120000 pCoins  (req L61)
```
**Unlock:** 105,000 pCoins | **Min Level:** L81

---

## PART 3: ECONOMY & SCORING SYSTEM

### 3.1 Two Currency Pools

```
sessionCoins    Earned in run. Spent on fuel, boosters, rod repair.
                LOST on death or on "Exit to Garage".
                NOT saved to localStorage.

permanentCoins  30% of every sessionCoin earned auto-transfers here.
                NEVER lost. Survives death, app close, everything.
                Saved to localStorage on every change.
                Spent ONLY in Garage on vehicle/upgrade purchases.
```

**Transfer timing:** The 30% transfer happens at the moment coins are earned
(fish catch, shell, doubloon, etc.) — not at market. So permanentCoins
accumulate even mid-run.

---

### 3.2 Scoring System

The game currently has no score. Implement the following:

**Run Score** is calculated at game over or level exit:

```
Base score    = total sessionCoins earned during run (before spending)
Depth bonus   = (highest level reached) × 50
Fish bonus    = Σ (each fish caught value) — already in sessionCoins, included
King bonus    = +500 per King Fish caught
Efficiency    = (coins earned / levels played) — displayed as stat, not added to score
Final score   = Base score + Depth bonus + King bonus
```

**Score is displayed on game over screen.**
Store `personalBest` score in localStorage. Show "NEW RECORD!" if beaten.

**Leaderboard ready:** Structure the score as a single integer so it can be
submitted to a future leaderboard API without changes.

**No in-run score display** — score is only revealed at game over.
During play: show sessionCoins, permanentCoins, weight bar, timer, cast attempts.

---

### 3.3 Real Money Pricing (IAP — USD)

Vehicles and upgrades are bought with permanentCoins (earned in-game).
The following IAP packages let players buy permanentCoins directly:

```
COIN PACK          pCOINS    USD PRICE    VALUE NOTE
────────────────────────────────────────────────────
Starter Pouch       1,000      $0.99      Good for T2 unlock
Sailor's Chest      3,000      $2.99      Good for T3 upgrade start
Captain's Safe     10,000      $7.99      T4 unlock range
Admiral's Vault    30,000     $19.99      T6 unlock range
Legend's Treasury  80,000     $49.99      T9 unlock range
Ultimate Bundle   200,000     $99.99      All vehicles + full upgrades
────────────────────────────────────────────────────
```

**Also available as IAP (not permanentCoins):**

```
ITEM                              USD     DESCRIPTION
──────────────────────────────────────────────────────
Harpoon (single use)             $0.99   IAP booster
Net (single use)                 $0.99   IAP booster
TNT (single use)                 $1.99   IAP booster
Anchor Drop (single use)         $0.99   IAP booster
Continue Pack (1 use)            $1.99   Resume after game over
Remove Ads                       $3.99   Permanent
Starter Bundle (all 4 boosters)  $2.99   One-time offer on first death
```

**Coin earn rate reference (average, no upgrades):**
```
L1–5    ~8–15 pCoins/level   (22 kg cap, few fish)
L6–10   ~15–28 pCoins/level
L11–20  ~28–55 pCoins/level
L21–30  ~55–90 pCoins/level
L31–40  ~90–140 pCoins/level
L41–60  ~140–220 pCoins/level
L61–80  ~220–350 pCoins/level
L81–100 ~350–500 pCoins/level
```

---

## PART 4: GARAGE SCREEN — Premium UI Spec

### 4.1 Navigation Flow

```
HOME SCREEN
    ↓
[PLAY THE GAME] button pressed
    ↓
GARAGE SCREEN opens (mandatory, no skip)
    ↓
Player selects vehicle + reviews upgrades
    ↓
[START FISHING →] button pressed
    ↓
GAME BEGINS
```

No back button in Garage. No way to reach game without going through Garage.
After game over → home screen → Play → Garage → Start again.

---

### 4.2 Garage UI Layout

```
┌─────────────────────────────────────────────────────┐
│  🪙 permanentCoins: 12,450          [i] HOW TO EARN │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [←]    THE CAPTAIN'S VESSEL  (T7)    [→]         │
│          Captain: Captain Theo                      │
│                                                     │
│   ┌───────────────────────────────────┐             │
│   │     [VEHICLE SPRITE ANIMATED]     │             │
│   │     boat bobs gently on water     │             │
│   │     captain waves/idle animation  │             │
│   └───────────────────────────────────┘             │
│                                                     │
│   CURRENT EFFECTIVE STATS:                          │
│   Storage   ████████░░  118 kg                      │
│   Swing     ██████░░░░  0.021 r/f                   │
│   Depth     ███████░░░  87%                         │
│   Attempts  ████░░░░░░  4 casts                     │
│                                                     │
├──────────────┬──────────────────────────────────────┤
│   [STORAGE]  │  [ROD]                               │
├──────────────┴──────────────────────────────────────┤
│                                                     │
│  STO-1  ✓ OWNED   +26 kg                           │
│  STO-2  [BUY 7,800 🪙]  +26→+40 kg                 │
│  STO-3  🔒 Clear L16    +54 kg                      │
│  STO-4  🔒 Clear L31    +70 kg                      │
│  STO-5  🔒 Clear L51    +92 kg                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  VEHICLE STATUS:  [✓ ACTIVE]                        │
│  (or)            [BUY — 28,000 🪙]                  │
│  (or)            [🔒 Clear L31 first]               │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ╔═══════════════════════════╗               │
│         ║   START FISHING  →        ║               │
│         ╚═══════════════════════════╝               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Garage Visual Style

```
BACKGROUND:
  Deep ocean gradient: #0D1B4B top → #001A33 bottom
  Subtle animated water caustic patterns at 8% opacity
  Slow particle drift (tiny bubbles floating up, 4px, very sparse)

VEHICLE DISPLAY AREA:
  Rounded rect card, #0A2540 background, 1px border rgba(100,200,255,0.2)
  Sprite centered, slight bob animation: y += sin(t * 0.04) * 3px
  Below sprite: vehicle name in bold white, captain name in light blue

STATS PANEL:
  Each stat row: label left, progress bar center, value right
  Bar fill color: teal #00BCD4 → cyan gradient
  Bar track: rgba(255,255,255,0.08)
  Bars animate from old value to new value (0.3s ease-out) when upgrade bought

UPGRADE ROWS:
  OWNED:     green background tint, ✓ icon, "OWNED" label
  BUYABLE:   blue button, shows "current → next" value delta
  LOCKED:    gray, lock icon, condition text in small muted text
  MAX:       gold background, "MAX" label, shimmer animation

VEHICLE STATUS BUTTON:
  ACTIVE:  solid green, "✓ ACTIVE", no action
  BUYABLE: solid blue gradient, coin icon + price
  LOCKED:  gray, lock icon + level requirement
  
START BUTTON:
  Very prominent, full width, rounded pill shape
  Deep teal to cyan gradient, slight glow
  Pulsing glow animation (scale 1→1.02→1, 2s loop)
  Disabled (gray, no pulse) only if current vehicle not owned —
  but since T1 is always owned, this should never happen

COIN DISPLAY (top):
  Gold coin icon + number, right-aligned
  Bounces briefly (+scale 1→1.3→1, 0.2s) when permanentCoins increases
  "How to earn" info icon opens a small tooltip explaining the 30% system
```

### 4.4 Garage Transitions

```
HOME → GARAGE:   slide up from bottom, 0.35s ease-out-cubic
GARAGE → GAME:   fade out Garage (0.2s), game canvas fades in (0.3s)
UPGRADE BOUGHT:  coin count ticks down, bar animates to new value,
                 button state changes to OWNED with green flash
VEHICLE SWITCH:  old sprite fades out (0.15s), new slides in from direction
                 of arrow pressed (left or right), stats panel updates
```

---

## PART 5: IN-GAME MARKET — Premium UI Spec

### 5.1 What Market Contains (and what it does NOT)

```
✓ PRESENT IN MARKET:
  Fuel (required to continue — exact price per level)
  Rod Repair +1 attempt  →  30 coins
  Rod Repair full        →  80 coins
  2× Points booster      →  90 coins  / 60s
  Magnet booster         → 110 coins  / 30s
  Slowdown booster       →  70 coins  / 20s
  Rod Shield booster     → 130 coins  / 1 level
  Lightener booster      → 100 coins  / 1 level
  Radar booster          → 120 coins  / 30s
  [EXIT TO GARAGE] button (with confirm popup)

✗ NOT IN MARKET (removed permanently):
  Vehicle upgrades
  Storage upgrades
  Rod upgrades
  Any equipment purchases
```

### 5.2 Market UI Layout

```
┌─────────────────────────────────────────────────────┐
│  ISLAND MARKET           Level 24   🪙 sessionCoins  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  YOUR CATCH:                                        │
│  [Fish inventory cards — horizontal scroll]         │
│  [Moon Fish 80🪙 8kg] [Leaf Fish 200🪙 1kg] ...      │
│  [SELL ALL  →  1,240 🪙]  [SELL SELECTED]           │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ⛽ FUEL  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Required to continue          170 🪙  [BUY FUEL]   │
│  (button grays until purchased, then turns green ✓) │
│                                                     │
│  🎣 ROD REPAIR  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Attempts: ●●○○○  (2/5)                             │
│  [+1 attempt — 30 🪙]    [Full repair — 80 🪙]       │
│                                                     │
│  ⚡ BOOSTERS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [2× Points 90🪙]   [Magnet 110🪙]   [Slowdown 70🪙] │
│  [Rod Shield 130🪙] [Lightener 100🪙] [Radar 120🪙]  │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [🏠 EXIT TO GARAGE]        [CONTINUE →]            │
│  (requires confirm popup)   (active only after fuel) │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 Market Visual Style

```
BACKGROUND:
  Warm island tavern feel. Wood-plank texture overlay at 15% opacity.
  Warm amber gradient: #1A0E00 → #2D1A00
  Gentle lantern-light flicker on edges (vignette, ±2% opacity, 3s period)

SECTION HEADERS:
  Full-width divider lines with icon + label centered
  Icon glows softly matching section color:
    Fuel     → amber/orange glow
    Repair   → blue glow
    Boosters → purple glow

FISH INVENTORY CARDS:
  Each fish: rounded card, fish sprite thumbnail, name, weight, value
  Tap to select (highlight with gold border), tap again to deselect
  "SELL ALL" button: large, green, shows total value
  After selling: cards animate out (scale 0, fade), coin counter ticks up

FUEL SECTION:
  Before purchase: red/amber warning style, price prominent
  After purchase: turns green, checkmark, "FUELED UP ✓"
  CONTINUE button disabled (grayed) until fuel purchased

ROD REPAIR:
  Visual cast attempt indicators: filled hooks = remaining, hollow = lost
  If full: buttons grayed, "ROD IS FULL" label
  +1 button disappears if at max

BOOSTER CARDS:
  2×3 grid of square cards, each with icon, name, price, duration
  Tap to buy: card briefly flashes gold, coin ticks down
  Already purchased this run: green "ACTIVE" badge on card

EXIT TO GARAGE BUTTON:
  Muted, bottom-left, small
  On press: popup "Exit this run? Your permanentCoins are safe.
            sessionCoins will be lost. Exit anyway? [CANCEL] [EXIT]"

CONTINUE BUTTON:
  Bottom-right, large, prominent
  Disabled (gray) if fuel not purchased
  Active (teal gradient with glow): "CONTINUE →"
```

---

## PART 6: IMPLEMENTATION NOTES FOR ANTIGRAVITY

```
1. ROD TIP ATTACHMENT
   On every frame, calculate rodTipCanvas = getRodTipOnCanvas(activeVehicle, boatX, boatY, displayWidth)
   All fishing line drawing starts from this point.
   All hook physics originate from this point.
   The pendulum pivot is also this point.

2. PERMANENT COINS TRANSFER
   Every time sessionCoins increases by amount X:
     permanentCoins += Math.floor(X * 0.30)
     save permanentCoins to localStorage immediately

3. VEHICLE SWITCHING IN GARAGE
   When player switches active vehicle:
     - Load that vehicle's owned STO/ROD upgrades from localStorage
     - Recalculate effectiveCapacity, effectiveSwingSpeed, etc.
     - Update sprite to matching PNG
     - Rod tip coordinates update to that vehicle's values

4. GARAGE MANDATORY FLOW
   Remove any direct game-start from home screen.
   "Play the Game" button → setScreen('garage')
   Garage "Start Fishing" → setScreen('game')
   Game over → setScreen('home') → player must press Play → Garage again

5. SCORE SYSTEM
   Track: totalCoinsEarned (sessionCoins before spending), maxLevelReached, kingFishCaught
   At game over: finalScore = totalCoinsEarned + (maxLevelReached × 50) + (kingFishCaught × 500)
   Compare to localStorage personalBest
   Display score on game over screen with breakdown

6. MARKET: SELL BEFORE FUEL
   Enforce order: fish must be sold before fuel price is shown as affordable
   Or: show price always, but gray out Continue until fuel bought
   Recommended: always show inventory first, then fuel, then boosters, then Continue

7. LOCALSTORAGE KEYS
   "fj_permanentCoins"          → number
   "fj_maxLevelReached"         → number
   "fj_personalBest"            → number (score)
   "fj_activeVehicle"           → string (vehicle id, e.g. "t1")
   "fj_vehicle_{id}_owned"      → boolean (one key per vehicle)
   "fj_vehicle_{id}_sto_{1-5}"  → boolean (one key per upgrade)
   "fj_vehicle_{id}_rod_{1-5}"  → boolean (one key per upgrade)
```

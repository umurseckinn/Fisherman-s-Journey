import { t } from '@/lib/i18n';
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT, FISH_ZONE_TOP } from './GameEngine';
import { FishClass } from './types';

export type TutorialStep =
  | 'idle'
  | 'warmup'
  | 'tnt_intro'
  | 'tnt_action'
  | 'rest_1'
  | 'net_intro'
  | 'net_action'
  | 'rest_2'
  | 'harpoon_intro'
  | 'harpoon_action'
  | 'rest_3'
  | 'anchor_intro'
  | 'anchor_action'
  | 'l2_storage'
  | 'l2_hook'
  | 'l2_final'
  | 'completed';

export interface TutorialState {
  step: TutorialStep;
  isFrozen: boolean;
  spotlightTarget: 'tnt_btn' | 'net_btn' | 'harpoon_btn' | 'anchor_btn' | 'sea_area' | 'target_fish' | 'storage_panel' | 'hook_panel' | 'character' | null;
  overlayText: string | null;
  overlayOpacity: number;
  allowedAction: 'tap_tnt' | 'drag_tnt' | 'tap_net' | 'tap_sea' | 'tap_harpoon' | 'aim_harpoon' | 'tap_anchor' | 'tap_anywhere' | null;
  targetFishIds: number[];
}

export class TutorialLevelManager {
  private engine: GameEngine;
  private state: TutorialState;
  private timer: number = 0;
  private hasSpawned: boolean = false;
  private stepTimeouts: number[] = [];
  private isLevel2: boolean = false;

  constructor(engine: GameEngine, isLevel2: boolean = false) {
    this.engine = engine;
    this.isLevel2 = isLevel2;
    this.state = {
      step: 'idle',
      isFrozen: false,
      spotlightTarget: null,
      overlayText: null,
      overlayOpacity: 0.75,
      allowedAction: null,
      targetFishIds: []
    };
  }

  public update(deltaTime: number) {
    if (this.state.step === 'idle') {
      if (this.isLevel2) {
        this.setStep('l2_storage');
        this.freezeGame();
        this.state.spotlightTarget = 'storage_panel';
        this.state.overlayText = t('tutorial.storage', "Watch your Storage limit! If your boat gets too heavy, it will sink.");
        this.state.overlayOpacity = 0.85;
        this.state.allowedAction = 'tap_anywhere';
      } else {
        this.setStep('warmup');
      }
      return;
    }

    if (this.state.isFrozen && !this.isLevel2) return;

    this.timer += deltaTime;

    switch (this.state.step) {
      case 'l2_storage':
        // Waiting for interaction
        break;

      case 'l2_hook':
        // Waiting for interaction
        break;

      case 'l2_final':
        // Waiting for interaction
        break;
      case 'warmup':
        if (!this.hasSpawned) {
          this.spawnFish('sakura', 1);
          this.schedule(() => this.spawnFish('bubble', 1), 900);
          this.schedule(() => this.spawnFish('bubble', 1), 2200);
          this.hasSpawned = true;
        }
        if (this.getActiveEntityCount() === 0 && this.timer > 3000) {
          this.setStep('tnt_intro');
        }
        break;

      case 'tnt_intro':
        if (!this.hasSpawned) {
          const ids = this.spawnFish('shell', 2, true);
          this.state.targetFishIds = ids;
          this.hasSpawned = true;
          this.schedule(() => {
            this.freezeGame();
            this.state.spotlightTarget = 'tnt_btn';
            this.state.overlayText = t('tutorial.tnt', "Tap the TNT to clear clusters!");
            this.state.overlayOpacity = 0.75;
            this.state.allowedAction = 'tap_tnt';
          }, 900);
        }
        break;

      case 'tnt_action':
        break;

      case 'rest_1':
        if (!this.hasSpawned) {
          this.spawnFish('bubble', 1);
          this.schedule(() => this.spawnFish('zap', 1), 900);
          this.schedule(() => this.spawnFish('zap', 1), 1600);
          this.schedule(() => this.spawnFish('sunken_boat', 1), 2400);
          this.hasSpawned = true;
        }
        if (this.getActiveEntityCount() === 0 && this.timer > 3000) {
          this.setStep('net_intro');
        }
        break;

      case 'net_intro':
        if (!this.hasSpawned) {
          this.spawnFish('sakura', 4, true);
          this.spawnFish('bubble', 4, true);
          this.hasSpawned = true;
        }
        if (!this.state.isFrozen && this.getVisibleFishCount() >= 4 && this.timer > 1000) {
          this.freezeGame();
          this.state.spotlightTarget = 'net_btn';
          this.state.overlayText = t('tutorial.net', "Too many fish? Tap The Net!");
          this.state.overlayOpacity = 0.75;
          this.state.allowedAction = 'tap_net';
        }
        break;

      case 'net_action':
        break;

      case 'rest_2':
        if (!this.hasSpawned) {
          this.spawnFish('shell', 1);
          this.schedule(() => this.spawnFish('bubble', 1), 800);
          this.schedule(() => this.spawnFish('bubble', 1), 1600);
          this.schedule(() => this.spawnFish('sakura', 1), 2400);
          this.hasSpawned = true;
        }
        if (this.getActiveEntityCount() === 0 && this.timer > 3000) {
          this.setStep('harpoon_intro');
        }
        break;

      case 'harpoon_intro':
        if (!this.hasSpawned) {
          const x = CANVAS_WIDTH + 90;
          const y = FISH_ZONE_TOP + (CANVAS_HEIGHT - FISH_ZONE_TOP) * 0.35;
          const id = this.spawnFishAt('zap', x, y);
          this.state.targetFishIds = [id];
          this.hasSpawned = true;
        }
        if (!this.state.isFrozen) {
          const targetId = this.state.targetFishIds[0];
          const fish = this.engine.getState().fishes.find(item => item.id === targetId);
          if (fish && fish.x - fish.radius >= 0 && fish.x + fish.radius <= CANVAS_WIDTH) {
            this.freezeGame();
            this.state.spotlightTarget = 'harpoon_btn';
            this.state.overlayText = t('tutorial.harpoon', "Fast targets need a Harpoon! Tap it!");
            this.state.overlayOpacity = 0.75;
            this.state.allowedAction = 'tap_harpoon';
          }
        }
        break;

      case 'harpoon_action':
        break;

      case 'rest_3':
        if (!this.hasSpawned) {
          this.spawnFish('bubble', 1);
          this.schedule(() => this.spawnFish('sakura', 1), 800);
          this.schedule(() => this.spawnFish('bubble', 1), 1500);
          this.hasSpawned = true;
        }
        if (this.getActiveEntityCount() === 0 && this.timer > 3000) {
          this.setStep('anchor_intro');
        }
        break;

      case 'anchor_intro':
        if (!this.hasSpawned) {
          this.spawnFish('bubble', 4, true);
          this.spawnFish('sakura', 4, true);
          this.hasSpawned = true;
        }
        if (!this.state.isFrozen && this.getVisibleFishCount() >= 4 && this.timer > 1000) {
          this.freezeGame();
          this.state.spotlightTarget = 'anchor_btn';
          this.state.overlayText = t('tutorial.anchor_intro', "Overwhelmed? Tap the Anchor to slow down time!");
          this.state.overlayOpacity = 0.75;
          this.state.allowedAction = 'tap_anchor';
        }
        break;

      case 'anchor_action': {
        const anchorTimer = this.engine.getState().anchorEffectTimerMs;
        if (anchorTimer > 0) {
          const seconds = Math.ceil(anchorTimer / 1000);
          this.state.overlayText = `${t('tutorial.time_slowed', 'TIME SLOWED!')} ${seconds}s`;
          this.state.overlayOpacity = 0.45;
        } else {
          this.state.overlayText = t('tutorial.time_restored', "TIME RESTORED!");
          if (this.timer > 1500) { // 1.5s delay after RESTORED
            this.setStep('completed');
            this.engine.scheduleTutorialArrival(500); // Trigger boat arrival
          }
        }
        break;
      }

      case 'completed':
        break;
    }
  }

  public handleInteraction(action: string, data?: any) {
    if (this.isLevel2) {
      if (action === 'skip_tutorial') {
        this.unfreezeGame();
        this.setStep('completed');
        return;
      }

      if (this.state.step === 'l2_storage') {
        if (action === 'next_step' || action === 'tap_anywhere') {
          this.state.step = 'l2_hook';
          this.state.spotlightTarget = 'hook_panel';
          this.state.overlayText = t('tutorial.l2_hook', "This is your Hook health. Hit too many hard obstacles, and it will snap!");
          this.state.overlayOpacity = 0.85;
        }
      } else if (this.state.step === 'l2_hook') {
        if (action === 'next_step' || action === 'tap_anywhere') {
          this.state.step = 'l2_final';
          this.state.spotlightTarget = 'character';
          this.state.overlayText = t('tutorial.l2_final', "You're all set Captain! Tap anywhere to cast your line and catch some fish!");
          this.state.overlayOpacity = 0.85;
        } else if (action === 'prev_step') {
          this.state.step = 'l2_storage';
          this.state.spotlightTarget = 'storage_panel';
          this.state.overlayText = t('tutorial.storage', "Watch your Storage limit! If your boat gets too heavy, it will sink.");
          this.state.overlayOpacity = 0.85;
        }
      } else if (this.state.step === 'l2_final') {
        if (action === 'next_step' || action === 'tap_anywhere') {
          this.unfreezeGame();
          this.setStep('completed');
        } else if (action === 'prev_step') {
          this.state.step = 'l2_hook';
          this.state.spotlightTarget = 'hook_panel';
          this.state.overlayText = t('tutorial.l2_hook', "This is your Hook health. Hit too many hard obstacles, and it will snap!");
          this.state.overlayOpacity = 0.85;
        }
      }
      return;
    }

    if (this.state.step === 'tnt_intro' && action === 'tap_tnt') {
      this.state.step = 'tnt_action';
      this.state.spotlightTarget = 'target_fish';
      this.state.overlayText = t('tutorial.tnt_drag', "Hold and drag over the shells to catch them both!");
      this.state.overlayOpacity = 0.75;
      this.state.allowedAction = 'drag_tnt';
    }
    else if (this.state.step === 'tnt_action' && action === 'drag_tnt_complete') {
      this.unfreezeGame();
      this.setStep('rest_1');
    }
    else if (this.state.step === 'net_intro' && action === 'tap_net') {
      this.state.step = 'net_action';
      this.state.spotlightTarget = 'sea_area';
      this.state.overlayText = t('tutorial.net_tap', "Tap anywhere on the sea to catch them all at once!");
      this.state.overlayOpacity = 0.45;
      this.state.allowedAction = 'tap_sea';
    }
    else if (this.state.step === 'net_action' && action === 'tap_sea_complete') {
      this.unfreezeGame();
      this.setStep('rest_2');
    }
    else if (this.state.step === 'harpoon_intro' && action === 'tap_harpoon') {
      this.state.step = 'harpoon_action';
      this.state.spotlightTarget = 'target_fish';
      this.state.overlayText = t('tutorial.harpoon_aim', "Hold, aim the trajectory, and release to strike!");
      this.state.overlayOpacity = 0.75;
      this.state.allowedAction = 'aim_harpoon';
    }
    else if (this.state.step === 'harpoon_action' && action === 'aim_harpoon_complete') {
      this.unfreezeGame();
      this.setStep('rest_3');
    }
    else if (this.state.step === 'anchor_intro' && action === 'tap_anchor') {
      this.state.step = 'anchor_action';
      this.state.spotlightTarget = 'sea_area';
      this.state.overlayText = t('tutorial.anchor_tap', "Tap the sea to drop anchor!");
      this.state.overlayOpacity = 0.45;
      this.state.allowedAction = 'tap_sea';
    }
    else if (this.state.step === 'anchor_action' && action === 'tap_sea_complete') {
      this.unfreezeGame();
      this.state.overlayText = "TIME SLOWED!";
      this.timer = 0; // Reset timer for anchor_action phase
    }
  }

  public getState() {
    return this.state;
  }

  public isActive() {
    return this.state.step !== 'completed';
  }

  private setStep(step: TutorialStep) {
    this.clearStepTimeouts();
    this.state.step = step;
    this.timer = 0;
    this.hasSpawned = false;
    this.state.spotlightTarget = null;
    this.state.overlayText = null;
    this.state.allowedAction = null;
    this.state.overlayOpacity = 0.75;
    this.state.targetFishIds = [];
  }

  private freezeGame() {
    this.state.isFrozen = true;
    this.engine.setTutorialFreeze(true);
  }

  private unfreezeGame() {
    this.state.isFrozen = false;
    this.state.spotlightTarget = null;
    this.state.overlayText = null;
    this.state.allowedAction = null;
    this.state.overlayOpacity = 0.75;
    this.engine.setTutorialFreeze(false);
  }

  private spawnFish(type: FishClass, count: number, closeTogether: boolean = false) {
    return this.engine.spawnTutorialFish(type, count, closeTogether);
  }

  private spawnFishAt(type: FishClass, x: number, y: number) {
    return this.engine.spawnTutorialFishAt(type, x, y);
  }

  private schedule(action: () => void, delay: number) {
    const id = window.setTimeout(action, delay);
    this.stepTimeouts.push(id);
  }

  private clearStepTimeouts() {
    this.stepTimeouts.forEach(id => window.clearTimeout(id));
    this.stepTimeouts = [];
  }

  private getActiveEntityCount() {
    return this.engine.getState().fishes.filter(fish => fish.type !== 'env_bubbles').length;
  }

  private getVisibleFishCount() {
    return this.engine.getState().fishes.filter(fish =>
      fish.type !== 'env_bubbles' &&
      fish.x >= 0 &&
      fish.x <= CANVAS_WIDTH
    ).length;
  }
}

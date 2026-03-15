import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const HAPTIC_TINY_MS = 50;
export const HAPTIC_SHORT_MS = 500;
export const HAPTIC_LONG_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nativeVibrate(durationMs: number): Promise<void> {
  const isLong = durationMs >= 900;
  if (isLong) {
    await Haptics.notification({ type: NotificationType.Warning });
  }

  const style = isLong ? ImpactStyle.Heavy : durationMs <= 80 ? ImpactStyle.Light : ImpactStyle.Medium;
  const interval = 120;
  const count = durationMs <= 80 ? 1 : Math.max(1, Math.round(durationMs / interval));

  for (let i = 0; i < count; i++) {
    await Haptics.impact({ style });
    if (i !== count - 1) await sleep(interval);
  }
}

function webVibrate(durationMs: number): void {
  if (typeof navigator === 'undefined') return;
  const maybeVibrate = (navigator as any).vibrate;
  if (typeof maybeVibrate !== 'function') return;
  try {
    maybeVibrate.call(navigator, durationMs);
  } catch {
    return;
  }
}

export function vibrate(durationMs: number): void {
  if (Capacitor.isNativePlatform()) {
    void nativeVibrate(durationMs);
    return;
  }
  webVibrate(durationMs);
}

export function vibrateTiny(): void {
  vibrate(HAPTIC_TINY_MS);
}

export function vibrateShort(): void {
  vibrate(HAPTIC_SHORT_MS);
}

export function vibrateLong(): void {
  vibrate(HAPTIC_LONG_MS);
}

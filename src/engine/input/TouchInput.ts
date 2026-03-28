import { GameState } from '../types';
import { doKick } from '../systems/kickSystem';
import { J_MAX, JOYSTICK_DEAD } from '@/config/constants';

export class TouchInput {
  private jActive = false;
  private jId: number | null = null;
  private jOriginX = 0;
  private jOriginY = 0;
  private kId: number | null = null;
  private gs: GameState | null = null;
  private getLocalPlayer: (() => import('../types').PlayerState | null) | null = null;

  // DOM elements
  private jBase: HTMLElement | null = null;
  private jKnob: HTMLElement | null = null;
  private zone: HTMLElement | null = null;

  // Expose for keyboard to know
  get isActive(): boolean { return this.jActive; }

  setGameState(gs: GameState | null): void { this.gs = gs; }

  attach(
    zone: HTMLElement,
    jBase: HTMLElement,
    jKnob: HTMLElement,
    getLocalPlayer: () => import('../types').PlayerState | null
  ): void {
    this.zone = zone;
    this.jBase = jBase;
    this.jKnob = jKnob;
    this.getLocalPlayer = getLocalPlayer;

    zone.addEventListener('touchstart', this.onTouchStart, { passive: false });
    zone.addEventListener('touchmove', this.onTouchMove, { passive: false });
    zone.addEventListener('touchend', this.onTouchEnd, { passive: false });
    zone.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  detach(): void {
    if (!this.zone) return;
    this.zone.removeEventListener('touchstart', this.onTouchStart);
    this.zone.removeEventListener('touchmove', this.onTouchMove);
    this.zone.removeEventListener('touchend', this.onTouchEnd);
    this.zone.removeEventListener('touchcancel', this.onTouchEnd);
  }

  private isKickZone(clientX: number): boolean {
    return clientX > window.innerWidth * 2 / 3;
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.gs) return;
    for (const t of Array.from(e.changedTouches)) {
      if (this.isKickZone(t.clientX)) {
        if (this.kId === null) {
          this.kId = t.identifier;
          this.gs.input.kickHeld = true;
          if (this.getLocalPlayer) {
            doKick(this.getLocalPlayer(), this.gs);
          }
        }
      } else {
        if (!this.jActive) {
          this.jActive = true;
          this.jId = t.identifier;
          this.jOriginX = t.clientX;
          this.jOriginY = t.clientY;
          if (this.jBase && this.jKnob) {
            this.jBase.style.left = (this.jOriginX - 55) + 'px';
            this.jBase.style.top = (this.jOriginY - 55) + 'px';
            this.jKnob.style.left = '55px';
            this.jKnob.style.top = '55px';
            this.jBase.style.display = 'flex';
          }
        }
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.gs) return;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.jId) {
        const dx = t.clientX - this.jOriginX;
        const dy = t.clientY - this.jOriginY;
        const dist = Math.hypot(dx, dy);
        const capped = Math.min(dist, J_MAX);
        const angle = Math.atan2(dy, dx);
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);

        if (this.jKnob) {
          this.jKnob.style.left = (55 + nx * capped) + 'px';
          this.jKnob.style.top = (55 + ny * capped) + 'px';
        }

        let pct = capped / J_MAX;
        if (pct < JOYSTICK_DEAD) pct = 0;
        else pct = (pct - JOYSTICK_DEAD) / (1 - JOYSTICK_DEAD);
        pct = Math.min(1, pct);

        this.gs.input.dx = pct > 0 ? nx * pct : 0;
        this.gs.input.dy = pct > 0 ? ny * pct : 0;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.jId) {
        this.jActive = false;
        this.jId = null;
        if (this.jBase) this.jBase.style.display = 'none';
        if (this.gs) {
          this.gs.input.dx = 0;
          this.gs.input.dy = 0;
        }
      }
      if (t.identifier === this.kId) {
        this.kId = null;
        if (this.gs) this.gs.input.kickHeld = false;
      }
    }
  };
}

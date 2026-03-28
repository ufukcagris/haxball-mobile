import { GameState } from '../types';
import { doKick } from '../systems/kickSystem';

export class KeyboardInput {
  private keys: Record<string, boolean> = {};
  private onPause: (() => void) | null = null;
  private gs: GameState | null = null;
  private getLocalPlayer: (() => import('../types').PlayerState | null) | null = null;

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore if typing in a text field
    const target = e.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }

    this.keys[e.key] = true;
    if ((e.key === 'p' || e.key === 'Escape') && this.gs && !this.gs.over) {
      this.onPause?.();
    }
    if ((e.key === ' ' || e.key === 'x') && this.gs && !this.gs.over && !e.repeat) {
      this.gs.input.kickHeld = true;
      if (this.getLocalPlayer) {
        doKick(this.getLocalPlayer(), this.gs);
      }
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    // Ignore if typing in a text field
    const target = e.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }

    this.keys[e.key] = false;
    if ((e.key === ' ' || e.key === 'x') && this.gs) {
      this.gs.input.kickHeld = false;
    }
  };

  attach(onPause: () => void, getLocalPlayer: () => import('../types').PlayerState | null): void {
    this.onPause = onPause;
    this.getLocalPlayer = getLocalPlayer;
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  detach(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  setGameState(gs: GameState | null): void {
    this.gs = gs;
  }

  applyKeyboard(): void {
    if (!this.gs || this.gs.paused || this.gs.over) return;
    let dx = 0, dy = 0;
    if (this.keys['ArrowLeft'] || this.keys['a']) dx = -1;
    if (this.keys['ArrowRight'] || this.keys['d']) dx = 1;
    if (this.keys['ArrowUp'] || this.keys['w']) dy = -1;
    if (this.keys['ArrowDown'] || this.keys['s']) dy = 1;
    if (dx !== 0 || dy !== 0) {
      const l = Math.hypot(dx, dy);
      this.gs.input.dx = dx / l;
      this.gs.input.dy = dy / l;
    } else if (!this.hasActiveTouch) {
      this.gs.input.dx = 0;
      this.gs.input.dy = 0;
    }
  }

  hasActiveTouch = false;
}

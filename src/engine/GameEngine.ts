'use client';

import { PITCH_CONFIGS, PitchSize } from '@/config/pitchConfigs';
import {
  PLAYER_RADIUS,
  BALL_RADIUS,
  KICK_POWER,
  FIXED_STEP,
  MAX_SCALE,
  MAX_PLAYER_SPEED,
  ACCEL_FACTOR,
  DECEL_FACTOR,
  JOYSTICK_DEAD,
  EXT_FRICTION,
} from '@/config/constants';
import {
  GameState,
  PlayerState,
  MultiPlayerInfo,
  HUDData,
  GameConfig,
  InputState,
  NormalizedState,
} from './types';
import { LobbySettings, NormalizedPlayer } from '@/multiplayer/types';
import { getSharedHost } from '@/components/screens/CreateRoomScreen';
import { createPlayer } from './entities/createPlayer';
import { createBall } from './entities/createBall';
import { updateBall } from './physics/ballPhysics';
import { resolvePlayerBallCollision } from './physics/playerBallCollision';
import { resolvePlayerPlayerCollision } from './physics/playerPlayerCollision';
import {
  resolveBallWallCollision,
  resolvePlayerPostCollision,
} from './physics/wallCollision';
import {
  clampPlayerToField,
  applyKickoffBarrier,
} from './physics/fieldClamping';
import { updateTimer, checkOvertime } from './systems/timerSystem';
import { checkGoal } from './systems/goalSystem';
import {
  spawnGoalParticles,
  updateParticles,
  spawnParticles,
} from './systems/particleSystem';
import { resetPositions } from './systems/kickoffSystem';
import { applyPlayerMovement } from './physics/playerMovement';
import { doKick } from './systems/kickSystem';
import { updateBot } from './ai/botAI';
import { render } from './renderer/GameRenderer';
import { KeyboardInput } from './input/KeyboardInput';
import { TouchInput } from './input/TouchInput';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private gameState: GameState | null = null;
  private animId: number | null = null;
  private lastTime = 0;
  private fixedAccum = 0;
  private myPeerId: string | null = null;
  private isMulti = false;
  private isHost = false;
  private remoteInputs: Record<
    string,
    { dx: number; dy: number; kickHeld: boolean }
  > = {};

  public onHUDUpdate: ((data: HUDData) => void) | null = null;
  public onGoal: ((team: 'red' | 'blue') => void) | null = null;
  public onEnd: (() => void) | null = null;
  public onSendGameState: ((state: GameState) => void) | null = null;
  public onSendInput: ((input: InputState) => void) | null = null;

  public keyboardInput: KeyboardInput;
  public touchInput: TouchInput;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;

    this.keyboardInput = new KeyboardInput();
    this.touchInput = new TouchInput();
  }

  getState(): GameState | null {
    return this.gameState;
  }
  getLocalPlayer(): PlayerState | null {
    if (!this.gameState) return null;
    return this.gameState.players.find((p: PlayerState) => p.isMe) || null;
  }

  resize(): void {
    if (this.gameState) {
      const gs = this.gameState;
      const pc = PITCH_CONFIGS[this.config.pitch as PitchSize];
      const W = this.canvas.width;
      const H = this.canvas.height;
      const oldScale = gs.scale;
      const oldOx = gs.ox;
      const oldOy = gs.oy;

      const newScale = Math.min((W - 20) / pc.fw, (H - 20) / pc.fh, MAX_SCALE);

      gs.scale = newScale;
      gs.fw = pc.fw * newScale;
      gs.fh = pc.fh * newScale;
      gs.ox = (W - gs.fw) / 2;
      gs.oy = (H - gs.fh) / 2;
      gs.pr = PLAYER_RADIUS * newScale;
      gs.br = BALL_RADIUS * newScale;
      gs.gw = pc.goalW * newScale;
      gs.gd = pc.goalDepth * newScale;
      gs.wt = pc.wallT * newScale;

      if (!oldScale || oldScale <= 0) return;

      const scaleRatio = newScale / oldScale;

      gs.ball.x = gs.ox + (gs.ball.x - oldOx) * scaleRatio;
      gs.ball.y = gs.oy + (gs.ball.y - oldOy) * scaleRatio;
      gs.ball.r = gs.br;

      gs.players.forEach((p: PlayerState) => {
        p.x = gs.ox + (p.x - oldOx) * scaleRatio;
        p.y = gs.oy + (p.y - oldOy) * scaleRatio;
        p.r = gs.pr;
      });
    }
  }

  initSoloGame(): void {
    const pc = PITCH_CONFIGS[this.config.pitch as PitchSize];
    const W = this.canvas.width;
    const H = this.canvas.height;
    const scale = Math.min((W - 20) / pc.fw, (H - 20) / pc.fh, MAX_SCALE);
    const fw = pc.fw * scale,
      fh = pc.fh * scale;
    const ox = (W - fw) / 2,
      oy = (H - fh) / 2;
    const pr = PLAYER_RADIUS * scale;
    const br = BALL_RADIUS * scale;

    const players: PlayerState[] = [
      createPlayer(ox + fw * 0.28, oy + fh / 2, pr, 'red', true),
    ];
    if (this.config.diff !== 'none') {
      players.push(
        createPlayer(ox + fw * 0.72, oy + fh / 2, pr, 'blue', false),
      );
    }

    this.gameState = {
      pc,
      scale,
      fw,
      fh,
      ox,
      oy,
      pr,
      br,
      gw: pc.goalW * scale,
      gd: pc.goalDepth * scale,
      wt: pc.wallT * scale,
      paused: false,
      over: false,
      goalCooldown: 0,
      concededTeam: null,
      timeLeft: this.config.time,
      timerRunning: this.config.time > 0,
      overtime: false,
      scoreRed: 0,
      scoreBlue: 0,
      goalLimit: this.config.goalLimit || 0,
      particles: [],
      ball: createBall(ox + fw / 2, oy + fh / 2, br),
      players,
      input: { dx: 0, dy: 0, kick: false, kickCharge: 0, kickHeld: false },
      kickCharging: false,
      prevInputDir: null,
      kickoff: { active: true, team: 'red' },
      isMulti: false,
    };
    this.isMulti = false;
    this.keyboardInput.setGameState(this.gameState);
    this.touchInput.setGameState(this.gameState);
    this.emitHUD();
  }

  initMultiGame(
    players: MultiPlayerInfo[],
    settings: LobbySettings,
    myPeerId: string,
    isHost: boolean,
  ): void {
    this.isMulti = true;
    this.myPeerId = myPeerId;
    this.isHost = isHost;
    this.config.pitch = settings.pitch;
    this.config.time = settings.time;

    const pc = PITCH_CONFIGS[settings.pitch as PitchSize];
    const W = this.canvas.width;
    const H = this.canvas.height;
    const scale = Math.min((W - 20) / pc.fw, (H - 20) / pc.fh, MAX_SCALE);
    const fw = pc.fw * scale,
      fh = pc.fh * scale;
    const ox = (W - fw) / 2,
      oy = (H - fh) / 2;
    const pr = PLAYER_RADIUS * scale;
    const br = BALL_RADIUS * scale;

    this.gameState = {
      pc,
      scale,
      fw,
      fh,
      ox,
      oy,
      pr,
      br,
      gw: pc.goalW * scale,
      gd: pc.goalDepth * scale,
      wt: pc.wallT * scale,
      paused: false,
      over: false,
      goalCooldown: 0,
      concededTeam: null,
      timeLeft: settings.time,
      timerRunning: settings.time > 0,
      overtime: false,
      scoreRed: 0,
      scoreBlue: 0,
      goalLimit: settings.goals || 0,
      particles: [],
      ball: createBall(ox + fw / 2, oy + fh / 2, br),
      players: players.map((p) => {
        const pl = createPlayer(0, 0, pr, p.team, true);
        pl.peerId = p.id;
        pl.nick = p.nick;
        pl.isMe = p.id === myPeerId;
        return pl;
      }),
      input: { dx: 0, dy: 0, kick: false, kickCharge: 0, kickHeld: false },
      kickCharging: false,
      prevInputDir: null,
      kickoff: { active: true, team: 'red' },
      isMulti: true,
    };

    resetPositions(this.gameState, 'red');

    this.remoteInputs = {};
    this.keyboardInput.setGameState(this.gameState);
    this.touchInput.setGameState(this.gameState);
    this.emitHUD();
  }

  updateMultiPlayers(players: MultiPlayerInfo[]): void {
    const gs = this.gameState;
    if (!gs || !gs.isMulti) return;

    const oldPlayers = [...gs.players];
    const newPlayers: PlayerState[] = [];

    const redPlayers = players.filter((p) => p.team === 'red');
    const bluePlayers = players.filter((p) => p.team === 'blue');

    const processList = (list: MultiPlayerInfo[], team: 'red' | 'blue') => {
      const reversed = [...list].reverse();
      reversed.forEach((p, i) => {
        const existing = oldPlayers.find((op) => op.peerId === p.id);
        const backX = team === 'red' ? gs.ox - gs.gd : gs.ox + gs.fw + gs.gd;
        const direction = team === 'red' ? 1 : -1;
        const targetX = backX + direction * (i * gs.pr * 2.2 + gs.pr);
        const targetY = gs.oy + gs.fh / 2;

        if (existing) {
          if (existing.team !== team) {
            existing.team = team;
            existing.x = targetX;
            existing.y = targetY;
            existing.vx = 0;
            existing.vy = 0;
          }
          // If team is same, don't override x/y to preserve kickoff/active positions
          existing.nick = p.nick;
          newPlayers.push(existing);
        } else {
          const pl = createPlayer(targetX, targetY, gs.pr, team, true);
          pl.peerId = p.id;
          pl.nick = p.nick;
          pl.isMe = p.id === (this.myPeerId || '');
          newPlayers.push(pl);
        }
      });
    };

    processList(redPlayers, 'red');
    processList(bluePlayers, 'blue');
    gs.players = newPlayers;
    this.emitHUD();
  }

  start(): void {
    this.lastTime = 0;
    this.fixedAccum = 0;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  pause(): void {
    if (this.gameState) this.gameState.paused = true;
  }

  resume(): void {
    if (this.gameState) {
      this.gameState.paused = false;
      this.lastTime = 0;
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  destroy(): void {
    this.stop();
    this.keyboardInput.detach();
    this.touchInput.detach();
    this.gameState = null;
  }

  setRemoteInput(
    peerId: string,
    input: { dx: number; dy: number; kickHeld: boolean },
  ): void {
    this.remoteInputs[peerId] = input;
  }

  applyRemoteState(msg: NormalizedState): void {
    const gs = this.gameState;
    if (!gs) return;

    const denormX = (n: number) => gs.ox + n * gs.fw;
    const denormY = (n: number) => gs.oy + n * gs.fh;
    const denormVx = (n: number) => n * gs.fw;
    const denormVy = (n: number) => n * gs.fh;

    gs.ball.x = denormX(msg.ball.nx);
    gs.ball.y = denormY(msg.ball.ny);
    gs.ball.vx = denormVx(msg.ball.nvx);
    gs.ball.vy = denormVy(msg.ball.nvy);

    msg.players.forEach((rp: NormalizedPlayer) => {
      let local = gs.players.find((p: PlayerState) => p.peerId === rp.peerId);
      const isActuallyMe = rp.peerId === (this.myPeerId || '');

      if (!local) {
        local = createPlayer(
          denormX(rp.nx),
          denormY(rp.ny),
          gs.pr,
          rp.team,
          false,
        );
        local.peerId = rp.peerId;
        local.isMe = isActuallyMe;
        gs.players.push(local);
      }

      local.x = denormX(rp.nx);
      local.y = denormY(rp.ny);
      local.vx = denormVx(rp.nvx);
      local.vy = denormVy(rp.nvy);
      local.kickFlash = rp.kickFlash;
      local.nick = rp.nick;
      local.team = rp.team;
      local.isMe = isActuallyMe;

      if (rp.chatMessage) {
        local.chatBubble = {
          message: rp.chatMessage,
          timer: rp.chatTimer || 0,
        };
      } else {
        local.chatBubble = undefined;
      }
    });

    if (msg.players.length < gs.players.length) {
      const hostPids = msg.players.map((p) => p.peerId);
      gs.players = gs.players.filter(
        (p) => p.peerId && hostPids.includes(p.peerId),
      );
    }

    gs.scoreRed = msg.scoreRed;
    gs.scoreBlue = msg.scoreBlue;
    gs.timeLeft = msg.timeLeft;
    gs.overtime = msg.overtime || false;
    gs.goalCooldown = msg.goalCooldown;
    gs.kickoff = msg.kickoff;
    this.emitHUD();
  }

  getNormalizedState(): NormalizedState | null {
    const gs = this.gameState;
    if (!gs) return null;

    const normX = (v: number) => (v - gs.ox) / gs.fw;
    const normY = (v: number) => (v - gs.oy) / gs.fh;
    const normVx = (v: number) => v / gs.fw;
    const normVy = (v: number) => v / gs.fh;

    return {
      ball: {
        nx: normX(gs.ball.x),
        ny: normY(gs.ball.y),
        nvx: normVx(gs.ball.vx),
        nvy: normVy(gs.ball.vy),
      },
      players: gs.players.map((p: PlayerState) => ({
        nx: normX(p.x),
        ny: normY(p.y),
        nvx: normVx(p.vx),
        nvy: normVy(p.vy),
        kickFlash: p.kickFlash,
        peerId: p.peerId || '',
        nick: p.nick || '?',
        team: p.team,
        chatMessage: p.chatBubble?.message,
        chatTimer: p.chatBubble
          ? p.chatBubble.timer > 1000
            ? 999999
            : p.chatBubble.timer
          : undefined,
      })),
      scoreRed: gs.scoreRed,
      scoreBlue: gs.scoreBlue,
      timeLeft: gs.timeLeft,
      overtime: gs.overtime,
      goalCooldown: gs.goalCooldown,
      kickoff: gs.kickoff,
    };
  }

  public setTyping(peerId: string, typing: boolean): void {
    if (!this.gameState) return;
    const p = this.gameState.players.find((x) => x.peerId === peerId);
    if (p) {
      if (typing) {
        p.chatBubble = { message: '...', timer: 999999 };
      } else {
        p.chatBubble = undefined;
      }
    }
  }

  public triggerChatBubble(peerId: string, message: string): void {
    if (!this.gameState) return;
    const p = this.gameState.players.find((x) => x.peerId === peerId);
    if (p) {
      p.chatBubble = { message, timer: 240 };
    }
  }

  private loop = (ts: number): void => {
    const gs = this.gameState;
    if (!gs || gs.paused || gs.over) return;

    if (this.lastTime === 0) this.lastTime = ts;
    let dt = ts - this.lastTime;
    this.lastTime = ts;
    if (dt > 100) dt = 100;

    this.fixedAccum += dt;
    while (this.fixedAccum >= FIXED_STEP) {
      this.fixedUpdate();
      this.fixedAccum -= FIXED_STEP;
    }

    render(this.ctx, gs);
    this.animId = requestAnimationFrame(this.loop);
  };

  private fixedUpdate(): void {
    const gs = this.gameState;
    if (!gs) return;

    this.keyboardInput.hasActiveTouch = this.touchInput.isActive;
    this.keyboardInput.applyKeyboard();

    const isMaster = !gs.isMulti || this.isHost;

    if (isMaster) {
      if (gs.goalCooldown > 0) {
        gs.goalCooldown--;
        if (gs.goalCooldown === 0 && !gs.over) {
          const teamToKickoff = gs.concededTeam || 'red';
          resetPositions(gs, teamToKickoff);
          gs.concededTeam = null;
          this.networkSync();
        }
      } else {
        if (updateTimer(gs)) {
          if (checkOvertime(gs)) {
            this.emitHUD();
            return;
          }
          this.endGame();
          return;
        }
      }
    } else {
      if (gs.goalCooldown > 0) gs.goalCooldown--;
    }

    const localPlayer = this.getLocalPlayer();

    gs.players.forEach((p: PlayerState) => {
      if (p.chatBubble) {
        p.chatBubble.timer--;
        if (p.chatBubble.timer <= 0) p.chatBubble = undefined;
      }
    });

    if (!localPlayer) {
      gs.players.forEach((pl: PlayerState) => {
        if (pl.kickFlash > 0) pl.kickFlash--;
      });
      if (gs.isMulti && this.isHost) this.applyRemoteInputsToPlayers();
      if (!gs.isMulti && this.config.diff !== 'none' && gs.players.length > 1) {
        updateBot(gs.players[1], gs, this.config.diff);
      }
      this.moveAllPlayers();
      this.processBallAndCollisions();
      this.networkSync();
      if (gs.goalCooldown === 0 && isMaster) this.checkGoalScored();
      return;
    }

    applyPlayerMovement(localPlayer, gs.input, gs);
    if (gs.input.kickHeld) doKick(localPlayer, gs);
    gs.players.forEach((pl: PlayerState) => {
      if (pl.kickFlash > 0) pl.kickFlash--;
    });

    if (gs.isMulti && this.isHost) this.applyRemoteInputsToPlayers();
    if (!gs.isMulti && this.config.diff !== 'none' && gs.players.length > 1) {
      updateBot(gs.players[1], gs, this.config.diff);
    }

    this.moveAllPlayers();
    this.processBallAndCollisions();
    this.networkSync();
    if (gs.goalCooldown === 0 && isMaster) this.checkGoalScored();
    this.emitHUD();
  }

  private moveAllPlayers(): void {
    const gs = this.gameState!;
    gs.players.forEach((pl: PlayerState) => {
      pl.extVx *= EXT_FRICTION;
      pl.extVy *= EXT_FRICTION;
      pl.x += pl.vx + pl.extVx;
      pl.y += pl.vy + pl.extVy;
      clampPlayerToField(pl, gs);
      resolvePlayerPostCollision(pl, gs);
      applyKickoffBarrier(pl, gs);
      if (pl.kickCd > 0) pl.kickCd--;
    });
  }

  private processBallAndCollisions(): void {
    const gs = this.gameState!;
    updateBall(gs.ball, gs);
    gs.players.forEach((p: PlayerState) =>
      resolvePlayerBallCollision(p, gs.ball, gs),
    );
    for (let i = 0; i < gs.players.length; i++) {
      for (let j = i + 1; j < gs.players.length; j++) {
        resolvePlayerPlayerCollision(gs.players[i], gs.players[j]);
      }
    }
    resolveBallWallCollision(gs.ball, gs);
    updateParticles(gs);
  }

  private applyRemoteInputsToPlayers(): void {
    const gs = this.gameState!;
    gs.players.forEach((p: PlayerState) => {
      if (p.isMe) return;
      const inp = this.remoteInputs[p.peerId || ''] || {
        dx: 0,
        dy: 0,
        kickHeld: false,
      };
      const maxSpd = MAX_PLAYER_SPEED * gs.scale;
      const inX = Math.abs(inp.dx) > JOYSTICK_DEAD ? inp.dx : 0;
      const inY = Math.abs(inp.dy) > JOYSTICK_DEAD ? inp.dy : 0;
      const moving = inX !== 0 || inY !== 0;
      const targetVx = inX * maxSpd * (inp.kickHeld ? 0.82 : 1);
      const targetVy = inY * maxSpd * (inp.kickHeld ? 0.82 : 1);
      const lerpF = moving ? ACCEL_FACTOR : DECEL_FACTOR;
      p.vx += (targetVx - p.vx) * lerpF;
      p.vy += (targetVy - p.vy) * lerpF;
      p.extVx *= EXT_FRICTION;
      p.extVy *= EXT_FRICTION;

      if (inp.kickHeld) {
        p.kickFlash = 12;
        const dist = Math.hypot(gs.ball.x - p.x, gs.ball.y - p.y);
        if (dist < p.r + gs.ball.r + 6 && p.kickCd <= 0) {
          const kx = gs.ball.x - p.x;
          const ky = gs.ball.y - p.y;
          const km = Math.hypot(kx, ky) || 1;
          gs.ball.vx += (kx / km) * KICK_POWER * gs.scale;
          gs.ball.vy += (ky / km) * KICK_POWER * gs.scale;
          p.kickCd = 16;
          spawnParticles(gs, gs.ball.x, gs.ball.y, '#00e5ff');
        }
      }
    });
  }

  private networkSync(): void {
    const gs = this.gameState;
    if (!gs) return;
    if (this.isHost && this.onSendGameState) {
      this.onSendGameState(gs);
    }
    if (gs.isMulti && !this.isHost && this.onSendInput) {
      this.onSendInput(gs.input);
    }
  }

  private checkGoalScored(): void {
    const gs = this.gameState;
    if (!gs) return;

    const result = checkGoal(gs);
    if (!result) return;

    const { scored, isGameEnd } = result;
    gs.concededTeam = scored === 'red' ? 'blue' : 'red';

    spawnGoalParticles(gs, scored);
    this.emitHUD();

    if (isGameEnd) {
      gs.goalCooldown = 999;
      this.onGoal?.(scored);
      setTimeout(() => this.endGame(), 2400);
    } else {
      this.onGoal?.(scored);
      gs.goalCooldown = 180;
    }
  }

  private endGame(): void {
    const gs = this.gameState;
    if (!gs || gs.over) return;
    gs.over = true;

    if (this.isMulti && this.isHost) {
      getSharedHost()?.broadcastEndGame(gs.scoreRed, gs.scoreBlue);
    }

    this.onEnd?.();
  }

  private emitHUD(): void {
    const gs = this.gameState;
    if (!gs) return;
    this.onHUDUpdate?.({
      scoreRed: gs.scoreRed,
      scoreBlue: gs.scoreBlue,
      timeLeft: gs.timeLeft,
      overtime: gs.overtime,
      time: this.config.time,
    });
  }
}

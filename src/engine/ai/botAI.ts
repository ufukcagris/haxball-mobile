import { PlayerState, GameState } from '../types';
import { BotDifficulty, getBotConfig } from '@/config/botDifficulty';
import { KICK_POWER } from '@/config/constants';
import { spawnParticles } from '../systems/particleSystem';

export function updateBot(bot: PlayerState, gs: GameState, difficulty: BotDifficulty): void {
  const ball = gs.ball;
  const S = gs.scale;
  const D = getBotConfig(difficulty, S);
  if (!D) return;

  const fieldCX = gs.ox + gs.fw * 0.5;
  const fieldCY = gs.oy + gs.fh * 0.5;
  const enemyGoalX = gs.ox;            // opponent goal (left)
  const KICK_RANGE = bot.r + ball.r + 4 * S;
  const dBall = Math.hypot(ball.x - bot.x, ball.y - bot.y);

  // Wall/corner detection
  const WM = 26 * S;
  const wTop = ball.y < gs.oy + WM;
  const wBot = ball.y > gs.oy + gs.fh - WM;
  const wLft = ball.x < gs.ox + WM;
  const wRgt = ball.x > gs.ox + gs.fw - WM;
  const corner = (wTop || wBot) && (wLft || wRgt);

  // Mode: defend if ball near own goal
  const defThreshold = gs.fw * 0.55;
  const defending = (ball.x > gs.ox + defThreshold) || wRgt;

  // Target point
  let tx: number, ty: number, rushDirect: boolean;

  if (corner) {
    const cx = gs.ox + gs.fw * 0.5;
    const cy = gs.oy + gs.fh * 0.5;
    const ex = cx - ball.x;
    const ey = cy - ball.y;
    const em = Math.hypot(ex, ey) || 1;
    const OFF = (bot.r + ball.r) * 1.5;
    tx = ball.x + (ex / em) * OFF;
    ty = ball.y + (ey / em) * OFF;
    rushDirect = false;
  } else if (defending) {
    tx = ball.x;
    ty = ball.y;
    rushDirect = true;
  } else {
    // Attack: position behind ball relative to enemy goal
    const tgX = enemyGoalX - ball.x;
    const tgY = fieldCY - ball.y;
    const tgD = Math.hypot(tgX, tgY) || 1;
    const tgNx = tgX / tgD;
    const tgNy = tgY / tgD;

    const OFF = (bot.r + ball.r) * 2.4;
    const apX = Math.max(gs.ox + bot.r + 1, Math.min(gs.ox + gs.fw - bot.r - 1, ball.x - tgNx * OFF));
    const apY = Math.max(gs.oy + bot.r + 1, Math.min(gs.oy + gs.fh - bot.r - 1, ball.y - tgNy * OFF));
    const dAp = Math.hypot(apX - bot.x, apY - bot.y);

    if (dAp < 18 * S || dBall < (bot.r + ball.r) * 3) {
      tx = ball.x; ty = ball.y; rushDirect = true;
    } else {
      tx = apX; ty = apY; rushDirect = false;
    }
  }

  // Movement
  const mdx = tx - bot.x;
  const mdy = ty - bot.y;
  const md = Math.hypot(mdx, mdy);

  if (md > 0.5) {
    const slowZone = rushDirect ? 0 : 16 * S;
    const spd = (!rushDirect && slowZone > 0 && md < slowZone)
      ? D.spd * (md / slowZone)
      : D.spd;
    const tvx = (mdx / md) * spd;
    const tvy = (mdy / md) * spd;
    bot.vx += (tvx - bot.vx) * D.accel;
    bot.vy += (tvy - bot.vy) * D.accel;
  } else {
    bot.vx *= 0.80;
    bot.vy *= 0.80;
  }

  // Kick: same direction as player (ball - bot)
  if (dBall <= KICK_RANGE && bot.kickCd <= 0) {
    const kx = ball.x - bot.x;
    const ky = ball.y - bot.y;

    let fkx = kx;
    let fky = ky;

    // In defense, bias toward field center
    if (defending && !corner) {
      const biasFactor = 0.4;
      fkx += (fieldCX - ball.x) * biasFactor / gs.fw;
      fky += (fieldCY - ball.y) * biasFactor / gs.fh;
    }

    // Difficulty spread
    fkx += (Math.random() - 0.5) * D.spread * gs.fh;
    fky += (Math.random() - 0.5) * D.spread * gs.fh;

    const fkm = Math.hypot(fkx, fky) || 1;
    ball.vx += (fkx / fkm) * KICK_POWER * S;
    ball.vy += (fky / fkm) * KICK_POWER * S;
    ball.lastKickedBy = 'blue';
    bot.kickFlash = 12;
    bot.kickCd = D.kickCd;
    spawnParticles(gs, ball.x, ball.y, '#00e5ff');
  }
}

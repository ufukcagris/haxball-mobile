import { GameState } from '../types';
import { POWER_SHOT_START } from '@/config/constants';

export function renderPlayers(ctx: CanvasRenderingContext2D, gs: GameState): void {
  const ball = gs.ball;

  gs.players.forEach(p => {
    // Shadow
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.r * 0.85, p.r * 0.9, p.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fill();

    const teamColor = p.team === 'red' ? '#ff3d71' : '#00e5ff';
    const isLocalPlayer = gs.isMulti ? !!p.isMe : p.isHuman;

    // Kick range circle (local player only)
    if (isLocalPlayer) {
      const kickRange = p.r + ball.r + 6;
      const ballDist = Math.hypot(ball.x - p.x, ball.y - p.y);
      const inRange = ballDist < kickRange + 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, kickRange, 0, Math.PI * 2);
      ctx.strokeStyle = inRange
        ? 'rgba(255,255,180,0.65)'
        : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = inRange ? 1.8 : 1.2;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Player body gradient
    const grad = ctx.createRadialGradient(
      p.x - p.r * 0.3, p.y - p.r * 0.3, 1,
      p.x, p.y, p.r
    );
    grad.addColorStop(0, p.team === 'red' ? '#ff8fa8' : '#80f2ff');
    grad.addColorStop(1, p.team === 'red' ? '#c0002b' : '#0099cc');

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = teamColor;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Kick flash ring
    if (p.kickFlash > 0) {
      const alpha = p.kickFlash / 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12 * Math.min(1, alpha);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Normal ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = teamColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Power shot indicator (local player only)
    if (isLocalPlayer && p.moveDuration > POWER_SHOT_START) {
      const charge = Math.min(1, (p.moveDuration - POWER_SHOT_START) / 80);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 6, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
      ctx.strokeStyle = `hsl(${30 - charge * 30}, 100%, 55%)`;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Nick text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, p.r * 0.6)}px 'Exo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayNick = gs.isMulti
      ? (p.nick || '?').substring(0, 3).toUpperCase()
      : (p.isHuman ? 'YOU' : 'BOT');
    ctx.fillText(displayNick, p.x, p.y);

    // Direction indicator
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > 0.5) {
      const nx = p.vx / spd;
      const ny = p.vy / spd;
      ctx.beginPath();
      ctx.moveTo(p.x + nx * (p.r + 2), p.y + ny * (p.r + 2));
      ctx.lineTo(p.x + nx * (p.r + 7), p.y + ny * (p.r + 7));
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

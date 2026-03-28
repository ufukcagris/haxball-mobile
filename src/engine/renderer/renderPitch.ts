import { GameState } from '../types';
import { roundRect } from './renderUtils';

export function renderPitch(ctx: CanvasRenderingContext2D, gs: GameState): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const { ox, oy, fw, fh, gw, gd, scale } = gs;
  const midY = oy + fh / 2;
  const halfG = gw / 2;

  // Background
  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, W, H);

  // Physical Arena Boundaries (Where the walls are)
  const outerXMin = ox - gd;
  const outerXMax = ox + fw + gd;
  const outerYMin = oy - gd;
  const outerYMax = oy + fh + gd;
  const arenaW = fw + gd * 2;
  const arenaH = fh + gd * 2;

  // Outer shadow & Main pitch background
  ctx.shadowColor = 'rgba(0,229,255,0.08)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#0d2015';
  roundRect(ctx, outerXMin, outerYMin, arenaW, arenaH, 12 * scale);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Grass stripes (Extended to full arena height)
  const stripeCount = 12;
  const sw = arenaW / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#0d2015' : '#0b1c12';
    ctx.fillRect(outerXMin + i * sw, outerYMin, sw, arenaH);
  }

  // Left goal
  ctx.fillStyle = 'rgba(255,61,113,.12)';
  ctx.strokeStyle = 'rgba(255,61,113,.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(ox - gd, midY - halfG, gd, gw);
  ctx.fill();
  ctx.stroke();

  // Right goal
  ctx.fillStyle = 'rgba(0,229,255,.12)';
  ctx.strokeStyle = 'rgba(0,229,255,.6)';
  ctx.beginPath();
  ctx.rect(ox + fw, midY - halfG, gd, gw);
  ctx.fill();
  ctx.stroke();

  // Goal posts
  const postR = 4;
  const posts: [number, number][] = [
    [ox, midY - halfG],
    [ox, midY + halfG],
    [ox + fw, midY - halfG],
    [ox + fw, midY + halfG],
  ];
  posts.forEach(([px, py], i) => {
    ctx.beginPath();
    ctx.arc(px, py, postR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = i < 2 ? '#ff3d71' : '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Field lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;

  // Border
  ctx.beginPath();
  ctx.rect(ox + 1, oy + 1, fw - 2, fh - 2);
  ctx.stroke();

  // Center line — highlight during kickoff
  ctx.beginPath();
  ctx.moveTo(ox + fw / 2, oy);
  ctx.lineTo(ox + fw / 2, oy + fh);
  if (gs.kickoff?.active) {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;

  // Center circle — kickoff team color glow
  const circleR = Math.min(fh, fw) * 0.14;
  ctx.beginPath();
  ctx.arc(ox + fw / 2, midY, circleR, 0, Math.PI * 2);
  if (gs.kickoff?.active) {
    const kColor = gs.kickoff.team === 'red'
      ? 'rgba(255,61,113,0.5)'
      : 'rgba(0,229,255,0.5)';
    ctx.strokeStyle = kColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = gs.kickoff.team === 'red' ? '#ff3d71' : '#00e5ff';
    ctx.shadowBlur = 10;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;

  // Center dot
  ctx.beginPath();
  ctx.arc(ox + fw / 2, midY, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Penalty areas
  const paW = fw * 0.15;
  const paH = fh * 0.5;
  ctx.beginPath();
  ctx.rect(ox, midY - paH / 2, paW, paH);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(ox + fw - paW, midY - paH / 2, paW, paH);
  ctx.stroke();

  // Corner flags
  const corners: [number, number][] = [
    [ox, oy], [ox + fw, oy], [ox, oy + fh], [ox + fw, oy + fh],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  });
}

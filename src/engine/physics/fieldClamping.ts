import { PlayerState, GameState } from '../types';

export function clampPlayerToField(player: PlayerState, gs: GameState): void {
  const { ox, oy, fw, fh } = gs;
  const OUT = player.r;

  if (player.x - player.r < ox - OUT) { player.x = ox - OUT + player.r; player.vx *= -0.4; }
  if (player.x + player.r > ox + fw + OUT) { player.x = ox + fw + OUT - player.r; player.vx *= -0.4; }
  if (player.y - player.r < oy - OUT) { player.y = oy - OUT + player.r; player.vy *= -0.4; }
  if (player.y + player.r > oy + fh + OUT) { player.y = oy + fh + OUT - player.r; player.vy *= -0.4; }
}

export function applyKickoffBarrier(player: PlayerState, gs: GameState): void {
  if (!gs.kickoff || !gs.kickoff.active) return;

  const cx = gs.ox + gs.fw / 2;
  const cy = gs.oy + gs.fh / 2;
  const cr = Math.min(gs.fh, gs.fw) * 0.14;

  const isKickoffTeam = player.team === gs.kickoff.team;

  function resolvePush(nx: number, ny: number, overlap: number): void {
    player.x += nx * overlap;
    player.y += ny * overlap;
    const dotVx = player.vx * nx + player.vy * ny;
    if (dotVx < 0) { player.vx -= dotVx * nx; player.vy -= dotVx * ny; }
    const dotExt = player.extVx * nx + player.extVy * ny;
    if (dotExt < 0) { player.extVx -= dotExt * nx; player.extVy -= dotExt * ny; }
  }

  const dx = player.x - cx;
  const dy = player.y - cy;
  const dist = Math.hypot(dx, dy);

  if (!isKickoffTeam) {
    // DEFENDING TEAM: Can't cross center line or enter center circle
    if (player.team === 'blue' && player.x - player.r < cx) {
      resolvePush(1, 0, cx - (player.x - player.r));
    }
    if (player.team === 'red' && player.x + player.r > cx) {
      resolvePush(-1, 0, (player.x + player.r) - cx);
    }
    if (dist < cr + player.r && dist > 0.01) {
      resolvePush(dx / dist, dy / dist, (cr + player.r) - dist);
    }
  } else {
    // KICKOFF TEAM: Free in own half, D-shape restriction in opponent half
    const oppEdgeX = player.team === 'red' ? player.x + player.r : player.x - player.r;
    const isOverLine = player.team === 'red' ? oppEdgeX > cx : oppEdgeX < cx;

    if (isOverLine) {
      if (Math.abs(dy) >= cr) {
        const overlap = player.team === 'red' ? oppEdgeX - cx : cx - oppEdgeX;
        resolvePush(player.team === 'red' ? -1 : 1, 0, overlap);
      } else {
        const maxAllowedDist = cr - player.r;
        if (dist > maxAllowedDist) {
          const lineOverlap = player.team === 'red' ? oppEdgeX - cx : cx - oppEdgeX;
          const arcOverlap = dist - maxAllowedDist;

          if (lineOverlap < arcOverlap) {
            resolvePush(player.team === 'red' ? -1 : 1, 0, lineOverlap);
          } else {
            resolvePush(-dx / dist, -dy / dist, arcOverlap);
          }
        }
      }
    }
  }
}

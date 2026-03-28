import { GameState } from '../types';

export function resetPositions(gs: GameState, concededTeam?: 'red' | 'blue'): void {
  const cx = gs.ox + gs.fw / 2;
  const cy = gs.oy + gs.fh / 2;

  gs.ball.x = cx;
  gs.ball.y = cy;
  gs.ball.vx = 0;
  gs.ball.vy = 0;
  gs.ball.angle = 0;

  // Conceding team gets kickoff
  gs.kickoff = { active: true, team: concededTeam || 'red' };

  const redPlayers = gs.players.filter(p => p.team === 'red');
  const bluePlayers = gs.players.filter(p => p.team === 'blue');

  const spaceRed = redPlayers.length > 0 ? gs.fh / (redPlayers.length + 1) : 0;
  const spaceBlue = bluePlayers.length > 0 ? gs.fh / (bluePlayers.length + 1) : 0;

  redPlayers.forEach((p, i) => {
    p.x = gs.ox + gs.fw * 0.28;
    p.y = gs.oy + spaceRed * (i + 1);
    p.vx = 0; p.vy = 0; p.extVx = 0; p.extVy = 0;
  });

  bluePlayers.forEach((p, i) => {
    p.x = gs.ox + gs.fw * 0.72;
    p.y = gs.oy + spaceBlue * (i + 1);
    p.vx = 0; p.vy = 0; p.extVx = 0; p.extVy = 0;
  });
}

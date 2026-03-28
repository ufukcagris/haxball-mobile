import { GameState, PlayerState } from '../types';

export function resetPositions(gs: GameState, teamToKickoff: 'red' | 'blue'): void {
  // Ball to center
  gs.ball.x = gs.ox + gs.fw / 2;
  gs.ball.y = gs.oy + gs.fh / 2;
  gs.ball.vx = 0;
  gs.ball.vy = 0;

  const redPlayers = gs.players.filter(p => p.team === 'red');
  const bluePlayers = gs.players.filter(p => p.team === 'blue');

  const layoutTeam = (players: PlayerState[], team: 'red' | 'blue') => {
    const baseX = team === 'red' ? gs.ox + gs.fw * 0.28 : gs.ox + gs.fw * 0.72;

    players.forEach((p, i) => {
      p.vx = 0; p.vy = 0;
      p.extVx = 0; p.extVy = 0;
      
      // Always one player in center
      if (players.length === 1) {
        p.x = baseX;
        p.y = gs.oy + gs.fh / 2;
      } else if (players.length === 2) {
        // One center, one offset
        p.x = baseX;
        p.y = i === 0 ? gs.oy + gs.fh / 2 : gs.oy + gs.fh * 0.3;
      } else {
        // Spread around center
        const spacing = gs.fh / (players.length + 1);
        p.x = baseX;
        p.y = gs.oy + spacing * (i + 1);
        
        // Ensure at least one is centered if it's an odd number
        if (players.length % 2 !== 0 && i === Math.floor(players.length / 2)) {
          p.y = gs.oy + gs.fh / 2;
        }
      }
    });
  };

  layoutTeam(redPlayers, 'red');
  layoutTeam(bluePlayers, 'blue');

  gs.kickoff = { active: true, team: teamToKickoff };
}

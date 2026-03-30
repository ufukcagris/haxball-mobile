import { PlayerState, GameState, InputState } from '../types';

export function getBotInput(
  bot: PlayerState,
  gs: GameState,
): InputState {
  if (gs.goalCooldown > 0 || gs.over) {
    return { dx: 0, dy: 0, kick: false, kickCharge: 0, kickHeld: false };
  }

  const ball = gs.ball;
  const S = gs.scale;
  const now = Date.now();

  // Predictive tracking based on hardcore logic
  const lookAheadFrames = 6;
  let px = ball.x + ball.vx * lookAheadFrames;
  let py = ball.y + ball.vy * lookAheadFrames;

  px = Math.max(gs.ox + ball.r, Math.min(gs.ox + gs.fw - ball.r, px));
  const topWall = gs.oy + ball.r;
  const botWall = gs.oy + gs.fh - ball.r;
  if (py < topWall) py = topWall + (topWall - py);
  else if (py > botWall) py = botWall - (py - botWall);

  const fieldCY = gs.oy + gs.fh * 0.5;
  const myGoalX = bot.team === 'blue' ? gs.ox + gs.fw : gs.ox;
  const enemyGoalX = bot.team === 'blue' ? gs.ox : gs.ox + gs.fw;
  const myGoalY = fieldCY;

  const realDistMeToBall = Math.hypot(ball.x - bot.x, ball.y - bot.y);
  const distBallToMyGoal = Math.hypot(myGoalX - ball.x, myGoalY - ball.y);

  let targetX = px;
  let targetY = py;
  let wantsToKick = false;
  let isAttacking = false;
  let targetGoalY = gs.oy + gs.fh * 0.5;

  const opponent = gs.players.find((p) => p.team !== bot.team && p.isHuman);
  const isBlue = bot.team === 'blue';

  // 1. KICKOFF
  if (gs.kickoff?.active) {
    if (gs.kickoff.team === bot.team) {
      // Santra yaparken topa dümdüz vurmamak (tahmin edilemez yerlere şut çekmek) için
      // skor gidişatını seed olarak kullanarak her yeni santrada farklı bir ofset belirliyoruz.
      const offsetSeed = gs.scoreRed * 13 + gs.scoreBlue * 17;
      const lateralOffset = Math.sin(offsetSeed) * 25 * S; // Sola veya sağa random Y açısı
      
      const dirX = isBlue ? 1 : -1;
      targetX = px + dirX * 3 * S; 
      targetY = py + lateralOffset;

      if (realDistMeToBall < bot.r + ball.r + 5 * S) wantsToKick = true;
    } else {
      // Rakibin santrası ise sadece sınırda bekle
      targetX = px;
      targetY = py;
      wantsToKick = false;
    }
  }
  // 2. DEFENDING / GOALTENDING
  else if (
    distBallToMyGoal < gs.fw * 0.55 &&
    (ball.vx > 0 === isBlue || distBallToMyGoal < 150 * S)
  ) {
    // Are we between the ball and our goal?
    // We check absolute horizontal distance to our goal line to avoid boundary/wall clamping logical errors!
    const distBotToGoalLine = Math.abs(bot.x - myGoalX);
    const distBallToGoalLine = Math.abs(ball.x - myGoalX);
    const amIOnCorrectSide = distBotToGoalLine <= distBallToGoalLine + 10 * S;

    if (!amIOnCorrectSide) {
      // DANGER: We are caught behind the ball!
      // We MUST NEVER poke it from behind, or we'll shoot it into our own net.

      const oppDistToBall = opponent
        ? Math.hypot(opponent.x - ball.x, opponent.y - ball.y)
        : Infinity;
      const isOpponentTooNear = opponent && oppDistToBall < 65 * S;

      // Eğer kullanıcı bota çok yakınsa ve bot hala arkadaysa, C-Curve ile uğaşma direkt duvara sektir.
      if (isOpponentTooNear && realDistMeToBall < 50 * S) {
        const pushDirY = py < fieldCY ? -1 : 1;
        targetX = px + (isBlue ? 10 * S : -10 * S);
        targetY = py + pushDirY * 100 * S;
        wantsToKick = true;
      } else {
        // C-Curve: arc TIGHTLY around the ball so we don't swing too wide.
        const pushDirY = py < fieldCY ? -1 : 1;
        const sweetX = px + (isBlue ? 6 * S : -6 * S);
        const sweetY = py - pushDirY * (bot.r + ball.r + 5 * S);

        const distToSweet = Math.hypot(sweetX - bot.x, sweetY - bot.y);
        if (distToSweet > 10 * S) {
          // Still overtaking: Do NOT kick, just arc tightly around
          targetX = sweetX;
          targetY = sweetY;
          wantsToKick = false;
        } else {
          // Overtook successfully! We are now between ball and net!
          targetX = px - (isBlue ? 50 * S : -50 * S);
          targetY = py + pushDirY * 100 * S;
          if (realDistMeToBall < 30 * S) wantsToKick = true;
        }
      }
    } else {
      // SAFE TO DEFEND (We are between ball and our goal)
      if (distBallToGoalLine < 50 * S && distBotToGoalLine < 60 * S) {
        // 2A. EMERGENCY GOAL LINE DEFENSE
        // The ball is in the penalty box. NO FANCY ANGLES. NO SIDE-STEPPING!
        // Perfectly match the ball's Y to prevent it slipping past, stick to the goal line.
        targetX = myGoalX;
        targetY = py;

        // Once aligned in Y, lunge forward violently to push it out!
        if (Math.abs(bot.y - py) < 15 * S) {
          targetX = px - (isBlue ? 100 * S : -100 * S);
          wantsToKick = true;
        } else if (realDistMeToBall < 25 * S) {
          wantsToKick = true;
        }
      } else if (realDistMeToBall < 70 * S) {
        // 2B. NORMAL CLEARANCE: Violently clear it towards the corners
        let clearAngle = Math.atan2(py - myGoalY, px - myGoalX);
        clearAngle += py < fieldCY ? 0.8 : -0.8;

        const lateralOffset = py < fieldCY ? 6 * S : -6 * S;

        const sweetX =
          px -
          Math.cos(clearAngle) * (bot.r + ball.r + 3 * S) +
          Math.cos(clearAngle + Math.PI / 2) * lateralOffset;
        const sweetY =
          py -
          Math.sin(clearAngle) * (bot.r + ball.r + 3 * S) +
          Math.sin(clearAngle + Math.PI / 2) * lateralOffset;

        const distToSweet = Math.hypot(sweetX - bot.x, sweetY - bot.y);
        if (distToSweet > 15 * S) {
          targetX = sweetX;
          targetY = sweetY;
        } else {
          // Sprint through parallel to clear angle, guaranteeing a lateral clip on the ball
          targetX = sweetX + Math.cos(clearAngle) * 100 * S;
          targetY = sweetY + Math.sin(clearAngle) * 100 * S;
        }
        if (realDistMeToBall < 25 * S) wantsToKick = true;
      } else {
        // 2C. INTERCEPT PATH (Shadowing) / GO AND GET IT
        const oppDistToBall = opponent
          ? Math.hypot(opponent.x - ball.x, opponent.y - ball.y)
          : Infinity;
        const isInOurHalf = distBallToMyGoal < gs.fw * 0.45;
        // Eğer top botun kendi kalesine botun kendisinden daha yakınsa (bot geçildiyse)
        const amIBehindPlay = Math.abs(bot.x - myGoalX) > Math.abs(px - myGoalX) + 5 * S;

        // EĞER rakip toptan uzaktaysa, VEYA bot topa rakiple yaklaşık aynı uzaklıktaysa,
        // VEYA BOT OYUNUN GERİSİNDE KALDIYSA (topu kaçırdı, arkada kaldıysa) topu kovala/dal!
        if (oppDistToBall > 90 * S || realDistMeToBall < oppDistToBall + 20 * S || amIBehindPlay) {
          targetX = px;
          targetY = py;
          if (realDistMeToBall < 30 * S) wantsToKick = true;
        } else if (
          opponent &&
          oppDistToBall < 50 * S &&
          isInOurHalf
        ) {
          // Jockeying: Backpedal dynamically between the ball and penalty box edge
          const penaltyBoxX = myGoalX + (isBlue ? -100 * S : 100 * S);
          targetX = isBlue
            ? Math.min(penaltyBoxX, (px + penaltyBoxX) / 2)
            : Math.max(penaltyBoxX, (px + penaltyBoxX) / 2);
          targetY = py; // myGoalY ile birleştirme, topla birebir yüzleş, köşelerde hapsolup donma!
        } else {
          // Normal Shadowing
          const angleToGoal = Math.atan2(myGoalY - py, myGoalX - px);
          const defenseDist = 35 * S;
          targetX = px + Math.cos(angleToGoal) * defenseDist;
          targetY = py + Math.sin(angleToGoal) * defenseDist;
        }
      }
    }
  }
  // 3. ATTACKING / DRIBBLING / CHASING
  else {
    isAttacking = true;
    // Determine dynamic Y target (Aim for corners or use Virtual Wall-Bounce)
    targetGoalY = fieldCY;

    if (opponent) {
      const isNearEnemyGoal = Math.abs(px - enemyGoalX) < gs.fw * 0.7; // Start aiming earlier
      const distOppToBall = Math.hypot(opponent.x - px, opponent.y - py);
      
      const isOpponentBlocking =
        distOppToBall < 120 * S &&
        Math.abs(opponent.x - enemyGoalX) < Math.abs(px - enemyGoalX);

      if (isNearEnemyGoal) {
        if (isOpponentBlocking) {
          const distToEnemyGoal = Math.hypot(enemyGoalX - px, fieldCY - py);
          const bounceChance = Math.sin(now / 1000 + px); // pseudo-random chance
          
          if (distToEnemyGoal > 150 * S && distToEnemyGoal < gs.fw * 0.8 && bounceChance > 0) {
             const topSanalKaleY = gs.oy - (fieldCY - gs.oy);
             const bottomSanalKaleY = (gs.oy + gs.fh) + ((gs.oy + gs.fh) - fieldCY);
             
             if (opponent.y < py) {
               targetGoalY = bottomSanalKaleY;
             } else {
               targetGoalY = topSanalKaleY;
             }
          } else {
            if (opponent.y < py) {
                targetGoalY = fieldCY + 35 * S;
            } else {
                targetGoalY = fieldCY - 35 * S;
            }
          }
        } else {
          // Engelleme yoksa bile kalenin hafif köşelerine atarak temiz isabet sağla.
          if (opponent.y < fieldCY) targetGoalY = fieldCY + 15 * S;
          else targetGoalY = fieldCY - 15 * S;
        }
      }
    }

    let pushAngle = Math.atan2(targetGoalY - py, enemyGoalX - px);

    // DYNAMIC FAKE-OUTS (Kırık Çalımlar)
    if (opponent && realDistMeToBall < 40 * S) {
      const distOppToBall = Math.hypot(opponent.x - px, opponent.y - py);
      if (distOppToBall < 100 * S) {
        const fakeTimer = now % 2000;
        if (fakeTimer < 400) {
          pushAngle -= 1.2;
        } else if (fakeTimer < 800) {
          pushAngle += 1.2;
        }
      }
    }

    // Angled Kicks (Cut shots)
    let lateralOffset = 0;
    const distToEnemyGoal = Math.hypot(enemyGoalX - px, fieldCY - py);
    if (distToEnemyGoal < gs.fw * 0.45) {
       lateralOffset = 0;
    } else {
       lateralOffset = targetGoalY > py ? -2 * S : 2 * S;
    }

    const sweetX =
      px -
      Math.cos(pushAngle) * (bot.r + ball.r + 2 * S) +
      Math.cos(pushAngle + Math.PI / 2) * lateralOffset;
    const sweetY =
      py -
      Math.sin(pushAngle) * (bot.r + ball.r + 2 * S) +
      Math.sin(pushAngle + Math.PI / 2) * lateralOffset;

    const distToSweet = Math.hypot(sweetX - bot.x, sweetY - bot.y);

    // Top sürme esnasında "sadece düz itmeyi" engellemek için, topun tam itme açısına oturmasını bekle
    const botToBallCurrentAngle = Math.atan2(py - bot.y, px - bot.x);
    let alignmentError = Math.abs(botToBallCurrentAngle - pushAngle);
    if (alignmentError > Math.PI) alignmentError = 2 * Math.PI - alignmentError;

    // Instead of stopping behind the ball, push THROUGH the ball ONLY when properly aligned!
    if (distToSweet > 15 * S || alignmentError > 0.35) {
      targetX = sweetX;
      targetY = sweetY; // Sprint yok, Y ekseninde (lateral) kendini çekerek hedefe nişanlan
    } else {
      // We are lined up diagonally! Full sprint through the side of the ball.
      targetX = sweetX + Math.cos(pushAngle) * 100 * S;
      targetY = sweetY + Math.sin(pushAngle) * 100 * S;
    }
  }

  // Always attempt to kick if physical contact is imminent and we are attacking or clearing
  if (realDistMeToBall < bot.r + ball.r + 6 * S) {
    if (isAttacking && (!gs.kickoff || !gs.kickoff.active)) {
      // Dribbling Mechanism
      const distToEnemyGoal = Math.hypot(enemyGoalX - px, fieldCY - py);
      const oppDist = opponent
        ? Math.hypot(opponent.x - bot.x, opponent.y - bot.y)
        : Infinity;

      // HİZALANMA VE ORTA SAHA KONTROLÜ
      const angleBotToBall = Math.atan2(py - bot.y, px - bot.x);
      const angleBallToGoal = Math.atan2(targetGoalY - py, enemyGoalX - px); 
      let angleDiff = Math.abs(angleBotToBall - angleBallToGoal);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      const isAlignedForShot = angleDiff < 0.3; 
      const isPastMidfield = isBlue ? px > gs.ox + gs.fw * 0.45 : px < gs.ox + gs.fw * 0.55;
      const inShootingRange = distToEnemyGoal < gs.fw * 0.6; 
      
      const opponentPressuring = oppDist < 90 * S; // Rakip yaklaştı/baskı yapıyor!
      const isGoalMouth = distToEnemyGoal < 150 * S; // Kale ağzındayız (şut gecikmesin)

      // Rakip (sen) şut yolunu/açısını kapatıyor mu? (Bot'un önünde mi ve Y olarak tehlike bölgesinde mi?)
      const isOpponentInWay = opponent && (isBlue ? opponent.x > bot.x : opponent.x < bot.x) && Math.abs(opponent.y - py) < 150 * S;

      if (opponentPressuring) {
        wantsToKick = true; // Rakip bana YAKLAŞTI! Bekleme, yanından kaleye (Aim Assist'e) zımbala!
      } else if (isGoalMouth) {
        wantsToKick = true; // Kalenin dibindeysek ince hizalanma için vakit kaybetme (topu kaleye sürüp durma), VUR!
      } else if (inShootingRange && isPastMidfield && isAlignedForShot && !isOpponentInWay) {
        wantsToKick = true; // Kalede/Açıda kisme YOKSA, orta sahayı geçer geçmez hizalandıysan uzaktan FÜZEYİ YE!
      } else {
        wantsToKick = false; // Kalede adam varsa (açı kapalıysa) bana YAKLAŞANA KADAR şut çekme, sürmeye devam et!
      }
    } else {
      // Defans, kickoff veya C-Curve durumlarında topa temas edince
      const oppDist = opponent
        ? Math.hypot(opponent.x - bot.x, opponent.y - bot.y)
        : Infinity;
      
      const distBallToMyGoal = Math.hypot(myGoalX - ball.x, myGoalY - ball.y);

      if (!gs.kickoff?.active && oppDist > 90 * S && distBallToMyGoal > gs.fw * 0.35) {
        // Kendi kalemize tehlikeli derecede yakın DEĞİLSEK ve rakip uzaksa dribling ile çık
        wantsToKick = false;
      } else {
        // Kendi kalemizdeyken, rakip baskısında veya kickoff anında riske girme KESİNLİKLE vur/uzaklaştır
        wantsToKick = true;
      }
    }
  }

  // --- UN-STUCK PATHFINDING FOR GOAL POSTS ---
  // If the bot is inside a goal net, and its target is behind the posts, it gets stuck.
  // We explicitly route it through the center of the goal entrance to exit the net!
  const isInsideOwnGoal = isBlue ? bot.x > myGoalX : bot.x < myGoalX;
  const isInsideEnemyGoal = isBlue ? bot.x < enemyGoalX : bot.x > enemyGoalX;

  const routeAroundPost = (goalX: number, exitXDir: number) => {
    if (targetY < fieldCY - 45 * S || targetY > fieldCY + 45 * S) {
      targetY = fieldCY; // Aim for the center of the open goal posts
      targetX = goalX + exitXDir * 20 * S; // Move outwards into the field
    }
  };

  if (isInsideOwnGoal) {
    routeAroundPost(myGoalX, isBlue ? -1 : 1);
  } else if (isInsideEnemyGoal) {
    routeAroundPost(enemyGoalX, isBlue ? 1 : -1);
  }

  // --- COMPUTE JOYSTICK INPUT --- (dx, dy from -1.0 to 1.0)
  let dx = targetX - bot.x;
  let dy = targetY - bot.y;

  const mag = Math.hypot(dx, dy);
  if (mag > 0) {
    const precisionZone = 5 * S; // Very narrow precision zone, mostly run full speed
    const factor = Math.min(mag / precisionZone, 1.0);
    dx = (dx / mag) * factor;
    dy = (dy / mag) * factor;
  }

  // Removed outdated easy difficulty randomness

  return {
    dx,
    dy,
    kick: wantsToKick,
    kickCharge: wantsToKick ? 1 : 0,
    kickHeld: wantsToKick,
  };
}
